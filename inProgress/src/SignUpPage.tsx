    import React, { useState } from 'react';
    import type { ChangeEvent, FormEvent } from 'react';
    import './index.css';

    // Define Props Interface for SignUpPage
    interface SignUpPageProps {
        switchToLogin: () => void; 
    }

    // Define the shape of the form data state
    interface SignUpFormData {
        fullName: string;
        username: string;
        cpuEmail: string;
        password: string;
        rePassword: string;
    }

    // Define the shape of the validation errors state
    interface SignUpFormErrors {
        fullName: string | null;
        username: string | null;
        cpuEmail: string | null;
        password: string | null;
        rePassword: string | null;
    }

    // SignUpPage Component
    const SignUpPage = ({ switchToLogin }: SignUpPageProps): React.JSX.Element => {
        // State for form inputs, explicitly typed
        const [formData, setFormData] = useState<SignUpFormData>({
            fullName: '',
            username: '',
            cpuEmail: '',
            password: '',
            rePassword: '', 
        });

        // State for validation errors
        const [errors, setErrors] = useState<Partial<SignUpFormErrors>>({});

        // State for re-password validation (real-time)
        const [rePasswordError, setRePasswordError] = useState<string | null>(null);

        // Handles all input changes and updates formData
        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            
            setFormData(prev => ({ ...prev, [name as keyof SignUpFormData]: value }));
            
            // Check re-password match logic remains the same
            if (name === 'rePassword' || name === 'password') {
                const otherPasswordField = name === 'rePassword' ? 'password' : 'rePassword';
                
                if (value.length > 0 && formData[otherPasswordField].length > 0) {
                    if (value !== formData[otherPasswordField]) {
                        setRePasswordError("Does not match password!");
                    } else {
                        setRePasswordError(null); 
                    }
                } else if (name === 'rePassword' && formData.password && value !== formData.password) {
                    setRePasswordError("Does not match password!");
                } else {
                    setRePasswordError(null);
                }
            }

            // Clear error when the user starts typing again
            if (errors[name as keyof SignUpFormErrors]) {
                setErrors(prev => ({ ...prev, [name as keyof SignUpFormErrors]: null }));
            }
        };

        // Validates the entire form on submission
        const validate = (): boolean => {
            let newErrors: Partial<SignUpFormErrors> = {};
            let isValid = true;
            
            // Validate if all fields are filled in
            for (const key in formData) {
                if (!formData[key as keyof SignUpFormData].trim()) {
                    newErrors[key as keyof SignUpFormErrors] = "This field is required.";
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
        const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const clientIsValid = validate();

            if (clientIsValid && !rePasswordError) {
                try {
                    const response = await fetch('http://localhost:5000/api/signup', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                    });

                    const responseData = await response.json();

                    if (response.ok) {
                        alert('Sign-up Successful! Redirecting to login page...');
                        switchToLogin(); 
                    } else if (response.status === 400) {
                        console.error('Backend validation errors:', responseData.errors);
                        setErrors(responseData.errors);
                        alert('Sign-up failed due to validation errors. Please check your input.');
                    } else {
                        alert('An unexpected error occurred during sign-up.');
                    }

                } catch (error) {
                    console.error('Error occurred during sign-up:', error);
                    alert('Could not connect to the server.');
                }
            } else {
                console.log('Client-side validation failed.');
            }
        };

        // RENDERING 
        // Helper to get input props based on validation state
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
                        {/* Use the strongly typed prop function */}
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