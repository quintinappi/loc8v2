'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, getDoc, doc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const DynamicMap = dynamic(() => import('./Map'), { ssr: false });
const EmployeeClockings = dynamic(() => import('./EmployeeClockings'), { ssr: false });

export default function HistoryPageContent() {
  const { user } = useAuth();
  const [clockIns, setClockIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      // Check if user has admin role
      const checkAdminStatus = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setIsAdmin(userDoc.data()?.role === 'admin');
      };
      checkAdminStatus();

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
    }
  }, [user]);

  if (typeof window === 'undefined') {
    return null; // Return null on server-side
  }

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
            <DynamicMap key={clockIn.id} clockIn={clockIn} />
          ))}
        </div>
      ) : (
        <EmployeeClockings />
      )}
    </div>
  );
}