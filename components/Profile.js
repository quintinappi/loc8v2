'use client'

import { useState, useEffect } from 'react';
import { getAuth, updateProfile as firebaseUpdateProfile, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Image from 'next/image';
import 'react-toastify/dist/ReactToastify.css';

const ProfileImage = ({ profilePic, firstName, lastName }) => {
  if (profilePic) {
    return (
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300">
        <Image 
          src={profilePic} 
          alt="Profile" 
          width={96} 
          height={96} 
          className="object-cover w-full h-full"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = "https://via.placeholder.com/96?text=Error"; 
          }}
        />
      </div>
    );
  }
  
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return (
    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-300">
      {initials}
    </div>
  );
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFirstName(userData.firstName || '');
            setLastName(userData.lastName || '');
            setProfilePic(userData.photoURL || null);  // Changed from profilePic to photoURL
            console.log("Fetched profile pic:", userData.photoURL); // Debug log
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load profile data");
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (user && (!firstName || !lastName || !profilePic)) {
      toast.error('Please complete your profile details and add a profile picture.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [user, firstName, lastName, profilePic]);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const storageRef = ref(storage, `profilePics/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setProfilePic(downloadURL);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });  // Changed from profilePic to photoURL
      setLoading(false);
      toast.success('Profile picture updated successfully');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), { firstName, lastName });
      await firebaseUpdateProfile(getAuth().currentUser, { displayName: `${firstName} ${lastName}` });

      if (newPassword) {
        await updatePassword(getAuth().currentUser, newPassword);
      }

      setUser({ ...user, displayName: `${firstName} ${lastName}` });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-8 text-white">Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 flex justify-center">
          <ProfileImage profilePic={profilePic} firstName={firstName} lastName={lastName} />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profilePic">
            Profile Picture
          </label>
          <input
            type="file"
            id="profilePic"
            accept="image/*"
            onChange={handleProfilePicChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
            New Password (leave blank to keep current)
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}