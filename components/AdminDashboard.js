import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { reverseGeocode } from '../utils/reverseGeocode';

const AdminDashboard = () => {
  const [recentClockIns, setRecentClockIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.isAdmin) return;

    const clockInsRef = collection(db, 'clockIns');
    const q = query(clockInsRef, orderBy('timestamp', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const clockInsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const location = await reverseGeocode(data.latitude, data.longitude);
        return { id: doc.id, ...data, location };
      }));
      setRecentClockIns(clockInsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user || !user.isAdmin) return null;
  if (loading) return <p className="text-gray-300">Loading recent clock-ins...</p>;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Recent Clock-ins (All Users)</h2>
      <ul className="space-y-4">
        {recentClockIns.map((clockIn) => (
          <li key={clockIn.id} className="bg-gray-800 p-4 rounded-lg">
            <p>User: {clockIn.userId}</p>
            <p>Time: {new Date(clockIn.timestamp.toDate()).toLocaleString()}</p>
            <p>Type: {clockIn.type}</p>
            <p>Location: {clockIn.location}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;