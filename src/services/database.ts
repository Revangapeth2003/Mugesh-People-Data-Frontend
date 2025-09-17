// src/services/database.ts - FIXED DATABASE SERVICE
const API_BASE_URL = 'http://localhost:5000/api';

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
  // FIXED: Get all people from database
  async getPeople() {
    try {
      console.log('🔄 Fetching people from database...');
      
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

  // FIXED: Add person to database  
  async createPerson(personData: any) {
    try {
      console.log('🔄 Adding person to database:', personData.name);
      
      const response = await fetch(`${API_BASE_URL}/people`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(personData)
      });

      const data = await response.json();
      console.log('📥 Create response:', data);
      
      if (response.ok && data.success) {
        console.log('✅ Database create success');
        return { success: true, data: data.data };
      } else {
        console.log('❌ Database create failed:', data.message);
        return { success: false, error: data.message || 'Failed to create person' };
      }
    } catch (error: any) {
      console.log('❌ Database create error:', error.message);
      return { success: false, error: error.message || 'Unknown error' };
    }
  },

  // FIXED: Update person in database
  async updatePerson(id: string, personData: any) {
    try {
      console.log('🔄 Updating person in database:', id);
      
      const response = await fetch(`${API_BASE_URL}/people/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(personData)
      });

      const data = await response.json();
      console.log('📥 Update response:', data);
      
      return response.ok && data.success 
        ? { success: true, data: data.data }
        : { success: false, error: data.message || 'Failed to update person' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  },

  // Delete person from database
  async deletePerson(id: string) {
    try {
      console.log('🗑️ Deleting person from database:', id);
      
      const response = await fetch(`${API_BASE_URL}/people/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      console.log('📥 Delete response:', data);
      
      return response.ok && data.success 
        ? { success: true }
        : { success: false, error: data.message || 'Failed to delete person' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  },

  // FIXED: Sync Google Sheets data to database
  async syncFromGoogleSheets(peopleData: any[]) {
    try {
      console.log('🔄 Syncing', peopleData.length, 'people from Google Sheets to database...');
      
      const response = await fetch(`${API_BASE_URL}/people/sync`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(peopleData)
      });

      const data = await response.json();
      console.log('📥 Sync response:', data);
      
      if (response.ok && data.success) {
        console.log('✅ Sync completed:', data.stats);
        return data;
      } else {
        console.error('❌ Sync failed:', data.message);
        return { success: false, error: data.message || 'Sync failed' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Sync error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
};
