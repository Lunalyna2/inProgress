import React, { useState } from 'react';
import type { ChangeEvent, FormEvent, FocusEvent } from 'react'; 
import './Signup.css';
import { useNavigate } from "react-router-dom";


const API_URL = process.env.REACT_APP_API_URL; 


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

// Interface for errors: Keys exist only if there is an error (Partial<T>)
interface SignUpFormErrors {
    fullName: string;
    username: string;
    cpuEmail: string;
    password: string;
    rePassword: string;
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

    // Use Partial<T> to manage errors—keys are only present if there's an error
    const [errors, setErrors] = useState<Partial<SignUpFormErrors>>({}); 
    const [isSubmitting, setIsSubmitting] = useState(false); 


    const validate = (data: SignUpFormData): Partial<SignUpFormErrors> => {
        const newErrors: Partial<SignUpFormErrors> = {};

        // 1. Check for required fields
        for (const key in data) {
            const field = key as keyof SignUpFormData;
            if (!data[field].trim()) {
                newErrors[field as keyof SignUpFormErrors] = "This field is required.";
            }
        }

        // 2. CPU Email format validation
        if (data.cpuEmail.trim() && !data.cpuEmail.endsWith('@cpu.edu.ph')) {
            newErrors.cpuEmail = "Must use CPU email address!";
        }

        // 3. Password match validation (only if both fields are non-empty)
        if (data.password.trim() && data.rePassword.trim() && data.password !== data.rePassword) {
            newErrors.rePassword = "Passwords do not match!";
            // Optional: Also set an error on the password field for better UX
            newErrors.password = newErrors.password || "Passwords do not match!";
        }

        return newErrors;
    };


    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        const validationErrors = validate(formData);
        const { name } = e.target;
        const fieldName = name as keyof SignUpFormErrors;

        setErrors(prev => {
            const newErrors = { ...prev };
            
            if (validationErrors[fieldName]) {
                newErrors[fieldName] = validationErrors[fieldName];
            } else {
                delete newErrors[fieldName]; // Correctly remove error if valid
            }
            // If checking rePassword, also re-evaluate password error
            if (fieldName === 'rePassword' || fieldName === 'password') {
                if (validationErrors.password) {
                    newErrors.password = validationErrors.password;
                } else {
                    delete newErrors.password;
                }
            }

            return newErrors;
        });
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const fieldName = name as keyof SignUpFormErrors;

        // 1. Update form data
        setFormData(prev => {
            const newFormData = { ...prev, [name]: value };
            
            // 2. Live validation logic for password fields
            if (name === 'password' || name === 'rePassword') {
                const validationErrors = validate(newFormData);
                
                setErrors(prevErrors => {
                    const nextErrors = { ...prevErrors };
                    
                    // Handle Password Error
                    if (validationErrors.password) {
                        nextErrors.password = validationErrors.password;
                    } else {
                        delete nextErrors.password; // FIX: Use delete instead of assigning null
                    }

                    // Handle RePassword Error
                    if (validationErrors.rePassword) {
                        nextErrors.rePassword = validationErrors.rePassword;
                    } else {
                        delete nextErrors.rePassword; // FIX: Use delete instead of assigning null
                    }
                    
                    return nextErrors;
                });
            }

            return newFormData;
        });

        // 3. Clear field-required error on typing
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    };
    
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const validationErrors = validate(formData);
        setErrors(validationErrors);
        
        if (Object.keys(validationErrors).length > 0) return;
        
        setIsSubmitting(true);

        try {
            const { fullName, username, cpuEmail, password, rePassword } = formData;
            
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    username: username.trim(),
                    cpuEmail: cpuEmail.trim(),
                    password: password,
                    rePassword: rePassword.trim()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("userToken", data.token);
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("username", data.user.username);
                localStorage.setItem("email", data.user.email);
                localStorage.setItem("name", data.user.fullname);
                navigate("/flipbook");
            } else if (response.status === 400) {
                // Server validation failed (e.g., password strength)
                setErrors(prev => ({ ...prev, ...data.errors }));
                alert('Sign-up failed. Check input.');
            } else if (response.status === 409) {
                // Server reports conflict (email/username exists)
                setErrors(prev => ({ ...prev, ...data.errors }));
                alert('User with this email or username already exists.');
            } else {
                alert('Unexpected error occurred.');
            }
        } catch (error) {
            console.error(error);
            alert('Could not connect to server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to attach validation props to inputs (Simplifed with correct typing)
    const getValidationProps = (name: keyof SignUpFormErrors) => {
        const errorMessage = errors[name];
        
        return {
            className: `form-input ${errorMessage ? 'input-error' : ''}`,
            // Ensure data-error is a string for JSX
            'data-error': (errorMessage || '') as string,
        };
    };

    return (
        <div className="signup-page-body">
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
                            onBlur={handleBlur}
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
                            onBlur={handleBlur}
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
                            onBlur={handleBlur}
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
                            onBlur={handleBlur}
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
                            onBlur={handleBlur}
                            // Simplified classname: uses only the central error state
                            className={`form-input ${errors.rePassword ? 'input-error' : ''}`}
                            required
                        />
                        {errors.rePassword && (
                            <p className="error-message">{errors.rePassword}</p>
                        )}

                        <button type="submit" className="get-started-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing Up...' : 'Get Started'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;