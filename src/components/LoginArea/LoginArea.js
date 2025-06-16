// LoginArea.js
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './LoginArea.css';

export default function LoginArea({ handleLoginSuccess }) {
  return (
    <div className="login-area">
      <div className="card login-card">
        <h2 className="login-title">Welcome to Your Kitchen</h2>
        <p className="login-subtitle">
          Sign in to discover amazing recipes tailored just for you ✨
        </p>
        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => console.error('Login failed')}
          />
        </div>
      </div>
    </div>
  );
}
