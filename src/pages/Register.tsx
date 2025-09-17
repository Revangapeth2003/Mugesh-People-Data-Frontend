// src/pages/Register.tsx - Enhanced with success message
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // ✅ Not from contexts
import { useForm } from 'react-hook-form';

interface RegisterForm {
  email: string;
  password: string;
  role: 'superadmin' | 'admin';
  direction?: 'East' | 'West' | 'North' | 'South';
}

const Register: React.FC = () => {
  const { register: registerUser, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const watchRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setSuccess(false);
    clearError();
    
    try {
      const isSuccess = await registerUser(data.email, data.password, data.role, data.direction);
      if (isSuccess) {
        setSuccess(true);
        // Redirect to login after 2 seconds to show success message
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <h2 className="text-xl font-bold mb-2">Registration Successful!</h2>
            <p>Your account has been created. Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            SuperAdmin Management System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Your existing form fields... */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className="input-field mt-1"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password', { 
                  required: 'Password is required', 
                  minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                })}
                type="password"
                className="input-field mt-1"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                {...register('role', { required: 'Role is required' })}
                className="input-field mt-1"
              >
                <option value="">Select Role</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
              )}
            </div>

            {watchRole === 'admin' && (
              <div>
                <label htmlFor="direction" className="block text-sm font-medium text-gray-700">
                  Direction
                </label>
                <select
                  {...register('direction', { 
                    required: watchRole === 'admin' ? 'Direction is required for admins' : false 
                  })}
                  className="input-field mt-1"
                >
                  <option value="">Select Direction</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                </select>
                {errors.direction && (
                  <p className="text-red-500 text-sm mt-1">{errors.direction.message}</p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-primary-600 hover:text-primary-500 text-sm">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
