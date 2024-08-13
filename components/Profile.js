'use client'

import { useState, useEffect } from 'react';
import { getAuth, updateProfile as firebaseUpdateProfile, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
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
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    photoURL: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('User data:', user);
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        photoURL: user.photoURL || '',
      });
    }
  }, [user]);

  async function updateUserProfile(profileData, file) {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }

    try {
      let photoURL = profileData.photoURL;

      if (file) {
        const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
        const uploadResult = await uploadBytes(storageRef, file);
        console.log('File uploaded:', uploadResult);
        photoURL = await getDownloadURL(storageRef);
        console.log('Download URL:', photoURL);
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        photoURL,
      });
      console.log('Firestore document updated');

      await firebaseUpdateProfile(currentUser, {
        displayName: `${profileData.firstName} ${profileData.lastName}`,
        photoURL,
      });
      console.log('Firebase Auth profile updated');

      if (typeof setUser === 'function') {
        setUser({
          ...currentUser,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          photoURL,
        });
        console.log('User context updated');
      } else {
        console.warn('setUser is not a function. User context not updated.');
      }

      return { success: true, photoURL };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Updating profile with:', profile);
      const result = await updateUserProfile(profile);
      if (result.success) {
        toast.success('Profile updated successfully');
        console.log('Profile updated:', result);
      } else {
        toast.error(`Failed to update profile: ${result.error}`);
        console.error('Failed to update profile:', result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleProfilePicChange(event) {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const result = await updateUserProfile(profile, file);
        if (result.success) {
          toast.success('Profile picture updated successfully');
          setProfile(prev => ({ ...prev, photoURL: result.photoURL }));
        } else {
          toast.error(`Failed to update profile picture: ${result.error}`);
        }
      } catch (error) {
        console.error('Error updating profile picture:', error);
        toast.error(`Failed to update profile picture: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;

    try {
      console.log('Updating password');
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully');
      setNewPassword('');
      console.log('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(`Failed to update password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-center mt-8 text-white">Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-white">Update Profile</h2>
      <div className="mb-4">
        <div className="w-32 h-32 mx-auto mb-4 relative rounded-full overflow-hidden">
          {profile.photoURL ? (
            <Image src={profile.photoURL} alt="Profile" layout="fill" objectFit="cover" />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile.firstName && profile.lastName ? `${profile.firstName[0]}${profile.lastName[0]}` : '?'}
            </div>
          )}
          <label htmlFor="profile-pic-upload" className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
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
            value={profile.firstName}
            onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-gray-700 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">Last Name</label>
          <input
            type="text"
            id="lastName"
            value={profile.lastName}
            onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-gray-700 text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>

      <h3 className="text-xl font-bold mt-8 mb-4">Change Password</h3>
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-gray-700 text-white"
            required
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}