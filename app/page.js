'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../components/Dashboard';
import Login from '../components/Login';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {user ? <Dashboard /> : <Login />}
    </div>
  );
}