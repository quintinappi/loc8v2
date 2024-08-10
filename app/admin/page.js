'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import AddEmployeeForm from '../../components/AddEmployeeForm';

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    const querySnapshot = await getDocs(q);
    const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(usersData);
    setLoading(false);
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isAdmin: !currentStatus });
    fetchUsers(); // Refresh the user list
  };

  if (!user?.isAdmin) {
    return <p>You do not have permission to view this page.</p>;
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Admin Management</h1>
      <AddEmployeeForm />
      <h2 className="text-xl font-bold mt-8 mb-4">User Management</h2>
      <ul className="space-y-4">
        {users.map(user => (
          <li key={user.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
            <span>{user.email} - {user.isAdmin ? 'Admin' : 'User'}</span>
            <button
              onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}