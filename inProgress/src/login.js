import React, { useState } from 'react';
import './login.css';

function LoginPage({ switchToSignup }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
      isValid = false;
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload = {
        email: formData.email,
        password: formData.password
      };

      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok) {
        alert('Login Successful!');
      } else if (response.status === 400) {
        setErrors(responseData.errors);
        alert('Login failed. Please check your input.');
      } else if (response.status === 401) {
        alert('Invalid username or password.');
      } else {
        alert('An unexpected error occurred.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Could not connect to the server.');
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="left-panel">
        <h1 className="main-title">Count your Progress Today!</h1>
        <p className="description">
          Transform your unfinished project ideas into reality. Connect with
          peers based on your courses, skills, and passions.
        </p>

        <div className="login-prompt">
          <p>Don't have an account?</p>
          <button className="login-button" onClick={switchToSignup}>
            Signup Here!
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <h2 className="panel-title">Continue your Journey Today!</h2>
        <form className="signup-form" onSubmit={handleLogin} noValidate>
          {/* Username */}
          <input
            type="text"
            placeholder="Username"
            name="username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="form-input"
          />

          {/* CPU Email */}
          <input
            type="email"
            placeholder="CPU email address"
            name="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`form-input ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && <p className="error-message">{errors.email}</p>}

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`form-input ${errors.password ? 'input-error' : ''}`}
          />
          {errors.password && <p className="error-message">{errors.password}</p>}

          {/* Forgot Password */}
          <div className="forgot-container">
            <button type="button" className="forgot-button">
              Forgot your password?
            </button>
          </div>

          <button type="submit" className="get-started-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
