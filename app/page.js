'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../components/Dashboard';
import Login from '../components/Login';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-red-600 text-white p-4">
        <h1 className="text-2xl font-bold">Clocking System</h1>
      </header>
      <main className="container mx-auto p-4">
        {user ? <Dashboard /> : <Login />}
      </main>
    </div>
  );
}