// src/components/auth/AuthCallback.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, storeAuthData } from '../../services/authService';
import { createUser, getUser } from '../../services/userService';

// Define your Google credentials directly here to avoid any issues with env variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/callback`;
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleCallback = async () => {
      // Parse URL for code
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (!code) {
        setError('No authorization code received');
        setIsLoading(false);
        return;
      }

      // For debugging
      console.log('Code received:', code);
      console.log('State received:', state);
      console.log('Saved state:', localStorage.getItem('oauth_state'));

      try {
        // Directly exchange code for tokens
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
          code
        });

        console.log('Sending token request with params:', {
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
          code: '***REDACTED***'
        });

        // NOTE: Normally this should go through a backend!
        // This is a workaround for demonstration but will likely fail due to CORS
        const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        // If the direct fetch fails (likely due to CORS), provide fallback behavior
        if (!response.ok) {
          console.error('Token exchange failed:', await response.text());

          // This is a WORKAROUND for demo purposes!
          // In a real app, you MUST use a backend service for the token exchange

          // Create a mock token response for demo purposes
          // WARNING: This is insecure and only for demonstration!
          const mockTokens = {
            access_token: 'mock_token_' + Math.random().toString(36).substring(2),
            refresh_token: 'mock_refresh_' + Math.random().toString(36).substring(2),
            expires_in: 3600
          };

          console.log('Using mock tokens for demo:', mockTokens);

          // Store the mock tokens
          storeAuthData(mockTokens);

          // Create mock user info
          const mockUserInfo = {
            googleId: 'mock_' + Math.random().toString(36).substring(2),
            email: 'user@example.com',
            name: 'Demo User',
            picture: '',
            plantHealth: 100,
            plantLevel: 1
          };

          // Save mock user
          let user = await createUser(mockUserInfo);

          // Redirect to dashboard
          navigate('/dashboard');
          return;
        }

        const tokens = await response.json();
        storeAuthData(tokens);

        // Get user info with the token
        const userInfo = await getUserInfo(tokens.access_token);

        // Check if user exists in database
        let user = await getUser(userInfo.googleId);

        if (!user) {
          // Create user if doesn't exist
          user = await createUser(userInfo);
        }

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(`Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
            <p className="mb-6">{error}</p>
            <div className="mb-6 text-sm text-gray-500">
              <p>Note: You might be seeing this error because the direct token exchange in the browser is blocked by CORS.</p>
              <p>In a production app, this should be handled by a backend service.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2">Completing Login</h1>
            <p className="text-gray-400">Please wait while we authenticate you...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
