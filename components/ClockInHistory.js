'use client'

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function ClockEntry({ clockIn }) {
  const [lat, lon] = clockIn.location.split(',').map(coord => parseFloat(coord.trim()));
  const isClockIn = clockIn.type === 'CLOCKED IN';
  const bgColor = isClockIn ? 'bg-green-100' : 'bg-red-100';
  const borderColor = isClockIn ? 'border-green-500' : 'border-red-500';
  const textColor = isClockIn ? 'text-green-700' : 'text-red-700';

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-3 shadow-md flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className={`font-bold ${textColor}`}>{clockIn.type}</p>
          <p className="text-sm text-gray-600">{clockIn.timestamp.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex-grow w-full h-24 mb-2">
        <MapContainer center={[lat, lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lon]} />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 truncate">Coordinates: {clockIn.location}</p>
      <p className="text-xs text-gray-500 truncate">Location: {clockIn.locationName}</p>
    </div>
  );
}

export default function ClockInHistory({ userId }) {
  const [clockIns, setClockIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const clockInsRef = collection(db, 'clockIns');
    const q = query(
      clockInsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(12)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const clockInsData = snapshot.docs.map(doc => {
            const data = {
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp.toDate()
            };
            console.log("Fetched clock entry:", JSON.stringify(data, null, 2));
            return data;
          });
          console.log("All clock entries:", JSON.stringify(clockInsData, null, 2));
          setClockIns(clockInsData);
          setLoading(false);
        } catch (error) {
          console.error("Error processing clock-in data:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching clock-in data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <p className="text-gray-300">Loading your clocking history...</p>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-4">Recent Clock-ins</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {clockIns.map((clockIn) => (
          <ClockEntry key={`${clockIn.id}-${clockIn.type}`} clockIn={clockIn} />
        ))}
      </div>
    </div>
  );
}