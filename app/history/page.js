'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, getDoc, doc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import EmployeeClockings from '../../components/EmployeeClockings';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

function ClockEntry({ clockIn }) {
  let lat = 0, lon = 0;
  if (clockIn.location && typeof clockIn.location === 'string') {
    [lat, lon] = clockIn.location.split(',').map(coord => parseFloat(coord.trim()));
  } else if (clockIn.latitude && clockIn.longitude) {
    lat = parseFloat(clockIn.latitude);
    lon = parseFloat(clockIn.longitude);
  }

  const isClockIn = clockIn.type === 'CLOCKED IN';
  const bgColor = isClockIn ? 'bg-green-100' : 'bg-red-100';
  const borderColor = isClockIn ? 'border-green-500' : 'border-red-500';
  const textColor = isClockIn ? 'text-green-700' : 'text-red-700';

  const isValidCoordinate = (coord) => !isNaN(coord) && isFinite(coord);
  const hasValidCoordinates = isValidCoordinate(lat) && isValidCoordinate(lon);

  return (
    <div className={`${bgColor} ${borderColor} border-l-4 rounded-lg p-4 mb-4 shadow-md flex`}>
      {hasValidCoordinates ? (
        <div className="w-1/2 h-48 mr-4">
          <MapContainer key={`${lat},${lon}`} center={[lat, lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lon]} />
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
        <p className="text-sm text-gray-500 mt-2">
          {hasValidCoordinates ? `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}` : 'Location not available'}
        </p>
        {clockIn.locationName && (
          <p className="text-sm text-gray-500">Location: {clockIn.locationName}</p>
        )}
      </div>
    </div>
  ); 
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [clockIns, setClockIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (user) {
      // Check if user has admin role
      const checkAdminStatus = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setIsAdmin(userDoc.data()?.role === 'admin');
      };
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const clockInsRef = collection(db, 'clockIns');
    const q = query(
      clockInsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(12)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const clockInsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
          }));
          setClockIns(clockInsData);
          setLoading(false);
        } catch (err) {
          console.error("Error processing clock-in data:", err);
          setError("Error loading clock-in history. Please try again later.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching clock-in data:", err);
        setError("Error loading clock-in history. Please try again later.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return <p className="text-center mt-8 text-white">Please sign in to view clocking history.</p>;
  }

  if (loading) {
    return <p className="text-center mt-8 text-white">Loading clock-in history...</p>;
  }

  if (error) {
    return <p className="text-center mt-8 text-white">{error}</p>;
  }

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Clocking History</h2>
      <div className="mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'personal' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal History
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'employees' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}
          onClick={() => setActiveTab('employees')}
        >
          Employee Clockings
        </button>
      </div>
      {activeTab === 'personal' ? (
        <div className="space-y-4">
          {clockIns.map((clockIn) => (
            <ClockEntry key={clockIn.id} clockIn={clockIn} />
          ))}
        </div>
      ) : (
        <EmployeeClockings />
      )}
    </div>
  );
}