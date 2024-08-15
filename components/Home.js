'use client';

import { useAuth } from '../contexts/AuthContext';
import Dashboard from './Dashboard';
import Login from './Login';
import { useEffect, useState } from 'react';

export default function Home() {
  const auth = useAuth();
  const user = auth?.user;

  if (!auth) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-red-600 text-white p-4">
        <h1 className="text-2xl font-bold">Clocking System</h1>
      </header>
      <main className="container mx-auto p-4">
        {user ? (
          <p>Welcome, {user.email}</p>
        ) : (
          <p>Please log in</p>
        )}
      </main>
    </div>
  );
}