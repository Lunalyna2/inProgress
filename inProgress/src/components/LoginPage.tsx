import React, { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import './Login.css';
import ForgotPasswordModal from './forgotPasswordModal';
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL; 

interface LoginPageProps {
  switchToSignup: () => void;
}

interface LoginFormData {
  identifier: string; // 
  password: string;
}

interface LoginErrors {
  identifier: string | null;
  password: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ switchToSignup }) => {
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<LoginErrors>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof LoginFormData;
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginErrors> = {};
    let isValid = true;

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Username or email is required.";
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
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: formData.identifier.trim(), 
          password: formData.password 
        }),
      });

      const data = await response.json();
      console.log('🔍 Login response:', data);

      if (response.ok) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userId", data.user.id.toString());
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("name", data.user.fullname);

        navigate("/dashboard");
      } else {
        setErrors({ identifier: "Invalid username/email or password." });
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setErrors({ identifier: "Could not connect to server." });
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
              type="text"
              name="identifier"  
              placeholder="Username or CPU email"
              value={formData.identifier}
              onChange={handleInputChange}
              className={`form-input ${errors.identifier ? 'input-error' : ''}`}
              disabled={isLoading}
            />
            {errors.identifier && <p className="error-message">{errors.identifier}</p>}
            
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              disabled={isLoading}
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