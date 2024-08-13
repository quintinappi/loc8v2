'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkUserProfile();
    }
  }, [user]);

  async function checkUserProfile() {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    if (!userData?.firstName || !userData?.lastName || !userData?.profilePicture) {
      setNotifications(prev => [...prev, {
        id: 'incomplete-profile',
        message: 'Please complete your profile details and add a profile picture.',
        action: '/profile'
      }]);
    }
  }

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Notifications</h2>
      {notifications.length === 0 ? (
        <p className="text-white">No new notifications.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map(notification => (
            <li key={notification.id} className="bg-gray-700 p-4 rounded-lg text-white">
              <p>{notification.message}</p>
              {notification.action && (
                <Link href={notification.action} className="text-blue-400 hover:underline mt-2 inline-block">
                  Take Action
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
