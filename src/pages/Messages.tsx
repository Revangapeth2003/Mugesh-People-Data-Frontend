// src/pages/Messages.tsx - FIXED WITH PROPER TYPE HANDLING
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { sheetsService } from '../services/googleSheets';
import Layout from '../components/Layout/Layout';
import { useForm } from 'react-hook-form';
import { Send, MessageSquare, Users, X } from 'lucide-react';
import type { Message, Person, Template } from '../types';
import { 
  convertToMessages, 
  convertToPeople, 
  convertToTemplates, 
  ensureArray, 
  handleApiError 
} from '../utils/typeHelpers';

interface MessageForm {
  recipients: string[];
  message: string;
  templateId?: string;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MessageForm>();
  const watchTemplateId = watch('templateId');

  // ✅ IMPROVED: Function to get auth token with debugging
  const getAuthToken = (): string | null => {
    console.log('🔍 Checking for auth tokens in localStorage...');
    
    // Check common token key names
    const possibleKeys = ['authToken', 'token', 'accessToken', 'jwt', 'bearer_token'];
    
    for (const key of possibleKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        console.log(`✅ Found token with key: ${key}`);
        console.log(`🔑 Token preview: ${token.substring(0, 20)}...`);
        return token;
      }
    }
    
    console.log('❌ No auth token found in localStorage');
    console.log('📋 Available localStorage keys:', Object.keys(localStorage));
    return null;
  };

  // ✅ FIXED: Fetch data with proper type handling
  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 Fetching data...');
      setLoading(true);
      
      const [messagesRes, peopleRes, templatesRes] = await Promise.all([
        sheetsService.getMessages(),
        sheetsService.getPeople(),
        sheetsService.getTemplates()
      ]);

      // ✅ FIXED: Use ensureArray to handle both object and array responses
      const messagesData = ensureArray(messagesRes?.data || messagesRes || []);
      const peopleData = ensureArray(peopleRes?.data || peopleRes || []);
      const templatesData = ensureArray(templatesRes?.data || templatesRes || []);

      console.log('📊 Messages data type:', Array.isArray(messagesData), messagesData.length);
      console.log('📊 People data type:', Array.isArray(peopleData), peopleData.length);
      console.log('📊 Templates data type:', Array.isArray(templatesData), templatesData.length);

      // Convert data using the helper functions
      let allMessages = convertToMessages(messagesData);
      let allPeople = convertToPeople(peopleData);
      const allTemplates = convertToTemplates(templatesData);

      // Filter by user role if needed
      if (user?.role === 'admin' && user.direction) {
        allMessages = allMessages.filter((msg: Message) => 
          msg.direction === user.direction || !msg.direction
        );
        allPeople = allPeople.filter((person: Person) => 
          person.direction === user.direction
        );
      }

      setMessages(allMessages);
      setPeople(allPeople);
      setTemplates(allTemplates);

      console.log('✅ Data fetched successfully:', {
        messages: allMessages.length,
        people: allPeople.length,
        templates: allTemplates.length
      });

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      const errorMessage = handleApiError(error);
      alert(`Failed to fetch data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Auto-fill message content when template is selected
  useEffect(() => {
    if (watchTemplateId) {
      const selectedTemplate = templates.find(t => t.title === watchTemplateId);
      if (selectedTemplate) {
        setValue('message', selectedTemplate.body);
      }
    }
  }, [watchTemplateId, templates, setValue]);

  // ✅ IMPROVED: Send message with better error handling
  const onSubmit = async (data: MessageForm) => {
    setSending(true);
    
    try {
      console.log('📤 ========== FRONTEND MESSAGE SEND START ==========');
      console.log('📤 Frontend: User data:', user);
      console.log('📤 Frontend: Selected people:', selectedPeople);
      console.log('📤 Frontend: Message data:', data);

      // Get auth token with debugging
      const authToken = getAuthToken();
      
      if (!authToken) {
        console.log('⚠️ No auth token - will only save to Google Sheets');
        
        // Save to Google Sheets only
        const sheetsMessageData = {
          senderId: user?.email || '',
          recipients: selectedPeople,
          message: data.message,
          templateId: data.templateId || '',
          direction: user?.direction || 'All',
          status: 'sent' as const
        };

        await sheetsService.createMessage(sheetsMessageData);
        console.log('✅ Message saved to Google Sheets only');
        
        // Reset form and close modal
        setShowModal(false);
        setSelectedPeople([]);
        reset();
        await fetchData();
        
        alert('Message sent to Google Sheets successfully! (Database save skipped - please log in again for full functionality)');
        return;
      }

      // Prepare message payload for API
      const messageData = {
        recipients: selectedPeople,
        message: data.message,
        templateId: data.templateId || undefined
      };

      console.log('📤 Frontend: Calling backend API...');
      console.log('🌐 Frontend: API URL:', '/api/messages');

      // Call backend API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(messageData)
      });

      console.log('📥 Frontend: API Response status:', response.status);
      console.log('📥 Frontend: API Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Frontend: API Error:', errorData);
        
        // If token is invalid, still save to sheets
        if (response.status === 401 || response.status === 403) {
          console.log('🔑 Token appears invalid - saving to sheets only');
          const sheetsMessageData = {
            senderId: user?.email || '',
            recipients: selectedPeople,
            message: data.message,
            templateId: data.templateId || '',
            direction: user?.direction || 'All',
            status: 'sent' as const
          };
          
          await sheetsService.createMessage(sheetsMessageData);
          
          setShowModal(false);
          setSelectedPeople([]);
          reset();
          await fetchData();
          
          alert('Message saved to Google Sheets! (Database save failed due to authentication - please log in again)');
          return;
        }
        
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Failed to send message'}`);
      }

      const apiResult = await response.json();
      console.log('✅ Frontend: API Success:', apiResult);

      // Also save to Google Sheets
      console.log('📊 Frontend: Saving to Google Sheets...');
      const sheetsMessageData = {
        senderId: user?.email || '',
        recipients: selectedPeople,
        message: data.message,
        templateId: data.templateId || '',
        direction: user?.direction || 'All',
        status: 'sent' as const
      };

      await sheetsService.createMessage(sheetsMessageData);
      console.log('✅ Frontend: Google Sheets save successful');

      // Reset form and close modal
      setShowModal(false);
      setSelectedPeople([]);
      reset();
      await fetchData();
      
      console.log('🎉 Frontend: Message sent successfully to both API and Sheets!');
      console.log('📤 ========== FRONTEND MESSAGE SEND END ==========');

      alert('Message sent successfully to both database and Google Sheets!');

    } catch (error) {
      console.error('❌ Frontend: Error sending message:', error);
      const errorMessage = handleApiError(error);
      alert(`Failed to send message: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  // ✅ Toggle person selection
  const togglePersonSelection = (personId: string) => {
    setSelectedPeople(prev => 
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  // ✅ Debug localStorage function
  const debugStorage = () => {
    console.log('🔍 ========== LOCALSTORAGE DEBUG ==========');
    console.log('📋 All localStorage keys:', Object.keys(localStorage));
    console.log('📋 All localStorage data:');
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(`  ${key}: ${value?.substring(0, 50)}...`);
      }
    }
    
    console.log('🔍 ========================================');
    
    const token = getAuthToken();
    if (token) {
      alert(`Found auth token! Check console for details`);
    } else {
      alert('No auth token found. Please log in first.');
    }
  };

  // ✅ Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Send messages to constituents</p>
          </div>
          <div className="flex space-x-2">
            {/* ✅ Debug button */}
            <button
              onClick={debugStorage}
              className="btn-secondary text-sm"
              title="Debug authentication token"
            >
              🔍 Debug Token
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send Message</span>
            </button>
          </div>
        </div>

        {/* Messages History */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Sent Messages ({messages.length})
          </h3>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages sent yet.</p>
            ) : (
              messages.map((message, index) => (
                <div key={message.id || `message-${index}`} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{message.message}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        To: {Array.isArray(message.recipients) 
                          ? message.recipients.join(', ') 
                          : message.recipients
                        }
                      </p>
                      {message.templateId && (
                        <p className="text-xs text-blue-600 mt-1">
                          Template: {message.templateId}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500 ml-4">
                      <p>{message.sentAt ? new Date(message.sentAt).toLocaleDateString() : 'N/A'}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        message.status === 'sent' ? 'bg-green-100 text-green-800' :
                        message.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {message.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Send Message Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Send New Message</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={sending}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Template (Optional)
                  </label>
                  <select
                    {...register('templateId')}
                    className="input-field"
                    disabled={sending}
                  >
                    <option value="">Select a template</option>
                    {templates.map((template, index) => (
                      <option key={template.id || `template-${index}`} value={template.title}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content
                  </label>
                  <textarea
                    {...register('message', { required: 'Message is required' })}
                    rows={4}
                    className="input-field"
                    placeholder="Type your message here..."
                    disabled={sending}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Select Recipients ({selectedPeople.length} selected)
                  </label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {people.length === 0 ? (
                      <p className="text-gray-500 text-sm">No people available</p>
                    ) : (
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedPeople.length === people.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPeople(people.map(p => p.id || p.name));
                              } else {
                                setSelectedPeople([]);
                              }
                            }}
                            disabled={sending}
                          />
                          <span className="ml-2 text-sm font-medium">Select All</span>
                        </label>
                        <hr />
                        {people.map((person, index) => (
                          <label key={person.id || `person-${index}`} className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={selectedPeople.includes(person.id || person.name)}
                              onChange={() => togglePersonSelection(person.id || person.name)}
                              disabled={sending}
                            />
                            <span className="ml-2 text-sm">
                              {person.name} - {person.phone} ({person.direction})
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPeople.length === 0 && (
                    <p className="text-red-500 text-xs mt-1">Please select at least one recipient</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                    disabled={selectedPeople.length === 0 || sending}
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                    disabled={sending}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Messages;
