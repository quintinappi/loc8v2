import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ClockInButton from './ClockInButton';
import DashboardStats from './DashboardStats';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();
  const [lastClockIn, setLastClockIn] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLastClockIn = useCallback(async () => {
    if (user) {
      const clockInsRef = collection(db, 'clockIns');
      const q = query(
        clockInsRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const lastClockInData = querySnapshot.docs[0].data();
        setLastClockIn(lastClockInData);
      } else {
        setLastClockIn(null);
      }
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLastClockIn();
  }, [fetchLastClockIn]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const currentStatus = lastClockIn ? lastClockIn.type : 'Not clocked in';
  const lastActionTime = lastClockIn ? new Date(lastClockIn.timestamp.toDate()).toLocaleString() : 'N/A';
  const isClockedIn = currentStatus === 'CLOCKED IN';

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Welcome, {user.displayName || user.email}!</h2>
      <h3 className="text-xl font-bold mb-4 text-white">Dashboard</h3>
      <div className="mb-4">
        <p className="text-white">Current Status: <span className={`font-bold ${isClockedIn ? 'text-green-500' : 'text-red-500'}`}>{currentStatus}</span></p>
        <p className="text-white">Last Action: {lastActionTime}</p>
      </div>
      <DashboardStats userId={user.uid} />
      <div className="mt-4">
        <ClockInButton type={isClockedIn ? "out" : "in"} onClockInOut={fetchLastClockIn} />
      </div>
      <Link href="/history" className="text-blue-500 hover:text-blue-600 mt-4 block">
        View Clocking History
      </Link>
    </div>
  );
}