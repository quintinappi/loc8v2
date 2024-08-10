import { useState } from 'react';
import { signUp, signIn, logOut } from '../utils/auth';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AuthComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, setUser } = useAuth();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const newUser = await signUp(email, password);
      setUser(newUser);
      toast.success('Account created successfully!');
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error(error.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const signedInUser = await signIn(email, password);
      setUser(signedInUser);
      toast.success('Signed in successfully!');
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Invalid email or password. Please try again.');
    }
  };

  const handleLogOut = async () => {
    try {
      await logOut();
      setUser(null);
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="mt-8">
      {!user ? (
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md text-black bg-gray-200"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md text-black bg-gray-200"
          />
          <div className="space-x-4">
            <button onClick={handleSignUp} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Sign Up</button>
            <button onClick={handleSignIn} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">Sign In</button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4 text-white font-semibold">
            Signed in as {user.displayName || user.email}
          </p>
          <button onClick={handleLogOut} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Log Out</button>
        </div>
      )}
    </div>
  );
}