// src/components/auth/Login.tsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const { authState, login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Google login
  const handleGoogleLogin = async () => {
    if (isLoggingIn) return; // Prevent multiple clicks

    try {
      setIsLoggingIn(true);
      setError(null);
      console.log("Login component: Initiating login");
      await login();
      // After successful login, the auth state will be updated and the user will be redirected in App.tsx
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Card component using native Tailwind */}
        <div className="bg-black rounded-lg shadow-2xl border border-gray-800 p-8">
          <div className="flex flex-col items-center space-y-8">
            {/* Logo */}
            <div className="w-40 sm:w-48 mx-auto">
              <img
                src="/src/assets/early_spring_black.jpg"
                alt="EarlySpring Logo"
                className="w-full h-auto"
              />
            </div>

            {/* Error display */}
            {(error || authState.error) && (
              <div className="w-full bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg">
                {error || authState.error}
              </div>
            )}

            {/* Login button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn || authState.loading}
              className={`w-full flex items-center justify-center py-3 px-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                (isLoggingIn || authState.loading) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoggingIn || authState.loading ? (
                <>
                  {/* Custom spinner */}
                  <div className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-white rounded-full"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Terms of service */}
            <div className="text-sm text-gray-400 text-center mt-2">
              <p>By continuing, you agree to our</p>
              <div className="mt-1">
                <a href="#" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Terms of Service</a>
                {' • '}
                <a href="#" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>

        {/* App tagline - optional, remove if not needed */}
        <div className="mt-6 text-center">
          <p className="text-green-400">Wake up refreshed, grow your plant</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
