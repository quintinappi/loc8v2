import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function clockIn(userId, type) {
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const clockInData = {
          userId: userId,
          timestamp: serverTimestamp(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          type: type === 'in' ? 'CLOCKED IN' : 'CLOCKED OUT'
        };

        // Save to Firebase
        const docRef = await addDoc(collection(db, 'clockIns'), clockInData);
        resolve(docRef.id);
      } catch (error) {
        console.error('Firebase error:', error);
        reject(error);
      }
    }, (error) => {
      console.error('Geolocation error:', error);
      reject(error);
    });
  });
}