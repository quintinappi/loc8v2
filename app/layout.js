import { AuthProvider } from '../contexts/AuthContext'
import './globals.css'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

const DynamicNavigation = dynamic(() => import('../components/Navigation'), {
  ssr: false,
})

export const metadata = {
  title: 'Clocking System PWA',
  description: 'A Progressive Web App for clocking in and out',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100">
            <header className="bg-red-600 text-white p-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold">Clocking System</h1>
              <DynamicNavigation />
            </header>
            <main className="container mx-auto p-4">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}