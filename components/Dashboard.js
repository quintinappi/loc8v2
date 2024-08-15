import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getClockingData } from '../app/utils/api';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { reverseGeocode } from '../utils/reverseGeocode';
import { ToastContainer, toast } from 'react-toastify';
import Image from 'next/image';
import 'react-toastify/dist/ReactToastify.css';

const ProfileImage = ({ profilePic, firstName, lastName }) => {
  if (profilePic) {
    return (
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300">
        <Image 
          src={profilePic} 
          alt="Profile" 
          width={96} 
          height={96} 
          className="object-cover w-full h-full"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = "https://via.placeholder.com/96?text=Error"; 
          }}
        />
      </div>
    );
  }
  
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return (
    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-300">
      {initials}
    </div>
  );
};

export default function Dashboard() {
  const [status, setStatus] = useState('CLOCKED OUT');
  const [lastAction, setLastAction] = useState(null);
  const [hoursToday, setHoursToday] = useState(0);
  const [hoursThisWeek, setHoursThisWeek] = useState(0);
  const [hoursLastMonth, setHoursLastMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    if (user) {
      // Fetch user data
      const fetchUserData = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setProfilePic(userData.photoURL || null);
          setStatus(userData.clockingStatus || 'CLOCKED OUT');
        }
      };
      fetchUserData();

      // Fetch clocking data
      getClockingData(user.uid).then(data => {
        setLastAction(data.lastAction);
        setHoursToday(data.hoursToday);
        setHoursThisWeek(data.hoursThisWeek);
        setHoursLastMonth(data.hoursLastMonth);
      }).catch(error => {
        console.error('Error fetching clocking data:', error);
      });

      // Calculate hours worked
      calculateHoursWorked(user.uid);
    }
  }, [user]);

  const handleClockInOut = async () => {
    if (!user) return;

    setLoading(true);
    const clockInsRef = collection(db, 'clockIns');
    const now = new Date();
    const newStatus = status === 'CLOCKED OUT' ? 'CLOCKED IN' : 'CLOCKED OUT';

    // Get the user's current location
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const location = `${latitude}, ${longitude}`;
      const locationName = await reverseGeocode(latitude, longitude);

      try {
        await addDoc(clockInsRef, {
          userId: user.uid,
          type: newStatus,
          timestamp: now,
          latitude,
          longitude,
          location,
          locationName,
        });

        // Update user's document with the latest status
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { clockingStatus: newStatus });

        setStatus(newStatus);
        setLastAction(now.toISOString());

        // Show toast notification
        toast.success(`Successfully ${newStatus === 'CLOCKED IN' ? 'clocked in' : 'clocked out'} at ${locationName}`);

        // Recalculate hours worked
        calculateHoursWorked(user.uid);
      } catch (error) {
        console.error('Error clocking in/out:', error);
        toast.error('Error clocking in/out');
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error getting location:', error);
      toast.error('Error getting location');
      setLoading(false);
    });
  };

  const calculateHoursWorked = async (userId) => {
    const clockInsRef = collection(db, 'clockIns');
    const q = query(clockInsRef, where('userId', '==', userId), orderBy('timestamp', 'asc'));

    try {
      const querySnapshot = await getDocs(q);
      let totalMillisecondsToday = 0;
      let totalMillisecondsThisWeek = 0;
      let totalMillisecondsLastMonth = 0;
      let lastClockIn = null;

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp.toDate();

        if (data.type === 'CLOCKED IN') {
          lastClockIn = timestamp;
        } else if (data.type === 'CLOCKED OUT' && lastClockIn) {
          const duration = timestamp - lastClockIn;

          if (timestamp >= startOfToday) {
            totalMillisecondsToday += duration;
          }
          if (timestamp >= startOfWeek) {
            totalMillisecondsThisWeek += duration;
          }
          if (timestamp >= startOfLastMonth && timestamp <= endOfLastMonth) {
            totalMillisecondsLastMonth += duration;
          }

          lastClockIn = null;
        }
      });

      setHoursToday((totalMillisecondsToday / (1000 * 60 * 60)).toFixed(2));
      setHoursThisWeek((totalMillisecondsThisWeek / (1000 * 60 * 60)).toFixed(2));
      setHoursLastMonth((totalMillisecondsLastMonth / (1000 * 60 * 60)).toFixed(2));
    } catch (error) {
      console.error('Error calculating hours worked:', error);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 max-w-md mx-auto mt-10 ${loading ? 'opacity-50' : ''}`}>
      {/* Welcome section */}
      <div className="flex items-center mb-6 pb-4 border-b">
        <ProfileImage profilePic={profilePic} firstName={firstName} lastName={lastName} />
        <div className="ml-4">
          <h2 className="text-xl font-bold text-black">Welcome, {firstName} {lastName}</h2>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4 text-black">Dashboard</h1>
      <div className="space-y-2">
        <p className="text-lg text-black">
          Current Status: <span className="font-bold text-blue-600">{status}</span>
        </p>
        <p className="text-black">Last Action: {lastAction ? new Date(lastAction).toLocaleString() : 'N/A'}</p>
        <p className="text-black">Hours worked today: {hoursToday}</p>
        <p className="text-black">Hours worked this week: {hoursThisWeek}</p>
        <p className="text-black">Hours worked last month: {hoursLastMonth}</p>
      </div>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full bg-blue-500 text-white py-2 rounded-md mt-4 hover:bg-blue-600"
        onClick={handleClockInOut}
        disabled={loading}
      >
        {status === 'CLOCKED OUT' ? 'Clock In' : 'Clock Out'}
      </motion.button>
      <Link href="/history" className="block text-center text-blue-500 mt-4 hover:underline">
        View Clocking History
      </Link>
      <ToastContainer />
    </div>
  );
}