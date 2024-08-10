'use client'

import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navigation from '../components/Navigation';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        <AuthProvider>
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'custom-toast',
              duration: 3000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}