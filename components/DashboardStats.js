import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function DashboardStats({ userId }) {
  const [stats, setStats] = useState({ totalHours: 0, clockInsToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const clockInsRef = collection(db, 'clockIns');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        clockInsRef,
        where('userId', '==', userId),
        where('timestamp', '>=', today),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      let totalMilliseconds = 0;
      let lastClockIn = null;
      let clockInsToday = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clockInsToday++;

        if (data.type === 'CLOCKED IN') {
          lastClockIn = data.timestamp.toDate();
        } else if (data.type === 'CLOCKED OUT' && lastClockIn) {
          totalMilliseconds += data.timestamp.toDate() - lastClockIn;
          lastClockIn = null;
        }
      });

      const totalHours = (totalMilliseconds / (1000 * 60 * 60)).toFixed(2);

      setStats({ totalHours, clockInsToday });
      setLoading(false);
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-xl font-semibold mb-2 text-white">Today&apos;s Stats</h3>
      <p className="text-white">Total Hours Worked: {stats.totalHours}</p>
      <p className="text-white">Clock-ins Today: {stats.clockInsToday}</p>
    </div>
  );
}