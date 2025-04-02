import React from 'react';

const Login: React.FC = () => {
  const handleGoogleLogin = () => {
    // Redirect to Spring Boot OAuth2 endpoint
    window.location.href = '/oauth2/authorization/google';
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Alarm Clock App</h1>
        <p>Login to manage your alarms</p>

        <button
          onClick={handleGoogleLogin}
          className="google-login-button"
        >
          <span className="google-icon">G</span>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
