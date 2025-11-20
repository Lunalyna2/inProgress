import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react'; // ✅ type-only imports
import './signup.css';
import { useNavigate } from "react-router-dom";

interface SignUpPageProps {
    switchToLogin: () => void;
}

interface SignUpFormData {
    fullName: string;
    username: string;
    cpuEmail: string;
    password: string;
    rePassword: string;
}

interface SignUpFormErrors {
    fullName: string | null;
    username: string | null;
    cpuEmail: string | null;
    password: string | null;
    rePassword: string | null;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ switchToLogin }) => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<SignUpFormData>({
        fullName: '',
        username: '',
        cpuEmail: '',
        password: '',
        rePassword: '',
    });

    const [errors, setErrors] = useState<Partial<SignUpFormErrors>>({});
    const [rePasswordError, setRePasswordError] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name as keyof SignUpFormErrors]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }

        if (name === 'password' || name === 'rePassword') {
            const otherPassword = name === 'password' ? formData.rePassword : formData.password;
            if (value !== otherPassword) setRePasswordError("Does not match password!");
            else setRePasswordError(null);
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<SignUpFormErrors> = {};
        let isValid = true;

        for (const key in formData) {
            if (!formData[key as keyof SignUpFormData].trim()) {
                newErrors[key as keyof SignUpFormErrors] = "This field is required.";
                isValid = false;
            }
        }

        if (formData.cpuEmail && !formData.cpuEmail.endsWith('@cpu.edu.ph')) {
            newErrors.cpuEmail = "Must use CPU email address!";
            isValid = false;
        }

        if (formData.password !== formData.rePassword) {
            setRePasswordError("Does not match password!");
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validate() || rePasswordError) return;

        try {
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Save user info for flipbook
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("username", data.user.username);
                localStorage.setItem("email", data.user.email);
                localStorage.setItem("name", data.user.fullname);
                // Navigate directly to flipbook
                navigate("/flipbook");
              // Redirect after signup
            } else if (response.status === 400) {
                setErrors(data.errors);
                alert('Sign-up failed. Check input.');
            } else if (response.status === 409) {
                alert('User with this email already exists.')
            } else {
                alert('Unexpected error occurred.');
            }
        } catch (error) {
            console.error(error);
            alert('Could not connect to server.');
        }
    };

    // Helper to attach validation props to inputs
    const getValidationProps = (name: keyof SignUpFormErrors) => ({
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
                    <button className="login-button" onClick={switchToLogin}>Login Here!</button>
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
                        required
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
                        required
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
                        required
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
                        required
                    />
                    {errors.password && <p className="error-message">{errors.password}</p>}

                    {/* Re-Password */}
                    <input
                        type="password"
                        placeholder="Re-enter password"
                        name="rePassword"
                        value={formData.rePassword}
                        onChange={handleChange}
                        required
                        className={`form-input ${rePasswordError ? 'input-error-special' : ''} ${errors.rePassword ? 'input-error' : ''}`}
                    />
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
