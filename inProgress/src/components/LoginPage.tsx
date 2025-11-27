// LoginPage.tsx
import React, { useState } from 'react';
import type { FormEvent } from 'react';
import './login.css';
import ForgotPasswordModal from './forgotPasswordModal';
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config/api';

interface LoginPageProps {
  switchToSignup: () => void;
}

interface LoginFormData {
  username: string;
  cpuEmail: string;
  password: string;
}

interface LoginErrors {
  username: string | null;
  cpuEmail: string | null;
  password: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ switchToSignup }) => {
  const navigate = useNavigate();

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    cpuEmail: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<LoginErrors>>({});

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginErrors> = {};
    let isValid = true;

    if (!formData.cpuEmail.trim()) {
      newErrors.cpuEmail = "Email is required.";
      isValid = false;
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpuEmail: formData.cpuEmail, password: formData.password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);

        // Check if profile exists
        const profileRes = await fetch(`${API_URL}/api/${data.user.id}`);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          // If user has filled profile, go to dashboard
          if (profileData.name || profileData.avatar) {
            navigate("/dashboard");
          } else {
            navigate("/dashboard");
          }
        } else {
          // If profile not found, redirect to flipbook
          navigate("/flipbook");
        }
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Could not connect to server.');
    }
  };

  return (
    <div className = "login-page-body">
      <div className="login-container">
        <div className="left-panel">
          <h1 className="main-title">Count your Progress Today!</h1>
          <p className="description">
            Transform your unfinished project ideas into reality. Connect with peers based on your courses, skills, and passions.
          </p>
          <div className="login-prompt">
            <p>Don't have an account?</p>
            <button className="login-button" onClick={switchToSignup}>Signup Here!</button>
          </div>
        </div>

        <div className="right-panel">
          <h2 className="panel-title">Continue your Journey Today!</h2>
          <form className="signup-form" onSubmit={handleLogin} noValidate>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              className="form-input"
            />
            <input
              type="email"
              placeholder="CPU email address"
              value={formData.cpuEmail}
              onChange={e => handleInputChange('cpuEmail', e.target.value)}
              className={`form-input ${errors.cpuEmail ? 'input-error' : ''}`}
            />
            {errors.cpuEmail && <p className="error-message">{errors.cpuEmail}</p>}

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              className={`form-input ${errors.password ? 'input-error' : ''}`}
            />
            {errors.password && <p className="error-message">{errors.password}</p>}

            <div className="forgot-container">
              <button type="button" className="forgot-button" onClick={() => setShowForgotPassword(true)}>
                Forgot your password?
              </button>
            </div>

            <button type="submit" className="get-started-button">Login</button>
          </form>
        </div>

        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </div>
  );
};

export default LoginPage;
