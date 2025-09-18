// src/contexts/AuthContext.tsx - FIXED VERSION
import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';

interface User {
  id?: string;
  _id?: string;
  email: string;
  role: 'admin' | 'superadmin';
  direction?: 'East' | 'West' | 'North' | 'South';
  createdAt?: string;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, role: string, direction?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  getAllUsers: () => Promise<{ success: boolean; users?: User[]; message?: string }>;
  updateUser: (userId: string, email: string, direction?: string) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIXED: Correct API URL without trailing slash
  const API_BASE_URL = 'https://mugesh-backend-7331.vercel.app/api';

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔍 Initializing authentication...');
      
      try {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          console.log('🔐 Token found, verifying...');
          
          // ✅ FIXED: Correct endpoint path
          const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
              setUser(data.user);
              console.log('✅ User session restored:', data.user.email);
            } else {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
            }
          } else {
            console.log('❌ Token verification failed');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setLoading(false);
        console.log('✅ Authentication initialization completed');
      }
    };

    initializeAuth();
  }, []);

  const clearError = () => setError(null);

  // ✅ FIXED: Login function with correct URL
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Login attempt:', email);
      
      // ✅ FIXED: Correct endpoint URL
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Login successful:', data.user.email, data.user.role);
        
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        setUser(data.user);
        
        return true;
      } else {
        console.log('❌ Login failed:', data.message);
        setError(data.message || 'Login failed');
        return false;
      }
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setError('Network error. Please check your connection and try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Register function with correct URL
  const register = async (email: string, password: string, role: string, direction?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Registration attempt:', { email, role, direction });
      
      const token = localStorage.getItem('auth_token');
      const requestBody = {
        email,
        password,
        role,
        direction: role === 'admin' ? direction : undefined
      };
      
      // ✅ FIXED: Correct endpoint URL
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Registration successful:', data.user.email);
        
        if (role !== 'superadmin') {
          return true;
        }
        
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        setUser(data.user);
        
        return true;
      } else {
        console.log('❌ Registration failed:', data.message);
        setError(data.message || 'Registration failed');
        return false;
      }
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      setError('Network error. Please check your connection and try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Get all users function
  const getAllUsers = async (): Promise<{ success: boolean; users?: User[]; message?: string }> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'No authentication token' };
      }

      console.log('👥 Fetching all users...');
      
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const mappedUsers = data.users.map((user: any) => ({
            ...user,
            id: user.id || user._id?.toString() || user._id,
            _id: user._id
          }));
          
          console.log('✅ Users fetched and mapped:', mappedUsers.length);
          
          return { success: true, users: mappedUsers };
        } else {
          console.log('❌ Failed to fetch users:', data.message);
          return { success: false, message: data.message };
        }
      } else {
        console.log('❌ Response not OK:', response.status);
        return { success: false, message: 'Failed to fetch users' };
      }
    } catch (error: any) {
      console.error('❌ Get users error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  // ✅ FIXED: Update user function
  const updateUser = async (userId: string, email: string, direction?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'No authentication token' };
      }

      console.log('✏️ Updating user:', { userId, email, direction });
      
      if (!userId || userId === 'undefined') {
        console.error('❌ Invalid userId:', userId);
        return { success: false, message: 'Invalid user ID' };
      }
      
      // ✅ FIXED: Correct endpoint URL (note: /api/users, not /api/auth/users)
      const response = await fetch(`https://mugesh-backend-7331.vercel.app/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          role: 'admin',
          direction
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User updated successfully:', data);
        return { success: true, message: 'User updated successfully' };
      } else {
        const data = await response.json();
        console.log('❌ Failed to update user:', data);
        return { success: false, message: data.message || 'Failed to update user' };
      }
    } catch (error: any) {
      console.error('❌ Update user error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  // ✅ FIXED: Delete user function
  const deleteUser = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'No authentication token' };
      }

      console.log('🗑️ Deleting user:', userId);
      
      if (!userId || userId === 'undefined') {
        console.error('❌ Invalid userId:', userId);
        return { success: false, message: 'Invalid user ID' };
      }
      
      // ✅ FIXED: Correct endpoint URL
      const response = await fetch(`https://mugesh-backend-7331.vercel.app/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ User deleted successfully');
        return { success: true, message: 'User deleted successfully' };
      } else {
        const data = await response.json();
        console.log('❌ Failed to delete user:', data);
        return { success: false, message: data.message || 'Failed to delete user' };
      }
    } catch (error: any) {
      console.error('❌ Delete user error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  // ✅ FIXED: Change password function
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'No authentication token' };
      }

      if (!user?.id && !user?._id) {
        return { success: false, message: 'User not found' };
      }

      console.log('🔐 Changing password for user:', user.email);
      
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          userId: user.id || user._id
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Password changed successfully');
        return { success: true, message: 'Password updated successfully' };
      } else {
        console.log('❌ Password change failed:', data.message);
        return { success: false, message: data.message || 'Failed to change password' };
      }
      
    } catch (error: any) {
      console.error('❌ Change password error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user:', user?.email);
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setError(null);
    
    console.log('✅ Logout completed');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading, 
      error, 
      clearError,
      getAllUsers,
      updateUser,
      deleteUser,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
