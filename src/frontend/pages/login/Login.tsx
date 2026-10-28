import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoAlert, GoMail, GoStack } from 'react-icons/go';
import { BsArrowRight, BsEye, BsEyeSlash } from 'react-icons/bs';
import { HiLockClosed } from 'react-icons/hi2';
import './Login.scss';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginFormErrors {
  username?: string;
  password?: string;
  general?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // Validation functions
  const validateUsername = (username: string): boolean => {
    return username.length >= 3;
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be at least 3 characters long';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      // Store the token in localStorage
      localStorage.setItem('client_id', data.token);

      // If remember me is checked, store the username
      if (rememberMe) {
        localStorage.setItem('remembered_username', formData.username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      // Redirect to the call history page
      navigate('/call-history');
      
    } catch (error) {
      setErrors({ 
        general: 'Invalid username or password. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    // Handle forgot password logic
    console.log('Forgot password clicked');
  };

  return (
    <div className="login">
      <div className="login__container">
        {/* Background Elements */}
        <div className="login__background">
          <div className="background-gradient"></div>
          <div className="background-pattern"></div>
        </div>

        {/* Main Content */}
        <div className="login__content">
          {/* Header Section */}
          <div className="login__header">
            <div className="logo">
              <div className="logo-icon">
                <GoStack />
              </div>
              <span className="logo-text">AI Voice</span>
            </div>
            
            <div className="welcome-text">
              <h1>Welcome Back</h1>
              <p>Sign in to access your AI Voice dashboard</p>
            </div>
          </div>

          {/* Login Form */}
          <form className="login__form" onSubmit={handleSubmit} noValidate>
            {/* General Error Message */}
            {errors.general && (
              <div className="form-error form-error--general">
                <GoAlert className="error-icon" />
                {errors.general}
              </div>
            )}

            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="form-input-container">
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`form-input ${errors.username ? 'form-input--error' : ''}`}
                  placeholder="Enter your username"
                  disabled={isLoading}
                  autoComplete="username"
                />
                <div className="input-icon">
                  <GoMail />
                </div>
              </div>
              {errors.username && <span className="form-error">{errors.username}</span>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="form-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <BsEyeSlash /> : <BsEye />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkbox-checkmark"></span>
                <span className="checkbox-label">Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <BsArrowRight className="button-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login__footer">
            <p className="security-notice">
              <HiLockClosed className="security-icon" />
              Your connection is secured with enterprise-grade encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 