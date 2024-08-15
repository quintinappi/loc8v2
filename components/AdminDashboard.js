'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const calculateHours = async (userId) => {
    const clockingsRef = collection(db, 'clockings');
    const userClockings = query(
      clockingsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(userClockings);
    const clockings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let hoursToday = 0;
    let hoursThisWeek = 0;
    let hoursLastMonth = 0;

    for (let i = 0; i < clockings.length; i += 2) {
      const clockOut = clockings[i];
      const clockIn = clockings[i + 1];

      if (!clockIn) break;

      const duration = (clockOut.timestamp.toDate() - clockIn.timestamp.toDate()) / (1000 * 60 * 60);

      if (clockIn.timestamp.toDate() >= today) {
        hoursToday += duration;
      }
      if (clockIn.timestamp.toDate() >= weekStart) {
        hoursThisWeek += duration;
      }
      if (clockIn.timestamp.toDate() >= monthStart) {
        hoursLastMonth += duration;
      }
    }

    return { hoursToday, hoursThisWeek, hoursLastMonth };
  };

  useEffect(() => {
    const fetchEmployeesWithHours = async () => {
      if (!user) return;

      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const employeesData = await Promise.all(snapshot.docs.map(async (doc) => {
          const userData = doc.data();
          const hours = await calculateHours(doc.id);
          return {
            id: doc.id,
            ...userData,
            ...hours
          };
        }));
        setEmployees(employeesData);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeesWithHours();
  }, [user]);

  const toggleAdminStatus = async (employeeId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', employeeId);
      await updateDoc(userRef, { isAdmin: !currentStatus });
      setEmployees(employees.map(emp => 
        emp.id === employeeId ? {...emp, isAdmin: !currentStatus} : emp
      ));
      toast.success('Admin status updated successfully');
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  if (loading) {
    return <div className="text-center mt-8 text-white">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Admin Dashboard</h1>
      <div className="bg-gray-800 rounded-lg shadow-md p-6 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-white">Name</th>
              <th className="px-4 py-2 text-left text-white">Email</th>
              <th className="px-4 py-2 text-left text-white">Admin Status</th>
              <th className="px-4 py-2 text-left text-white">Clocking Status</th>
              <th className="px-4 py-2 text-left text-white">Hours Today</th>
              <th className="px-4 py-2 text-left text-white">Hours This Week</th>
              <th className="px-4 py-2 text-left text-white">Hours Last Month</th>
              <th className="px-4 py-2 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id} className="border-b border-gray-700">
                <td className="px-4 py-2 text-white">{`${employee.firstName} ${employee.lastName}`}</td>
                <td className="px-4 py-2 text-white">{employee.email}</td>
                <td className="px-4 py-2 text-white">{employee.isAdmin ? 'Admin' : 'Employee'}</td>
                <td className="px-4 py-2 text-white">{employee.clockingStatus || 'N/A'}</td>
                <td className="px-4 py-2 text-white">{employee.hoursToday || '0'}</td>
                <td className="px-4 py-2 text-white">{employee.hoursThisWeek || '0'}</td>
                <td className="px-4 py-2 text-white">{employee.hoursLastMonth || '0'}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleAdminStatus(employee.id, employee.isAdmin)}
                    className={`px-2 py-1 rounded ${
                      employee.isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {employee.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}