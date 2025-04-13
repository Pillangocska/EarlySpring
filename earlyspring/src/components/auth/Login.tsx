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
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Card with subtle gradient background */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-b from-gray-800 to-black p-8 shadow-2xl">
          {/* Subtle glow effect */}
          <div className="absolute -top-10 left-1/2 h-40 w-80 -translate-x-1/2 transform rounded-full bg-green-500 opacity-10 blur-3xl"></div>

          <div className="relative z-10 flex flex-col items-center space-y-5">
            <h2 className="text-center text-lg font-medium text-blue-300">Welcome</h2>

            {/* Larger logo with animation */}
            <div className="w-80 sm:w-48 mx-auto transition-all duration-300 hover:scale-105">
              <img
                src="/src/assets/early_spring_black.jpg"
                alt="EarlySpring Logo"
                className="h-auto w-full rounded-lg"
              />
            </div>

            {/* Error display with improved styling */}
            {(error || authState.error) && (
              <div className="w-full rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-red-300">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error || authState.error}</span>
                </div>
              </div>
            )}

            {/* Login button with improved styling */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn || authState.loading}
              className={`group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 py-3 px-4 text-white shadow-lg transition-all duration-300 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                (isLoggingIn || authState.loading) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:translate-x-full group-hover:opacity-100"></span>
              <span className="relative flex items-center justify-center">
                {isLoggingIn || authState.loading ? (
                  <>
                    {/* Improved spinner */}
                    <svg className="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    {/* Google logo */}
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="mr-3 h-5 w-5" />
                    <span className="font-medium">Continue with Google</span>
                  </>
                )}
              </span>
            </button>

            {/* Terms of service with improved styling */}
            <div className="mt-6 text-center text-sm text-gray-400">
              <p>By continuing, you agree to our</p>
              <div className="mt-1 flex justify-center space-x-3">
                <a href="#" className="text-blue-400 transition-colors hover:text-blue-300 hover:underline">Terms of Service</a>
                <span className="text-gray-600">•</span>
                <a href="#" className="text-blue-400 transition-colors hover:text-blue-300 hover:underline">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
