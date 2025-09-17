// src/pages/Settings.tsx - UPDATED TO USE YOUR AUTH CONTEXT
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout/Layout';
import { useForm } from 'react-hook-form';
import { Settings as SettingsIcon, User, Lock, Save } from 'lucide-react';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings: React.FC = () => {
  const { user, changePassword } = useAuth(); // ✅ Use your changePassword function
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordForm>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const watchNewPassword = watch('newPassword');

  const onPasswordSubmit = async (data: PasswordForm) => {
    setLoading(true);
    setMessage('');

    try {
      // ✅ Use your AuthContext changePassword function
      const result = await changePassword(data.currentPassword, data.newPassword);
      
      if (result.success) {
        setMessage('Password updated successfully!');
        reset(); // Clear the form
      } else {
        setMessage(result.message || 'Error updating password. Please try again.');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      setMessage('Error updating password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <SettingsIcon className="h-8 w-8 mr-3" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="card">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                activeTab === 'password'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Lock className="h-4 w-4 inline mr-2" />
              Password
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Profile Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="input-field bg-gray-100 capitalize"
                  />
                  <p className="text-xs text-gray-500 mt-1">Role is assigned by Super Admin</p>
                </div>

                {user?.direction && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Direction
                    </label>
                    <input
                      type="text"
                      value={user.direction}
                      disabled
                      className="input-field bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Direction is assigned by Super Admin</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Change Password</h3>
              
              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    {...register('currentPassword', { required: 'Current password is required' })}
                    type="password"
                    className="input-field"
                    placeholder="Enter current password"
                  />
                  {errors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    {...register('newPassword', { 
                      required: 'New password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    type="password"
                    className="input-field"
                    placeholder="Enter new password"
                  />
                  {errors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    {...register('confirmPassword', { 
                      required: 'Please confirm your new password',
                      validate: value => value === watchNewPassword || 'Passwords do not match'
                    })}
                    type="password"
                    className="input-field"
                    placeholder="Confirm new password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {message && (
                  <div className={`p-3 rounded-lg ${
                    message.includes('successfully') 
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* System Information */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-gray-600">Last Login</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Account Type</p>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
