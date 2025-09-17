// src/utils/typeHelpers.ts - UPDATED WITH VOTER ID
import type { Person, User, Message, Template } from '../types';

// ✅ RE-EXPORT the types so other files can import them from this module
export type { Message, Template, Person, User } from '../types';

// ✅ Convert raw data to people (with Voter ID)
export const convertToPeople = (rawData: any[]): Person[] => {
  console.log('🔄 Converting raw data to people:', rawData);
  
  if (!Array.isArray(rawData)) {
    console.warn('❌ Raw data is not an array:', rawData);
    return [];
  }

  return rawData.map((row: any, index: number) => {
    try {
      return {
        id: row.id || `person_${Date.now()}_${index}`,
        name: row.name || '',
        age: parseInt(row.age) || 0,
        phone: row.phone || '',
        address: row.address || '',
        ward: row.ward || '',
        street: row.street || '',
        direction: row.direction || 'East',
        aadharNumber: row.aadharNumber || '000000000000',
        panNumber: row.panNumber || 'ABCDE1234F',
        voterIdNumber: row.voterIdNumber || 'ABC1234567', // ✅ NEW VOTER ID FIELD
        gender: row.gender || 'Male',
        religion: row.religion || 'Hindu',
        caste: row.caste || 'General',
        community: row.community || 'General',
        createdBy: row.createdBy || 'sheets@example.com',
        createdAt: row.createdAt || new Date().toISOString()
      } as Person;
    } catch (error) {
      console.error('❌ Error converting row to Person:', error, row);
      return null;
    }
  }).filter(Boolean) as Person[];
};

// ✅ Convert raw data to users
export const convertToUsers = (rawData: any[]): User[] => {
  console.log('🔄 Converting raw data to users:', rawData);
  
  if (!Array.isArray(rawData)) {
    console.warn('❌ Raw data is not an array:', rawData);
    return [];
  }

  return rawData.map((row: any, index: number) => {
    try {
      return {
        id: row.id || `user_${Date.now()}_${index}`,
        email: row.email || '',
        role: (row.role === 'superadmin' || row.role === 'admin') ? row.role : 'admin',
        direction: row.direction || undefined,
        createdAt: row.createdAt || new Date().toISOString()
      } as User;
    } catch (error) {
      console.error('❌ Error converting row to User:', error, row);
      return null;
    }
  }).filter(Boolean) as User[];
};

// ✅ Convert raw data to messages
export const convertToMessages = (rawData: any[]): Message[] => {
  console.log('🔄 Converting raw data to messages:', rawData);
  
  if (!Array.isArray(rawData)) {
    console.warn('❌ Raw data is not an array:', rawData);
    return [];
  }

  return rawData.map((row: any, index: number) => {
    try {
      return {
        id: row.id || `message_${Date.now()}_${index}`,
        senderId: row.senderId || '',
        recipients: Array.isArray(row.recipients) ? row.recipients : 
                   typeof row.recipients === 'string' ? row.recipients.split(',') : [],
        message: row.message || '',
        templateId: row.templateId || undefined,
        direction: row.direction || undefined,
        status: ['pending', 'sent', 'failed'].includes(row.status) ? row.status : 'pending',
        sentAt: row.sentAt || undefined,
        createdAt: row.createdAt || new Date().toISOString()
      } as Message;
    } catch (error) {
      console.error('❌ Error converting row to Message:', error, row);
      return null;
    }
  }).filter(Boolean) as Message[];
};

// ✅ Convert raw data to templates
export const convertToTemplates = (rawData: any[]): Template[] => {
  console.log('🔄 Converting raw data to templates:', rawData);
  
  if (!Array.isArray(rawData)) {
    console.warn('❌ Raw data is not an array:', rawData);
    return [];
  }

  return rawData.map((row: any, index: number) => {
    try {
      return {
        id: row.id || `template_${Date.now()}_${index}`,
        title: row.title || '',
        body: row.body || '',
        createdBy: row.createdBy || '',
        createdAt: row.createdAt || new Date().toISOString()
      } as Template;
    } catch (error) {
      console.error('❌ Error converting row to Template:', error, row);
      return null;
    }
  }).filter(Boolean) as Template[];
};

// ✅ Helper function to safely handle API responses that might be objects or arrays
export const ensureArray = <T>(data: T | T[]): T[] => {
  if (Array.isArray(data)) {
    return data;
  }
  return data ? [data] : [];
};

// ✅ Helper function for type-safe error handling
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};
