import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clockInsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }));
      setClockIns(clockInsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clock-in data:", error);
      setError("Error loading employee clocking data. Please try again later.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Employee Clockings</h2>
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
                <Marker position={[clockIn.latitude, clockIn.longitude]}>
                  <Popup>
                    {clockIn.timestamp.toLocaleString()} - {clockIn.type}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}