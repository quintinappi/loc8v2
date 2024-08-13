import { useState, useEffect, useRef } from 'react';
import { addClocking, getUnsynced } from '../app/utils/indexedDB';
import { clockInOut } from '@/app/utils/firebaseUtils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { reverseGeocode } from '../utils/reverseGeocode';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [status, setStatus] = useState('CLOCKED OUT');
  const [lastAction, setLastAction] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hoursToday, setHoursToday] = useState(0);
  const [hoursThisWeek, setHoursThisWeek] = useState(0);
  const [hoursLastMonth, setHoursLastMonth] = useState(0);
  const { user } = useAuth();
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const toastShownRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchLatestClockIn();
    calculateHours();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      checkUserProfile();
    }
    return () => {
      toastShownRef.current = false; // Reset when component unmounts
    };
  }, [user]);

  async function checkUserProfile() {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (!userData.firstName || !userData.lastName) {
        setProfileIncomplete(true);
        if (!toastShownRef.current) {
          toast.error('Please complete your profile details', {
            duration: 5000,
            action: {
              label: 'Go to Profile',
              onClick: () => {
                window.location.href = '/profile';
              }
            }
          });
          toastShownRef.current = true;
        }
      }
    }
  }

  async function fetchLatestClockIn() {
    if (!user) return;

    const q = query(
      collection(db, 'clockIns'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const latestClockIn = querySnapshot.docs[0].data();
      setStatus(latestClockIn.type === 'in' ? 'CLOCKED IN' : 'CLOCKED OUT');
      setLastAction(latestClockIn.timestamp.toDate());
    }
  }

  async function calculateHours() {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const monthStart = new Date(today);
    monthStart.setDate(1);

    const q = query(
      collection(db, 'clockIns'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    let totalMillisecondsToday = 0;
    let totalMillisecondsThisWeek = 0;
    let totalMillisecondsLastMonth = 0;
    let lastClockIn = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp.toDate();

      if (data.type === 'in') {
        lastClockIn = timestamp;
      } else if (data.type === 'out' && lastClockIn) {
        const duration = timestamp - lastClockIn;
        if (timestamp >= today) {
          totalMillisecondsToday += duration;
        }
        if (timestamp >= weekStart) {
          totalMillisecondsThisWeek += duration;
        }
        if (timestamp >= monthStart) {
          totalMillisecondsLastMonth += duration;
        }
        lastClockIn = null;
      }
    });

    setHoursToday((totalMillisecondsToday / (1000 * 60 * 60)).toFixed(2));
    setHoursThisWeek((totalMillisecondsThisWeek / (1000 * 60 * 60)).toFixed(2));
    setHoursLastMonth((totalMillisecondsLastMonth / (1000 * 60 * 60)).toFixed(2));
  }

  async function handleClockInOut() {
    if (!user) return;

    const newStatus = status === 'CLOCKED OUT' ? 'CLOCKED IN' : 'CLOCKED OUT';
    const type = newStatus === 'CLOCKED IN' ? 'in' : 'out';

    try {
      console.log('Attempting to clock', type);

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      let locationName = 'Unknown location';

      try {
        locationName = await reverseGeocode(latitude, longitude);
      } catch (error) {
        console.error('Error reverse geocoding:', error);
      }

      const docRef = await addDoc(collection(db, 'clockIns'), {
        userId: user.uid,
        type: type,
        timestamp: serverTimestamp(),
        latitude: latitude,
        longitude: longitude,
        location: `${latitude}, ${longitude}`,
        locationName: locationName
      });

      console.log('Successfully clocked', type, 'Document ID:', docRef.id);
      setStatus(newStatus);
      setLastAction(new Date());
      toast.success(`Successfully clocked ${type} from ${locationName}`);
      fetchLatestClockIn(); // Refresh the latest clock-in after a new entry
    } catch (error) {
      console.error('Error during clocking:', error);
      toast.error(`Failed to clock ${type}: ${error.message}`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4"
    >
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <motion.div className="space-y-2" layout>
        <p className="text-lg font-semibold text-gray-700">Current Status: <span className="font-bold text-blue-600">{status}</span></p>
        <p className="text-gray-600">Last Action: {lastAction ? lastAction.toLocaleString() : 'None'}</p>
      </motion.div>
      <motion.div className="space-y-2" layout>
        <p className="text-gray-700">Hours worked today: <span className="font-semibold">{hoursToday}</span></p>
        <p className="text-gray-700">Hours worked this week: <span className="font-semibold">{hoursThisWeek}</span></p>
        <p className="text-gray-700">Hours worked last month: <span className="font-semibold">{hoursLastMonth}</span></p>
      </motion.div>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClockInOut}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {status === 'CLOCKED OUT' ? 'Clock In' : 'Clock Out'}
      </motion.button>
      {!isOnline && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm"
        >
          You are offline. Clocking will sync when online.
        </motion.p>
      )}
      <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
        <Link href="/history" className="text-blue-500 hover:text-blue-700">
          View Clocking History
        </Link>
      </motion.div>
      {profileIncomplete && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Profile Incomplete</p>
          <p>Please complete your profile details.</p>
          <Link href="/profile" className="text-blue-500 hover:underline">
            Go to Profile
          </Link>
        </div>
      )}
    </motion.div>
  );
}