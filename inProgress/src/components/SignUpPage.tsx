import React, { useState } from "react";
import type { ChangeEvent, FormEvent, FocusEvent } from "react";
import "./signup.css";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://inprogress-upts.onrender.com/api";

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
  fullName: string;
  username: string;
  cpuEmail: string;
  password: string;
  rePassword: string;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ switchToLogin }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: "",
    username: "",
    cpuEmail: "",
    password: "",
    rePassword: "",
  });

  const [errors, setErrors] = useState<Partial<SignUpFormErrors>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (data: SignUpFormData): Partial<SignUpFormErrors> => {
    const newErrors: Partial<SignUpFormErrors> = {};

    for (const key in data) {
      const field = key as keyof SignUpFormData;
      if (!data[field].trim()) {
        newErrors[field as keyof SignUpFormErrors] = "This field is required.";
      }
    }

    if (data.cpuEmail.trim() && !data.cpuEmail.endsWith("@cpu.edu.ph")) {
      newErrors.cpuEmail = "Must use CPU email address!";
    }

    if (
      data.password.trim() &&
      data.rePassword.trim() &&
      data.password !== data.rePassword
    ) {
      newErrors.rePassword = "Passwords do not match!";
      newErrors.password = newErrors.password || "Passwords do not match!";
    }

    return newErrors;
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const validationErrors = validate(formData);
    const { name } = e.target;
    const fieldName = name as keyof SignUpFormErrors;

    setErrors((prev) => {
      const newErrors = { ...prev };

      if (validationErrors[fieldName]) {
        newErrors[fieldName] = validationErrors[fieldName];
      } else {
        delete newErrors[fieldName];
      }

      if (fieldName === "password" || fieldName === "rePassword") {
        if (validationErrors.password)
          newErrors.password = validationErrors.password;
        else delete newErrors.password;
      }

      return newErrors;
    });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof SignUpFormErrors;

    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      const validationErrors = validate(newFormData);

      if (name === "password" || name === "rePassword") {
        setErrors((prevErrors) => {
          const nextErrors = { ...prevErrors };
          if (validationErrors.password)
            nextErrors.password = validationErrors.password;
          else delete nextErrors.password;

          if (validationErrors.rePassword)
            nextErrors.rePassword = validationErrors.rePassword;
          else delete nextErrors.rePassword;

          return nextErrors;
        });
      }

      return newFormData;
    });

    setErrors((prev) => {
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
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          username: formData.username.trim(),
          cpuEmail: formData.cpuEmail.trim(),
          password: formData.password,
          rePassword: formData.rePassword.trim(),
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("name", data.user.fullname);
        navigate("/flipbook");
      } else if (response.status === 400 || response.status === 409) {
        setErrors((prev) => ({ ...prev, ...data.errors }));
        alert(data.message || "Sign-up failed.");
      } else {
        alert("Unexpected error occurred.");
      }
    } catch (error) {
      console.error(error);
      alert("Could not connect to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidationProps = (name: keyof SignUpFormErrors) => {
    const errorMessage = errors[name];
    return {
      className: `form-input ${errorMessage ? "input-error" : ""}`,
      "data-error": errorMessage || "",
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
            <button className="login-button" onClick={switchToLogin}>
              Login Here!
            </button>
          </div>
        </div>

        <div className="right-panel">
          <h2 className="panel-title">Start your Journey Today!</h2>
          <form className="signup-form" onSubmit={handleSubmit} noValidate>
            <input
              type="text"
              name="fullName"
              placeholder="Full name"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              {...getValidationProps("fullName")}
            />
            {errors.fullName && (
              <p className="error-message">{errors.fullName}</p>
            )}

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              {...getValidationProps("username")}
            />
            {errors.username && (
              <p className="error-message">{errors.username}</p>
            )}

            <input
              type="email"
              name="cpuEmail"
              placeholder="CPU email address"
              value={formData.cpuEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              {...getValidationProps("cpuEmail")}
            />
            {errors.cpuEmail && (
              <p className="error-message">{errors.cpuEmail}</p>
            )}

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              {...getValidationProps("password")}
            />
            {errors.password && (
              <p className="error-message">{errors.password}</p>
            )}

            <input
              type="password"
              name="rePassword"
              placeholder="Re-enter password"
              value={formData.rePassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${errors.rePassword ? "input-error" : ""}`}
            />
            {errors.rePassword && (
              <p className="error-message">{errors.rePassword}</p>
            )}

            <button
              type="submit"
              className="get-started-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing Up..." : "Get Started"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
