'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updatePassword } from 'firebase/auth';
import toast from 'react-hot-toast';
import Image from 'next/image';

const ProfileImage = ({ profilePic, firstName, lastName }) => {
  if (profilePic) {
    return <Image src={profilePic} alt="Profile" width={100} height={100} className="rounded-full object-cover" />;
  }
  
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return (
    <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-white text-2xl font-bold">
      {initials}
    </div>
  );
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUserProfile = useCallback(async () => {
    try {
      if (!user) return;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setProfilePic(userData.profilePicUrl || null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: `${firstName} ${lastName}` });
      await updateDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        email: user.email
      });
      setUser({ ...user, displayName: `${firstName} ${lastName}` });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Password updated successfully');
      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const storageRef = ref(storage, `profilePics/${user.uid}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update auth profile
        await updateProfile(user, { photoURL: downloadURL });
        
        // Update Firestore document
        await updateDoc(doc(db, 'users', user.uid), { profilePicUrl: downloadURL });
        
        setProfilePic(downloadURL);
        setUser({ ...user, photoURL: downloadURL });
        toast.success('Profile picture updated successfully');
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        toast.error('Failed to update profile picture');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <p className="text-center mt-8 text-white">Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-white">Update Profile</h2>
      <div className="mb-4">
        <div className="w-32 h-32 mx-auto mb-4 relative">
          <ProfileImage profilePic={profilePic} firstName={firstName} lastName={lastName} />
          <label htmlFor="profile-pic-upload" className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </label>
          <input
            id="profile-pic-upload"
            type="file"
            accept="image/*"
            onChange={handleProfilePicChange}
            className="hidden"
          />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">First Name</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-gray-700 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">Last Name</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-gray-700 text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Update Profile
        </button>
      </form>

      <h3 className="text-xl font-bold mt-8 mb-4">Change Password</h3>
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Change Password
        </button>
      </form>
    </div>
  );
}