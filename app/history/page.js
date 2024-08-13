'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('../../components/Map'), {
  ssr: false
});

export default function History() {
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, activeTab]);

  async function fetchEntries() {
    if (!user) return;

    try {
      let q;
      if (activeTab === 'personal') {
        q = query(
          collection(db, 'clockIns'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
      } else if (activeTab === 'employee') {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const isAdmin = userDoc.data()?.isAdmin;
        if (!isAdmin) {
          console.error('User is not an admin');
          return;
        }
        q = query(
          collection(db, 'clockIns'),
          where('userId', '!=', user.uid),
          orderBy('userId', 'asc'),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(q);
      const fetchedEntries = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        let userName = 'Unknown User';
        if (data.userId) {
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          const userData = userDoc.data();
          userName = userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData?.email || 'Unknown User';
        }
        return {
          id: docSnapshot.id,
          ...data,
          userName,
          timestamp: data.timestamp?.toDate() || new Date(),
          location: data.location && 
                    typeof data.location.latitude === 'number' && 
                    typeof data.location.longitude === 'number' &&
                    !isNaN(data.location.latitude) && 
                    !isNaN(data.location.longitude)
                      ? data.location
                      : null
        };
      }));
      setEntries(fetchedEntries);
    } catch (error) {
      console.error('Error fetching clock entries:', error);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Clock History</h1>
      <div className="mb-4">
        <button
          className={`mr-2 ${activeTab === 'personal' ? 'bg-blue-500 text-white' : 'bg-gray-200'} px-4 py-2 rounded`}
          onClick={() => setActiveTab('personal')}
        >
          Personal
        </button>
        <button
          className={`${activeTab === 'employee' ? 'bg-blue-500 text-white' : 'bg-gray-200'} px-4 py-2 rounded`}
          onClick={() => setActiveTab('employee')}
        >
          Employee
        </button>
      </div>
      {entries.length === 0 ? (
        <p>No entries found.</p>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-gray-700 p-4 rounded-lg flex flex-col md:flex-row items-center">
              <div className="flex-grow mb-4 md:mb-0 md:mr-4">
                <p className="text-white text-lg font-semibold">
                  {entry.timestamp.toLocaleString()} - {entry.type ? entry.type.toUpperCase() : 'UNKNOWN'}
                </p>
                {activeTab === 'employee' && (
                  <p className="text-gray-300">{entry.userName}</p>
                )}
              </div>
              <div className="w-full md:w-64 h-48">
                {entry.latitude && entry.longitude ? (
                  <MapWithNoSSR clockIn={entry} />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white">
                    No location data
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}