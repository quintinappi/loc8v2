'use client'

import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function History() {
  const [entries, setEntries] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchEntries() {
      if (!user) return;

      try {
        const q = query(collection(db, 'clockEntries'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedEntries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEntries(fetchedEntries);
      } catch (error) {
        console.error('Error fetching clock entries:', error);
      }
    }

    fetchEntries();
  }, [user]);

  return (
    <div>
      <h1>Clock History</h1>
      {entries.map(entry => (
        <div key={entry.id}>
          <p>{entry.timestamp?.toDate().toString()}: {entry.type}</p>
        </div>
      ))}
    </div>
  );
}