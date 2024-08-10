import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { reverseGeocode } from '../utils/reverseGeocode';
import toast from 'react-hot-toast';

export default function ClockInButton({ type, onClockInOut }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClockAction = async () => {
    if (!user) {
      toast.error('You must be logged in to clock in/out');
      return;
    }

    setLoading(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      let locationName = 'Unknown location';

      try {
        locationName = await reverseGeocode(latitude, longitude);
      } catch (error) {
        console.error('Error reverse geocoding:', error);
      }

      const clockInType = type === 'in' ? 'CLOCKED IN' : 'CLOCKED OUT';
      console.log("Saving clock entry:", clockInType);

      await addDoc(collection(db, 'clockIns'), {
        userId: user.uid,
        timestamp: serverTimestamp(),
        type: clockInType,
        latitude,
        longitude,
        location: `${latitude}, ${longitude}`,
        locationName
      });

      toast.success(`Successfully ${type === 'in' ? 'clocked in' : 'clocked out'} at ${locationName}`);
      if (onClockInOut) onClockInOut();
    } catch (error) {
      console.error('Error clocking in/out:', error);
      toast.error('Failed to clock in/out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClockAction}
      disabled={loading}
      className={`${type === 'in' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white font-bold py-2 px-4 rounded`}
    >
      {loading ? 'Processing...' : `Clock ${type === 'in' ? 'In' : 'Out'}`}
    </button>
  );
}