'use client'

import { useAuth } from '../../contexts/AuthContext';
import Profile from '../../components/Profile';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <p className="text-center mt-8 text-white">Please sign in to view this page.</p>;
  }

  return <Profile />;
}