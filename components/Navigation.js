import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../utils/auth';

export default function Navigation() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-red-700 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">Clocking System</Link>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <ul className={`md:flex space-x-4 ${isOpen ? 'block' : 'hidden'} absolute md:relative top-16 md:top-0 left-0 right-0 bg-red-700 md:bg-transparent p-4 md:p-0`}>
          <li><Link href="/" className="block py-2 md:py-0 hover:text-gray-300">Home</Link></li>
          {user && (
            <>
              <li><Link href="/profile" className="block py-2 md:py-0 hover:text-gray-300">Profile</Link></li>
              {user.isAdmin && (
                <li><Link href="/admin" className="block py-2 md:py-0 hover:text-gray-300">Admin</Link></li>
              )}
              <li><button onClick={handleLogout} className="block py-2 md:py-0 hover:text-gray-300">Logout</button></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}