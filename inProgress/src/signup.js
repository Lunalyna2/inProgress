import React, { useState } from 'react';
import './index.css';

const SignUpPage = () => {
  // State for form inputs
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    cpuEmail: '',
    password: '',
    rePassword: '', 
  });

  // State for validation errors
  const [errors, setErrors] = useState({});

  // State for re-password validation (real-time)
  const [rePasswordError, setRePasswordError] = useState(null);

  // Handles all input changes and updates formData
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Check re-password match
    if (name === 'rePassword' || name === 'password') {
      const otherPasswordField = name === 'rePassword' ? 'password' : 'rePassword';
      
      // Only show error if re-password is being typed and a password exists
      if (value.length > 0 && formData[otherPasswordField].length > 0) {
         if (value !== formData[otherPasswordField]) {
            setRePasswordError("Does not match password!");
         } else {
            setRePasswordError(null); // Clear error if they match
         }
      } else if (name === 'rePassword' && formData.password && value !== formData.password) {
         setRePasswordError("Does not match password!");
      } else {
         setRePasswordError(null);
      }
    }

    // Clear error when the user starts typing again
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validates the entire form on submission
  const validate = () => {
    let newErrors = {};
    let isValid = true;
    
    // Validate if all fields are filled in
    for (const key in formData) {
      if (!formData[key].trim()) {
        newErrors[key] = "This field is required.";
        isValid = false;
      }
    }

    // Validate CPU Email domain
    if (formData.cpuEmail && !formData.cpuEmail.endsWith('@cpu.edu.ph')) {
      newErrors.cpuEmail = "Must use CPU email address!";
      isValid = false;
    }

    // Final check for re-password match on submission
    if (formData.password !== formData.rePassword) {
      setRePasswordError("Does not match password!");
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Handles form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate() && !rePasswordError) {
      // All validations passed. Redirect to login page.
      alert('Sign-up Successful! Redirecting to login page...'); // Temporary. Please replace with actual navigation logic.
    } else {
      console.log('Validation failed. Errors:', errors);
    }
  };

  // RENDERING 

  // Helper to get input props based on validation state
  const getValidationProps = (name) => ({
    className: `form-input ${errors[name] ? 'input-error' : ''}`,
    'data-error': errors[name] || '',
  });

  return (
    <div className="signup-container">
      <div className="left-panel">
        <h1 className="main-title">Count your Progress Today!</h1>
        <p className="description">
          Transform your unfinished project ideas into reality. Connect with
          peers based on your courses, skills, and passions.
        </p>

        <div className="login-prompt">
          <p>Already have an account?</p>
          <button className="login-button">Login Here!</button>
        </div>
      </div>

      <div className="right-panel">
        <h2 className="panel-title">Start your Journey Today!</h2>
        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <input
            type="text"
            placeholder="Full name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            {...getValidationProps('fullName')}
          />
          {errors.fullName && <p className="error-message">{errors.fullName}</p>}

          {/* Username */}
          <input
            type="text"
            placeholder="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            {...getValidationProps('username')}
          />
          {errors.username && <p className="error-message">{errors.username}</p>}

          {/* CPU Email */}
          <input
            type="email"
            placeholder="CPU email address"
            name="cpuEmail"
            value={formData.cpuEmail}
            onChange={handleChange}
            {...getValidationProps('cpuEmail')}
          />
          {errors.cpuEmail && <p className="error-message">{errors.cpuEmail}</p>}

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            {...getValidationProps('password')}
          />
          {errors.password && <p className="error-message">{errors.password}</p>}
          
          {/* Re-Password */}
          <input
            type="password"
            placeholder="Re-enter password"
            name="rePassword"
            value={formData.rePassword}
            onChange={handleChange}
            // Apply error class based on real-time check
            className={`form-input ${rePasswordError ? 'input-error-special' : ''} ${errors.rePassword ? 'input-error' : ''}`}
          />
          {/* Display real-time error or submit error */}
          {(rePasswordError || errors.rePassword) && (
             <p className="error-message">{rePasswordError || errors.rePassword}</p>
          )}

          <button type="submit" className="get-started-button">Get Started</button>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;