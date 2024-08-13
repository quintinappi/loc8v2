'use client'

import { AuthProvider } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import AuthWrapper from './AuthWrapper';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <html lang="en">
        <body>
          <AuthWrapper>{children}</AuthWrapper>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'custom-toast',
              duration: 3000,
            }}
          />
        </body>
      </html>
    </AuthProvider>
  );
}