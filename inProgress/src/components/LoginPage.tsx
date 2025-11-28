import React, { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import './login.css';
import ForgotPasswordModal from './forgotPasswordModal';
import { useNavigate } from "react-router-dom";

interface LoginPageProps {
  switchToSignup: () => void;
}

interface LoginFormData {
  cpuEmail: string;
  password: string;
}

interface LoginErrors {
  cpuEmail: string | null;
  password: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ switchToSignup }) => {
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    cpuEmail: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<LoginErrors>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as keyof LoginFormData]: value }));
    
    // Clear error when user types
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [name as keyof LoginErrors]: null }));
    }
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

    setIsLoading(true);
    try {
      console.log('🔍 Sending login request:', {
        cpuEmail: formData.cpuEmail,
        password: formData.password
      });

      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cpuEmail: formData.cpuEmail.trim(), 
          password: formData.password 
        }),
      });

      const data = await response.json();
      console.log('🔍 Login response:', data);

      if (response.ok) {
        // Save token and user data
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("name", data.user.fullname);
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userId", data.user.id.toString());
        localStorage.setItem("userId", String(data.user.id));

        // Always go to dashboard after login
        navigate("/dashboard");
      } else if (response.status === 401) {
        setErrors({ cpuEmail: "Invalid email or password." });
        alert('Invalid email or password.');
      } else if (response.status === 400) {
        setErrors(data.errors || { cpuEmail: "Validation error." });
        alert('Please check your input.');
      } else {
        alert('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Could not connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-body">
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
              type="email"
              name="cpuEmail"
              placeholder="CPU email address"
              value={formData.cpuEmail}
              onChange={handleInputChange}
              className={`form-input ${errors.cpuEmail ? 'input-error' : ''}`}
              required
            />
            {errors.cpuEmail && <p className="error-message">{errors.cpuEmail}</p>}
            
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              required
            />
            {errors.password && <p className="error-message">{errors.password}</p>}
            
            <div className="forgot-container">
              <button 
                type="button" 
                className="forgot-button" 
                onClick={() => setShowForgotPassword(true)}
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
            
            <button 
              type="submit" 
              className="get-started-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
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