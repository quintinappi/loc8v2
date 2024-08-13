'use client'

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';

export default function ClockInHistory() {
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
    <div>
      <h2>Clock History</h2>
      {clockIns.map(clockIn => (
        <div key={clockIn.id} className="bg-gray-800 p-4 rounded-lg mb-4">
          <p>{clockIn.timestamp.toLocaleString()} - {clockIn.type.toUpperCase()}</p>
          {clockIn.locationName ? (
            <p>Location: {clockIn.locationName}</p>
          ) : (
            <p>No location data</p>
          )}
          {clockIn.latitude && clockIn.longitude && (
            <div className="w-full h-48 mt-2">
              <MapContainer center={[clockIn.latitude, clockIn.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[clockIn.latitude, clockIn.longitude]} />
              </MapContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}