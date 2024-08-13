import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../utils/auth';
import { motion } from 'framer-motion';

export default function Navigation({ onClose }) {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logOut();
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/history', label: 'History' },
    { href: '/notifications', label: 'Notifications' },
    { href: '/profile', label: 'Profile' },
    ...(user?.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className="p-4">
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <motion.li key={item.href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href={item.href} className="block py-2 text-gray-800 hover:text-gray-600" onClick={onClose}>
              {item.label}
            </Link>
          </motion.li>
        ))}
        {user && (
          <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button onClick={handleLogout} className="block w-full text-left py-2 text-gray-800 hover:text-gray-600">
              Logout
            </button>
          </motion.li>
        )}
      </ul>
    </nav>
  );
}