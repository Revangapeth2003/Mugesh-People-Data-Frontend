// src/pages/AdminManagement.tsx - FIXED WITH BETTER ID HANDLING
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout/Layout';
import { useForm } from 'react-hook-form';
import { UserPlus, Shield, Trash2, X, Plus, Users, AlertCircle, Edit, Eye, EyeOff } from 'lucide-react';

interface AdminForm {
  email: string;
  password: string;
  direction: 'East' | 'West' | 'North' | 'South';
}

interface EditForm {
  email: string;
  direction: 'East' | 'West' | 'North' | 'South';
}

interface User {
  id?: string;        // Make optional to handle both _id and id
  _id?: string;       // Add _id for MongoDB compatibility
  email: string;
  role: 'admin' | 'superadmin';
  direction?: 'East' | 'West' | 'North' | 'South';
  createdAt?: string;
  isActive?: boolean;
}

const AdminManagement: React.FC = () => {
  const { user, register: registerUser, getAllUsers, updateUser, deleteUser } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminForm>();
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue, formState: { errors: editErrors } } = useForm<EditForm>();

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchAdmins();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching admins from database...');
      
      const result = await getAllUsers();
      
      if (result.success && result.users) {
        // Filter only admin users that are active
        const adminUsers = result.users.filter((u: User) => 
          u.role === 'admin' && (u.isActive !== false)
        );
        setAdmins(adminUsers);
        console.log('✅ Fetched admins:', adminUsers.length);
        console.log('🔍 Sample admin:', adminUsers[0]); // Debug log
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to fetch admins' });
        setAdmins([]);
      }
    } catch (error) {
      console.error('❌ Error fetching admins:', error);
      setMessage({ type: 'error', text: 'Failed to fetch admins' });
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AdminForm) => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setMessage(null);
      
      console.log('📝 Creating new admin:', { email: data.email, direction: data.direction });
      
      const success = await registerUser(data.email, data.password, 'admin', data.direction);
      
      if (success) {
        setShowModal(false);
        reset();
        await fetchAdmins(); // Refresh the list
        setMessage({ type: 'success', text: 'Admin created successfully!' });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: 'Failed to create admin. Please try again.' });
      }
    } catch (error) {
      console.error('❌ Error creating admin:', error);
      setMessage({ type: 'error', text: 'Failed to create admin. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (data: EditForm) => {
    if (submitting || !editingUser) return;
    
    try {
      setSubmitting(true);
      setMessage(null);
      
      // ✅ FIX: Get the proper user ID
      const userId = getValidUserId(editingUser);
      
      if (!userId) {
        setMessage({ type: 'error', text: 'Invalid user ID. Cannot update admin.' });
        setSubmitting(false);
        return;
      }
      
      console.log('✏️ Updating admin:', { userId, email: data.email, direction: data.direction });
      
      const result = await updateUser(userId, data.email, data.direction);
      
      if (result.success) {
        setShowEditModal(false);
        setEditingUser(null);
        resetEdit();
        await fetchAdmins(); // Refresh the list
        setMessage({ type: 'success', text: 'Admin updated successfully!' });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update admin. Please try again.' });
      }
    } catch (error) {
      console.error('❌ Error updating admin:', error);
      setMessage({ type: 'error', text: 'Failed to update admin. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ HELPER FUNCTION: Get valid user ID from either id or _id
  const getValidUserId = (admin: User): string | null => {
    const userId = admin.id || admin._id || (admin as any)._id;
    console.log('🔍 Getting user ID for:', { admin, userId });
    return userId ? String(userId) : null;
  };

  // ✅ FIXED: Handle edit click with proper ID validation
  const handleEditClick = (admin: User) => {
    console.log('🔍 DEBUG - Edit click admin object:', admin);
    console.log('🔍 DEBUG - admin.id:', admin.id);
    console.log('🔍 DEBUG - admin._id:', admin._id);
    console.log('🔍 DEBUG - All admin keys:', Object.keys(admin));
    
    const userId = getValidUserId(admin);
    
    if (!userId) {
      setMessage({ type: 'error', text: 'Cannot edit admin: Invalid user ID' });
      return;
    }
    
    setEditingUser({
      ...admin,
      id: userId // Ensure we have a valid id
    });
    setValue('email', admin.email);
    setValue('direction', admin.direction || 'East');
    setShowEditModal(true);
  };

  // ✅ FIXED: Handle delete click with proper ID validation
  const handleDeleteClick = async (admin: User) => {
    console.log('🔍 DEBUG - Delete click admin object:', admin);
    
    const userId = getValidUserId(admin);
    
    if (!userId) {
      setMessage({ type: 'error', text: 'Cannot delete admin: Invalid user ID' });
      return;
    }
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete admin "${admin.email}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      setSubmitting(true);
      setMessage(null);
      
      console.log('🗑️ Deleting admin with ID:', userId);
      
      const result = await deleteUser(userId);
      
      if (result.success) {
        await fetchAdmins(); // Refresh the list
        setMessage({ type: 'success', text: 'Admin deleted successfully!' });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete admin. Please try again.' });
      }
    } catch (error) {
      console.error('❌ Error deleting admin:', error);
      setMessage({ type: 'error', text: 'Failed to delete admin. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const addSampleAdmins = async () => {
    console.log('🧪 Adding sample admins...');
    setSubmitting(true);
    setMessage(null);
    
    const sampleAdmins = [
      { email: 'east.admin@example.com', password: 'password123', direction: 'East' as const },
      { email: 'west.admin@example.com', password: 'password123', direction: 'West' as const },
      { email: 'north.admin@example.com', password: 'password123', direction: 'North' as const },
      { email: 'south.admin@example.com', password: 'password123', direction: 'South' as const }
    ];
    
    let successCount = 0;
    
    for (const admin of sampleAdmins) {
      try {
        const success = await registerUser(admin.email, admin.password, 'admin', admin.direction);
        if (success) {
          successCount++;
        }
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error adding sample admin:', error);
      }
    }
    
    await fetchAdmins(); // Refresh the list
    
    if (successCount > 0) {
      setMessage({ 
        type: 'success', 
        text: `Successfully created ${successCount} sample admin${successCount !== 1 ? 's' : ''}!` 
      });
      // Auto-hide success message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({ 
        type: 'error', 
        text: 'Failed to create sample admins. They may already exist.' 
      });
    }
    
    setSubmitting(false);
  };

  if (user?.role !== 'superadmin') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-96 text-center p-6">
          <div className="bg-red-100 p-4 rounded-full mb-6">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-2">Only Super Admins can access this page.</p>
          <p className="text-gray-400 text-sm">Current role: {user?.role || 'Not logged in'}</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading admin data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Message Alert */}
        {message && (
          <div className={`rounded-2xl p-4 flex items-start ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <AlertCircle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`} />
            <span className={`text-sm font-medium flex-1 ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </span>
            <button 
              onClick={() => setMessage(null)}
              className="ml-3 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Admin Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                Manage admin users and their access ({admins.length} admins)
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  👑 Super Admin Panel
                </span>
                
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={addSampleAdmins}
                disabled={submitting}
                className="flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                {submitting ? 'Adding...' : 'Add Sample Admins'}
              </button>
              <button
                onClick={() => setShowModal(true)}
                disabled={submitting}
                className="flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        

        {/* Admins Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Email</th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Direction</th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Role</th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Created At</th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Status</th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 px-4">
                      <div className="space-y-3">
                        <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No admins created yet</p>
                        <p className="text-gray-400 text-sm">Click "Add Admin" or "Add Sample Admins" to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  admins.map((admin, index) => {
                    const userId = getValidUserId(admin);
                    return (
                      <tr key={userId || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-medium text-gray-900 text-sm sm:text-base break-all">
                            {admin.email}
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            admin.direction === 'East' ? 'bg-blue-100 text-blue-800' :
                            admin.direction === 'West' ? 'bg-green-100 text-green-800' :
                            admin.direction === 'North' ? 'bg-yellow-100 text-yellow-800' :
                            admin.direction === 'South' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {admin.direction || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {admin.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-gray-700 text-sm">
                          {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            admin.isActive !== false 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditClick(admin)}
                              disabled={submitting || !userId}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Edit admin"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(admin)}
                              disabled={submitting || !userId}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete admin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Admin Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-full overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Add New Admin</h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      reset();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={submitting}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                          message: 'Please enter a valid email',
                        },
                      })}
                      type="email"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="Enter admin email"
                      disabled={submitting}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-2">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        {...register('password', {
                          required: 'Password is required',
                          minLength: { value: 6, message: 'Password must be at least 6 characters' },
                        })}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder="Enter admin password"
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-2">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Direction *
                    </label>
                    <select
                      {...register('direction', { required: 'Direction is required' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      disabled={submitting}
                    >
                      <option value="">Select Direction</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                    </select>
                    {errors.direction && (
                      <p className="text-red-500 text-xs mt-2">{errors.direction.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        'Create Admin'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        reset();
                      }}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Admin Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-full overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Edit Admin</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                      resetEdit();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={submitting}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      {...registerEdit('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                          message: 'Please enter a valid email',
                        },
                      })}
                      type="email"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="Enter admin email"
                      disabled={submitting}
                    />
                    {editErrors.email && (
                      <p className="text-red-500 text-xs mt-2">{editErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Direction *
                    </label>
                    <select
                      {...registerEdit('direction', { required: 'Direction is required' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      disabled={submitting}
                    >
                      <option value="">Select Direction</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                    </select>
                    {editErrors.direction && (
                      <p className="text-red-500 text-xs mt-2">{editErrors.direction.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        'Update Admin'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                        resetEdit();
                      }}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminManagement;
