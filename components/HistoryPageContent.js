import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { reverseGeocode } from '../utils/reverseGeocode';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./Map'), {
  ssr: false
});

export default function HistoryPageContent() {
  const [clockIns, setClockIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchClockIns = useCallback(async () => {
    setLoading(true);
    try {
      const clockInsRef = collection(db, 'clockIns');
      const q = query(
        clockInsRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const clockInsData = await Promise.all(querySnapshot.docs.map(async doc => {
        const data = doc.data();
        let nearestTown = 'Unknown location';
        if (data.latitude && data.longitude) {
          try {
            nearestTown = await reverseGeocode(data.latitude, data.longitude);
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }
        }
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
          nearestTown
        };
      }));
      setClockIns(clockInsData);
    } catch (err) {
      console.error("Error fetching clock-ins:", err);
      setError("Failed to load clock-in history.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchClockIns();
    }
  }, [user, fetchClockIns]);

  if (loading) {
    return <p className="text-center mt-8 text-white">Loading clock-in history...</p>;
  }

  if (error) {
    return <p className="text-center mt-8 text-white">{error}</p>;
  }

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Personal Clocking History</h2>
      <div className="space-y-4">
        {clockIns.map((clockIn) => (
          <div key={clockIn.id} className="bg-gray-700 p-4 rounded-lg flex flex-col md:flex-row items-center">
            <div className="flex-grow mb-4 md:mb-0 md:mr-4">
              <p className="text-white text-lg font-semibold">
                {clockIn.timestamp.toLocaleString()} - {clockIn.type}
              </p>
              <p className="text-gray-300">{clockIn.nearestTown || 'Unknown location'}</p>
            </div>
            <div className="w-full md:w-64 h-48">
              {clockIn.latitude && clockIn.longitude ? (
                <DynamicMap clockIn={clockIn} />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white">
                  No location data
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}