// src/services/database.ts - CORRECTED FOR VERCEL BACKEND
const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : 'https://mugesh-backend-7331.vercel.app/api';  // ✅ Correct URL

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authtoken');

// Get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const databaseService = {
  async getPeople() {
    try {
      console.log('🔄 Fetching people from:', API_BASE_URL); // Debug log
      
      const response = await fetch(`${API_BASE_URL}/people`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Raw database response:', data);
      
      if (data.success && Array.isArray(data.data)) {
        console.log('✅ Fetched', data.data.length, 'people from database');
        return { 
          success: true, 
          data: data.data, 
          count: data.count || data.data.length,
          message: data.message || 'Data fetched successfully'
        };
      } else {
        console.warn('⚠️ Database returned no data or unsuccessful response:', data);
        return { 
          success: true, 
          data: [], 
          count: 0,
          message: data.message || 'No data available'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Database fetch error:', errorMessage);
      return { 
        success: false, 
        error: errorMessage, 
        data: [],
        count: 0
      };
    }
  },

  // Keep all your other methods exactly as they are...
  // Just make sure they all use API_BASE_URL
};
