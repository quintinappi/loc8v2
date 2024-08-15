'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      if (!userData?.firstName || !userData?.lastName || !userData?.photoURL) {
        setNotifications(prev => [...prev, {
          id: 'incomplete-profile',
          message: 'Please complete your profile details and add a profile picture.',
          action: '/profile'
        }]);
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkUserProfile();
  }, [checkUserProfile]);

  if (loading) {
    return <div className="text-center mt-8 text-white">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-black">Notifications</h2>
      {notifications.length === 0 ? (
        <p className="text-gray-600">No new notifications.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map(notification => (
            <li key={notification.id} className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-800">{notification.message}</p>
              {notification.action && (
                <Link href={notification.action} className="text-blue-500 hover:underline mt-2 inline-block">
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