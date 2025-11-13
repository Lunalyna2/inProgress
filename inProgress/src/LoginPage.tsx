import React, { useState } from 'react';
import type { FormEvent, MouseEvent } from 'react'; 
import './login.css';
import ForgotPasswordModal from './forgotPasswordModal';


// Define Props Interface for LoginPage
interface LoginPageProps {
    switchToSignup: () => void; 
}

// Define the shape of the form data state
interface LoginFormData {
    username: string;
    cpuEmail: string;
    password: string;
}

// Define the shape of the errors state
interface LoginErrors {
    username: string | null;
    cpuEmail: string | null;
    password: string | null;
}

// LoginPage Component
function LoginPage({ switchToSignup }: LoginPageProps): React.JSX.Element {
    // State for form data
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [formData, setFormData] = useState<LoginFormData>({
        username: '',
        cpuEmail: '',
        password: ''
    });

    // State for validation errors
    const [errors, setErrors] = useState<Partial<LoginErrors>>({});

    // Handles all input changes and updates formData
    const handleInputChange = (field: keyof LoginFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when the user starts typing again
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = (): boolean => {
        let newErrors: Partial<LoginErrors> = {};
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

    // Handles form submission
    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const payload = {
                cpuEmail: formData.cpuEmail,
                password: formData.password
            };

            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                        name="cpuEmail"
                        value={formData.cpuEmail}
                        onChange={(e) => handleInputChange('cpuEmail', e.target.value)}
                        className={`form-input ${errors.cpuEmail ? 'input-error' : ''}`}
                    />
                    {errors.cpuEmail && <p className="error-message">{errors.cpuEmail}</p>}

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
                        <button 
                        type="button" 
                        className="forgot-button"
                        onClick={() => setShowForgotPassword(true)}
                        >
                            Forgot your password?
                        </button>
                    </div>

                    <button type="submit" className="get-started-button">
                        Login
                    </button>
                </form>
            </div>
            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
}

export default LoginPage;