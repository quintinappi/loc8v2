'use client'
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export default function UserCheck() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const checkUserDetails = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (!userData.firstName || !userData.lastName) {
            toast.error('Please complete your profile details', {
              duration: 5000,
              action: {
                label: 'Go to Profile',
                onClick: () => {
                  window.location.href = '/profile';
                }
              }
            });
          }
        }
      };
      checkUserDetails();
    }
  }, [user]);

  return null;
}
