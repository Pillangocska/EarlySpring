// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState } from '../types';
import {
  signInWithGoogle,
  logout as firebaseLogout,
  onAuthStateChanged,
  getUserInfoFromFirebase
} from '../services/authService';
import { getUser, createUser, updateUser } from '../services/userService';

// Create auth context with default values
const AuthContext = createContext<{
  authState: AuthState;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
}>({
  authState: {
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  },
  login: async () => {},
  logout: async () => {},
  updateUserData: async () => {}
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  // Check authentication status on mount and listen for changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      try {
        console.log("Auth state changed:", firebaseUser ? "User logged in" : "No user");

        if (firebaseUser) {
          // Convert Firebase user to our User type
          const userInfo = getUserInfoFromFirebase(firebaseUser);
          console.log("User info from Firebase:", userInfo);

          try {
            // Check if user exists in DB
            let user = await getUser(userInfo.googleId);
            console.log("User from DB:", user);

            if (!user) {
              // Create user if doesn't exist
              console.log("Creating new user in DB");
              user = await createUser(userInfo);
            }

            // Set authenticated state
            setAuthState({
              isAuthenticated: true,
              user,
              loading: false,
              error: null
            });
            console.log("Auth state updated - authenticated");
          } catch (dbError) {
            console.error('Database error, but user is authenticated:', dbError);

            // Still mark as authenticated even if DB fails - use Firebase user info
            setAuthState({
              isAuthenticated: true,
              user: {
                ...userInfo,
                _id: userInfo.googleId // Use googleId as _id fallback
              },
              loading: false,
              error: 'Database connection error. Some features may be limited.'
            });
            console.log("Auth state updated - authenticated with DB error");
          }
        } else {
          // No user is signed in
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null
          });
          console.log("Auth state updated - not authenticated");
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: 'Authentication failed'
        });
      }
    });

    // Cleanup subscription
    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const login = async () => {
    try {
      console.log("Login initiated");
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const result = await signInWithGoogle();
      console.log("Sign in successful:", result.user.uid);
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign in with Google'
      }));
    }
  };

  const logout = async () => {
    try {
      console.log("Logout initiated");
      setAuthState(prev => ({ ...prev, loading: true }));
      await firebaseLogout();
      console.log("Logout successful");
      // Auth state will be updated by the onAuthStateChanged listener
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign out'
      }));
    }
  };

  const updateUserData = async (data: Partial<User>) => {
    if (!authState.user?._id) return;

    try {
      const updatedUser = await updateUser(authState.user._id, data);
      setAuthState({
        ...authState,
        user: updatedUser
      });
    } catch (error) {
      console.error('Failed to update user data:', error);

      // Local state update even if DB update fails
      setAuthState({
        ...authState,
        user: {
          ...authState.user,
          ...data,
          updatedAt: new Date()
        }
      });
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
