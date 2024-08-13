import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
      // Clocking logic is now handled in Dashboard.js
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