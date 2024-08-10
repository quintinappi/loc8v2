import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function EmployeeClockings() {
  const [clockIns, setClockIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError("You don't have permission to view employee clockings.");
      setLoading(false);
      return;
    }

    const clockInsRef = collection(db, 'clockIns');
    const q = query(
      clockInsRef,
      where('userId', '!=', user.uid),
      orderBy('userId'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const clockInsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        }));
        setClockIns(clockInsData);
        setLoading(false);
      } catch (error) {
        console.error("Error processing clock-in data:", error);
        setError("Error loading employee clocking data. Please try again later.");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching clock-in data:", error);
      setError("Error loading employee clocking data. Please try again later.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <p>Loading employee clocking data...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Recent Employee Clockings</h3>
      {clockIns.length === 0 ? (
        <p>No recent clockings found.</p>
      ) : (
        <div className="space-y-4">
          {clockIns.map((clockIn) => (
            <ClockEntry key={clockIn.id} clockIn={clockIn} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClockEntry({ clockIn }) {
  const [userName, setUserName] = useState("Name & Surname requested");

  useEffect(() => {
    const fetchUserName = async () => {
      const userDoc = await getDoc(doc(db, 'users', clockIn.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.firstName && userData.lastName) {
          setUserName(`${userData.firstName} ${userData.lastName}`);
        }
      }
    };
    fetchUserName();
  }, [clockIn.userId]);

  const isClockIn = clockIn.type === 'CLOCKED IN';
  const bgColor = isClockIn ? 'bg-green-100' : 'bg-red-100';
  const borderColor = isClockIn ? 'border-green-500' : 'border-red-500';
  const textColor = isClockIn ? 'text-green-700' : 'text-red-700';

  const hasValidCoordinates = clockIn.latitude && clockIn.longitude;

  return (
    <div className={`${bgColor} ${borderColor} border-l-4 rounded-lg p-4 shadow-md flex`}>
      {hasValidCoordinates ? (
        <div className="w-1/2 h-48 mr-4">
          <MapContainer center={[clockIn.latitude, clockIn.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[clockIn.latitude, clockIn.longitude]} />
          </MapContainer>
        </div>
      ) : (
        <div className="w-1/2 h-48 mr-4 bg-gray-200 flex items-center justify-center text-gray-500">
          No map available
        </div>
      )}
      <div className="w-1/2 flex flex-col justify-center">
        <p className={`font-bold text-lg ${textColor}`}>{clockIn.type}</p>
        <p className="text-md text-gray-600">{clockIn.timestamp.toLocaleString()}</p>
        <p className="text-sm text-gray-500">User: {userName}</p>
        {hasValidCoordinates ? (
          <p className="text-sm text-gray-500">
            Coordinates: {clockIn.latitude.toFixed(6)}, {clockIn.longitude.toFixed(6)}
          </p>
        ) : (
          <p className="text-sm text-gray-500">Location not available</p>
        )}
        {clockIn.locationName && (
          <p className="text-sm text-gray-500">Location: {clockIn.locationName}</p>
        )}
      </div>
    </div>
  );
}