import { useState } from 'react';

export default function RefreshButton({ onRefresh }) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  return (
    <button 
      onClick={handleRefresh} 
      disabled={loading}
      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out ml-2"
    >
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
