'use client';

import { Suspense } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Dashboard from '../components/Dashboard';

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    </ErrorBoundary>
  );
}