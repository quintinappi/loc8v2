'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../utils/auth';
import { motion } from 'framer-motion';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const menuItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/history', label: 'History' },
    { href: '/notifications', label: 'Notifications' },
    { href: '/profile', label: 'Profile' },
    ...(user?.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className="relative navbar">
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="text-white focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {isMenuOpen && (
        <ul className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 navbar-menu">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer">
                {item.label}
              </Link>
            </li>
          ))}
          {user && (
            <li>
              <button 
                onClick={handleLogout} 
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      )}
    </nav>
  );
};

export default Navigation;