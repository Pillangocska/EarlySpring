// src/services/authService.ts

import { User } from '../types';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential,
  onAuthStateChanged as firebaseAuthStateChanged,
  getIdToken
} from 'firebase/auth';
import { auth } from '../firebase';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with Google popup
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    console.log("Auth Service: Starting Google sign in");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Auth Service: Google sign in successful", result.user.uid);
    return result;
  } catch (error) {
    console.error('Error during Google sign in:', error);
    throw error;
  }
};

// Get user info from Firebase user
export const getUserInfoFromFirebase = (firebaseUser: any): User => {
  return {
    googleId: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    picture: firebaseUser.photoURL,
    plantHealth: 100, // Default plant health
    plantLevel: 1     // Default plant level
  };
};

// Listen to auth state changes
export const onAuthStateChanged = (callback: (user: any | null) => void): (() => void) => {
  return firebaseAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): any | null => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

// Get ID token for the current user
export const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    return await getIdToken(user);
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

// Log out user
export const logout = async (): Promise<void> => {
  try {
    console.log("Auth Service: Signing out");
    await signOut(auth);
    console.log("Auth Service: Sign out successful");
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
