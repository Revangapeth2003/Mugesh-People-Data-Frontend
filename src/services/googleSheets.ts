// src/services/googleSheets.ts - UPDATED WITH DELETE TEMPLATE METHOD
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwh9LCvaGVbKFMIe0OlsroEAQOJLnyNivgakDtEdkxwM8NpurPpC9FB2vAW63iAbw/exec';

interface GoogleSheetsResponse {
  success: boolean;
  data?: Record<string, unknown>[] | Record<string, unknown>;
  error?: string;
  message?: string;
}

declare global {
  interface Window {
    [key: string]: unknown;
  }
}

class GoogleSheetsService {
  private jsonpRequest(url: string): Promise<GoogleSheetsResponse> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      
      console.log('📡 Making JSONP request to:', url.substring(0, 150) + '...');
      
      // Set up success callback
      window[callbackName] = (data: GoogleSheetsResponse) => {
        console.log('✅ JSONP response received:', data);
        cleanup();
        resolve(data);
      };
      
      // Set up error handling
      script.onerror = (error) => {
        console.error('❌ JSONP script error:', error);
        cleanup();
        reject(new Error('Failed to connect to Google Apps Script. Please check your network connection and script deployment.'));
      };
      
      script.onload = () => {
        // Set a timeout to detect if callback is never called
        setTimeout(() => {
          if (window[callbackName]) {
            console.warn('⚠️ Script loaded but callback not called - possible script error');
            cleanup();
            reject(new Error('Google Apps Script did not respond properly. Please check your script configuration.'));
          }
        }, 10000);
      };
      
      const cleanup = () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        delete window[callbackName];
      };
      
      script.src = url + '&callback=' + callbackName;
      document.head.appendChild(script);
      
      // Overall timeout
      setTimeout(() => {
        if (window[callbackName]) {
          cleanup();
          reject(new Error('Request timeout - Google Apps Script may not be responding'));
        }
      }, 30000);
    });
  }

  private async makeRequest(
    action: string,
    sheetName: string,
    data: Record<string, unknown> = {}
  ): Promise<GoogleSheetsResponse> {
    try {
      console.log('🚀 Making API request:', { action, sheetName, data });
      
      const params = new URLSearchParams({
        action,
        sheetName,
        data: JSON.stringify(data)
      });
      
      const url = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
      console.log('📡 Full request URL length:', url.length);
      
      const response = await this.jsonpRequest(url);
      console.log('✅ API Response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Unknown error from Google Apps Script');
      }
      
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Google Sheets API Error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  // ✅ UPDATED getPeople with better error handling
  async getPeople(): Promise<GoogleSheetsResponse> {
    console.log('👥 Fetching people from Google Sheets...');
    try {
      console.log('🔍 Calling makeRequest with action: READ, sheetName: People');
      const response = await this.makeRequest('read', 'People');
      console.log('📊 People response received:', response);
      
      // Handle the response format from your Google Apps Script
      if (response.success) {
        const peopleCount = Array.isArray(response.data) ? response.data.length : 0;
        console.log(`✅ Successfully fetched ${peopleCount} people from Google Sheets`);
        
        // Debug: Log first few people
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log('📝 First person data sample:', response.data[0]);
        }
        
        return response;
      } else {
        console.warn('⚠️ Google Sheets returned unsuccessful response:', response);
        return {
          success: true,
          data: [],
          message: response.error || 'No data returned from Google Sheets'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error fetching people:', errorMessage);
      // Return empty data instead of throwing to prevent app crash
      return {
        success: true,
        data: [],
        message: `Failed to fetch people data: ${errorMessage}`
      };
    }
  }

  async createPerson(personData: Record<string, unknown>): Promise<GoogleSheetsResponse> {
    console.log('➕ Creating person in Google Sheets:', personData);
    try {
      const response = await this.makeRequest('CREATE', 'People', {
        ...personData,
        id: personData.id || `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: personData.createdAt || new Date().toISOString()
      });
      console.log('✅ Person created successfully:', response);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error creating person:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async updatePerson(id: string, personData: Record<string, unknown>): Promise<GoogleSheetsResponse> {
    console.log('📝 Updating person in Google Sheets:', { id, personData });
    try {
      const response = await this.makeRequest('UPDATE', 'People', {
        ...personData,
        id,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Person updated successfully:', response);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error updating person:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async deletePerson(id: string): Promise<GoogleSheetsResponse> {
    console.log('🗑️ Deleting person from Google Sheets:', id);
    try {
      const response = await this.makeRequest('DELETE', 'People', { id });
      console.log('✅ Person deleted successfully:', response);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error deleting person:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ✅ UPDATED testConnection with more detailed testing
  async testConnection(): Promise<GoogleSheetsResponse> {
    console.log('🔧 Testing Google Sheets connection...');
    try {
      console.log('🧪 Step 1: Testing basic connection...');
      const response = await this.makeRequest('TEST', 'test');
      console.log('🧪 Step 2: Connection test response:', response);
      
      if (response.success) {
        console.log('✅ Connection test successful!');
        
        // Test reading people as well
        console.log('🧪 Step 3: Testing people data fetch...');
        const peopleResponse = await this.getPeople();
        console.log('🧪 Step 4: People test response:', peopleResponse);
        
        return {
          success: true,
          message: `Connection successful! People found: ${Array.isArray(peopleResponse.data) ? peopleResponse.data.length : 0}`,
          data: {
            connectionTest: response,
            peopleTest: peopleResponse
          }
        };
      } else {
        throw new Error(response.error || 'Connection test failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Connection test failed:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Keep your existing methods...
  async createUser(userData: Record<string, unknown>): Promise<GoogleSheetsResponse> {
    console.log('👤 Creating user:', userData);
    return this.makeRequest('CREATE', 'Users', {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    });
  }

  async getUsers(): Promise<GoogleSheetsResponse> {
    console.log('📋 Fetching users...');
    return this.makeRequest('read', 'Users');
  }

  async getMessages(): Promise<GoogleSheetsResponse> {
    console.log('📧 Fetching messages from Google Sheets...');
    return this.makeRequest('read', 'Messages');
  }

  async createMessage(messageData: Record<string, unknown>): Promise<GoogleSheetsResponse> {
    console.log('➕ Creating message in Google Sheets:', messageData);
    return this.makeRequest('CREATE', 'Messages', {
      ...messageData,
      id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  }

  async getTemplates(): Promise<GoogleSheetsResponse> {
    console.log('📄 Fetching templates from Google Sheets...');
    return this.makeRequest('read', 'Templates');
  }

  async createTemplate(templateData: Record<string, unknown>): Promise<GoogleSheetsResponse> {
    console.log('➕ Creating template in Google Sheets:', templateData);
    return this.makeRequest('CREATE', 'Templates', {
      ...templateData,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    });
  }

  // ✅ ADDED: Missing deleteTemplate method
  async deleteTemplate(id: string): Promise<GoogleSheetsResponse> {
    console.log('🗑️ Deleting template from Google Sheets:', id);
    try {
      const response = await this.makeRequest('DELETE', 'Templates', { id });
      console.log('✅ Template deleted successfully:', response);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error deleting template:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ✅ BONUS: Added updateTemplate method for future use
  async updateTemplate(id: string, templateData: Record<string, unknown>): Promise<GoogleSheetsResponse> {
    console.log('📝 Updating template in Google Sheets:', { id, templateData });
    try {
      const response = await this.makeRequest('UPDATE', 'Templates', {
        ...templateData,
        id,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Template updated successfully:', response);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error updating template:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export const sheetsService = new GoogleSheetsService();
