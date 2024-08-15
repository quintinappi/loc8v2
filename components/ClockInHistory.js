'use client'

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';

export default function ClockingHistory() {
  const [clockIns, setClockIns] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'clockIns'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clockInsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }));
      setClockIns(clockInsData);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-black">Clock History</h1> 
      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Personal</button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded">Employee</button>
        </div>
        {clockIns.map(clockIn => (
          <div key={clockIn.id} className="bg-gray-700 p-4 rounded-lg mb-4">
            <p className="text-white">{clockIn.timestamp.toLocaleString()} - {clockIn.type.toUpperCase()}</p>
            {clockIn.latitude && clockIn.longitude ? (
              <div className="w-full h-48 mt-2">
                <MapContainer center={[clockIn.latitude, clockIn.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[clockIn.latitude, clockIn.longitude]}>
                    <Popup>
                      {clockIn.locationName}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <p className="text-white">No location data</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}