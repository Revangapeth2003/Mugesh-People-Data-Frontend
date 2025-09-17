import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sheetsService } from '../services/googleSheets';
import Layout from '../components/Layout/Layout';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, X, Save, AlertCircle } from 'lucide-react';
import type { Person } from '../types';
import { convertToPeople } from '../utils/typeHelpers';

// Form data type with optional fields for form validation
interface PersonFormData {
  name: string;
  age: number;
  phone: string;
  aadharNumber: string;
  panNumber?: string;
  voterIdNumber?: string;
  gender?: "Male" | "Female" | "Other";
  community: string;
  ward: string;
  address: string;
  street: string;
  direction: string;
  caste: string;
  religion: string;
  // Add index signature for compatibility with Partial<Person>
  [key: string]: unknown;
}

const People: React.FC = () => {
  const { user } = useAuth();
  
  // States - ONLY Google Sheets
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Person>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // ENHANCED VALIDATION STATES
  const [validationErrors, setValidationErrors] = useState<{
    phone: string;
    aadharNumber: string;
    panNumber: string;
    voterIdNumber: string;
  }>({
    phone: '',
    aadharNumber: '',
    panNumber: '',
    voterIdNumber: ''
  });

  const [editValidationErrors, setEditValidationErrors] = useState<{
    phone: string;
    aadharNumber: string;
    panNumber: string;
    voterIdNumber: string;
  }>({
    phone: '',
    aadharNumber: '',
    panNumber: '',
    voterIdNumber: ''
  });

  const [isValidating, setIsValidating] = useState<{
    phone: boolean;
    aadharNumber: boolean;
    panNumber: boolean;
    voterIdNumber: boolean;
  }>({
    phone: false,
    aadharNumber: false,
    panNumber: false,
    voterIdNumber: false
  });

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<PersonFormData>();

  // Get user direction
  const getUserDirection = useCallback(() => {
    try {
      if (!user) return null;
      if (user.role === 'superadmin') return null;
      if (user.role === 'admin' && user.direction) return user.direction;
      return null;
    } catch (error) {
      console.error('Error in getUserDirection:', error);
      return null;
    }
  }, [user]);

  // SIMPLIFIED: Fetch data from Google Sheets only
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔄 Fetching people from Google Sheets...');
      
      const sheetsResponse = await sheetsService.getPeople();

      if (sheetsResponse.success && sheetsResponse.data) {
        // Fix: Ensure data is always an array before calling convertToPeople
        const dataArray = Array.isArray(sheetsResponse.data) ? sheetsResponse.data : [sheetsResponse.data];
        const convertedData = convertToPeople(dataArray);
        const userDirection = getUserDirection();
        const filteredSheets = userDirection 
          ? convertedData.filter((person: Person) => person.direction === userDirection)
          : convertedData;
        setPeople(filteredSheets);
        console.log('✅ Google Sheets data loaded:', filteredSheets.length, 'people');
      } else {
        console.error('❌ Google Sheets fetch failed:', sheetsResponse.error);
        setPeople([]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [user, getUserDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ENHANCED Validation function with individual field errors
  const validateUniqueFields = useCallback(async (data: Partial<Person>, excludeId?: string, isEditMode = false) => {
    const errors = {
      phone: '',
      aadharNumber: '',
      panNumber: '',
      voterIdNumber: ''
    };

    // Set validating states
    setIsValidating({
      phone: !!data.phone,
      aadharNumber: !!data.aadharNumber,
      panNumber: !!data.panNumber,
      voterIdNumber: !!data.voterIdNumber
    });

    // Check Aadhaar number uniqueness - FIXED with proper string comparison
    if (data.aadharNumber && data.aadharNumber !== "NA" && data.aadharNumber.trim() !== "") {
      const aadharDuplicate = people.find(person => 
        person.id !== excludeId && 
        String(person.aadharNumber).trim() === String(data.aadharNumber).trim() &&
        person.aadharNumber !== "NA" && 
        person.aadharNumber !== ""
      );
      if (aadharDuplicate) {
        errors.aadharNumber = `Already registered for ${aadharDuplicate.name}`;
      }
    }

    // Check PAN number uniqueness
    if (data.panNumber && data.panNumber !== "NA" && data.panNumber.trim() !== "") {
      const panUpper = data.panNumber.toUpperCase().trim();
      const panDuplicate = people.find(person => 
        person.id !== excludeId && 
        String(person.panNumber || "").toUpperCase().trim() === panUpper &&
        person.panNumber !== "NA" && 
        person.panNumber !== ""
      );
      if (panDuplicate) {
        errors.panNumber = `Already registered for ${panDuplicate.name}`;
      }
    }

    // Check Voter ID uniqueness
    if (data.voterIdNumber && data.voterIdNumber !== "NA" && data.voterIdNumber.trim() !== "") {
      const voterIdUpper = data.voterIdNumber.toUpperCase().trim();
      const voterIdDuplicate = people.find(person => 
        person.id !== excludeId && 
        String(person.voterIdNumber || "").toUpperCase().trim() === voterIdUpper &&
        person.voterIdNumber !== "NA" && 
        person.voterIdNumber !== ""
      );
      if (voterIdDuplicate) {
        errors.voterIdNumber = `Already registered for ${voterIdDuplicate.name}`;
      }
    }

    // Check Phone number uniqueness
    if (data.phone && data.phone !== "NA" && data.phone.trim() !== "") {
      const phoneDuplicate = people.find(person => 
        person.id !== excludeId && 
        String(person.phone).trim() === String(data.phone).trim() &&
        person.phone !== "NA" && 
        person.phone !== ""
      );
      if (phoneDuplicate) {
        errors.phone = `Already registered for ${phoneDuplicate.name}`;
      }
    }

    // Set validation errors - FIXED: Properly set edit validation errors
    if (isEditMode) {
      setEditValidationErrors(errors);
    } else {
      setValidationErrors(errors);
    }

    // Clear validating states
    setTimeout(() => {
      setIsValidating({
        phone: false,
        aadharNumber: false,
        panNumber: false,
        voterIdNumber: false
      });
    }, 300);

    return Object.values(errors).filter(error => error !== '');
  }, [people]);

  // IMPROVED: Create person in Google Sheets only
  const onSubmit = async (data: PersonFormData) => {
    if (submitting) return;

    try {
      setSubmitting(true);

      // Validate unique fields
      const validationErrorsArray = await validateUniqueFields(data, undefined, false);
      if (validationErrorsArray.length > 0) {
        return; // Stop submission if validation fails
      }

      // Prepare data
      let assignedDirection = data.direction;
      if (user?.role === 'admin' && user.direction) {
        assignedDirection = user.direction;
      }

      // Fix: Ensure all required fields are properly typed
      const personData: Person = {
        ...data,
        id: `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        direction: assignedDirection,
        createdBy: user?.email || 'unknown@example.com',
        panNumber: data.panNumber?.toUpperCase() || '',
        voterIdNumber: data.voterIdNumber?.toUpperCase() || '',
        gender: (data.gender?.trim() as "Male" | "Female" | "Other") || "Other",
        createdAt: new Date().toISOString()
      };

      console.log('🔄 Creating person in Google Sheets:', personData);

      const sheetsResult = await sheetsService.createPerson(personData);

      if (sheetsResult.success) {
        setPeople(prev => [personData, ...prev]);
        setShowModal(false);
        reset();
        // Clear validation errors
        setValidationErrors({
          phone: '',
          aadharNumber: '',
          panNumber: '',
          voterIdNumber: ''
        });
        alert('✅ Person created successfully in Google Sheets!');
        console.log('✅ Person created successfully');
      } else {
        alert(`❌ Failed to create person: ${sheetsResult.error}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error creating person:', error);
      alert(`Error creating person: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // IMPROVED: Update person in Google Sheets only
  const updatePerson = async (personId: string) => {
    if (!editData || !personId || submitting) return;

    try {
      setSubmitting(true);

      // Validate unique fields (excluding current person) - FIXED: Pass isEditMode = true
      const validationErrorsArray = await validateUniqueFields(editData, personId, true);
      if (validationErrorsArray.length > 0) {
        return; // Stop update if validation fails
      }

      console.log('🔄 Updating person:', personId, editData);

      // Fix: Normalize data with proper type handling
      const normalizedData: Partial<Person> = {
        ...editData,
        panNumber: editData.panNumber ? String(editData.panNumber).toUpperCase() : undefined,
        voterIdNumber: editData.voterIdNumber ? String(editData.voterIdNumber).toUpperCase() : undefined,
        gender: editData.gender ? (String(editData.gender).trim() as "Male" | "Female" | "Other") : "Other"
      };

      const sheetsResult = await sheetsService.updatePerson(personId, normalizedData);

      if (sheetsResult.success) {
        // Fix: Ensure state update maintains proper types
        setPeople(prev => prev.map(p => 
          p.id === personId 
            ? { 
                ...p, 
                ...normalizedData,
                // Ensure required fields are never undefined
                panNumber: normalizedData.panNumber || p.panNumber || "",
                voterIdNumber: normalizedData.voterIdNumber || p.voterIdNumber || "",
                gender: normalizedData.gender || p.gender
              } 
            : p
        ));
        setEditingId(null);
        setEditData({});
        // Clear validation errors
        setEditValidationErrors({
          phone: '',
          aadharNumber: '',
          panNumber: '',
          voterIdNumber: ''
        });
        alert('✅ Person updated successfully!');
      } else {
        alert(`❌ Failed to update person: ${sheetsResult.error}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error updating person:', error);
      alert(`Error updating person: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // SIMPLIFIED: Delete person from Google Sheets only
  const deletePerson = async (personId: string, personName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${personName}?`);
    if (!confirmed || submitting) return;

    try {
      setSubmitting(true);
      console.log('🗑️ Deleting person:', personId);

      const sheetsResult = await sheetsService.deletePerson(personId);

      if (sheetsResult.success) {
        setPeople(prev => prev.filter(p => p.id !== personId));
        alert('✅ Person deleted successfully!');
      } else {
        alert(`❌ Failed to delete person: ${sheetsResult.error}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error deleting person:', error);
      alert(`Error deleting person: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // FIXED: Edit handlers with proper validation error clearing
  const startEdit = (person: Person) => {
    const userDirection = getUserDirection();
    if (userDirection && person.direction !== userDirection) {
      alert(`Access denied! You can only edit ${userDirection} direction people.`);
      return;
    }
    setEditingId(person.id!);
    setEditData({ ...person });
    // Clear validation errors
    setEditValidationErrors({
      phone: '',
      aadharNumber: '',
      panNumber: '',
      voterIdNumber: ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    // Clear validation errors
    setEditValidationErrors({
      phone: '',
      aadharNumber: '',
      panNumber: '',
      voterIdNumber: ''
    });
  };

  const handleEditChange = (field: keyof Person, value: string | number) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    // Clear specific validation error when user starts typing
    if (field === 'phone' || field === 'aadharNumber' || field === 'panNumber' || field === 'voterIdNumber') {
      setEditValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // ENHANCED Real-time validation for ADD form
  const watchedValues = watch();
  useEffect(() => {
    if (showModal && (watchedValues.aadharNumber || watchedValues.panNumber || watchedValues.voterIdNumber || watchedValues.phone)) {
      // Debounce validation to avoid too many checks
      const timeoutId = setTimeout(() => {
        validateUniqueFields(watchedValues as Partial<Person>, undefined, false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues.aadharNumber, watchedValues.panNumber, watchedValues.voterIdNumber, watchedValues.phone, validateUniqueFields, showModal]);

  // FIXED: Real-time validation for EDIT mode - this was missing proper setup
  useEffect(() => {
    if (editingId && editData && (editData.aadharNumber || editData.panNumber || editData.voterIdNumber || editData.phone)) {
      // Debounce validation to avoid too many checks
      const timeoutId = setTimeout(() => {
        validateUniqueFields(editData, editingId, true); // FIXED: Pass isEditMode = true
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [editData?.aadharNumber, editData?.panNumber, editData?.voterIdNumber, editData?.phone, editingId, validateUniqueFields]);

  // Filtered people for search
  const filteredPeople = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return people;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return people.filter(person => {
      const searchableFields = [
        person.name,
        person.phone,
        person.ward,
        person.address,
        person.street,
        person.direction,
        String(person.aadharNumber),
        person.panNumber,
        person.voterIdNumber,
        person.religion,
        person.caste,
        person.community,
        person.gender,
        String(person.age)
      ];
      
      return searchableFields.some(field => {
        const fieldStr = field && field !== null && field !== 'N/A' ? String(field).toLowerCase().trim() : '';
        return fieldStr.includes(searchLower);
      });
    });
  }, [people, searchTerm]);

  // Helper functions
  const hasValidationErrors = Object.values(validationErrors).some(error => error !== '');
  const hasEditValidationErrors = Object.values(editValidationErrors).some(error => error !== '');
  const isStillValidating = Object.values(isValidating).some(validating => validating);

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', padding: '20px' }}>
          <div style={{ width: '50px', height: '50px', border: '3px solid #f3f3f3', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 2s linear infinite' }}></div>
          <p style={{ marginTop: '20px', fontSize: '18px', textAlign: 'center' }}>Loading people data...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  const userDirection = getUserDirection();

  return (
    <Layout>
      <div style={{ padding: '16px', maxWidth: '100%', margin: '0 auto' }}>
        
        {/* SIMPLIFIED HEADER */}
        <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', marginBottom: '24px', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: window.innerWidth < 768 ? '24px' : '30px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>
              People Management
            </h1>
            <p style={{ color: '#6b7280', marginTop: '4px', margin: '0' }}>
              {userDirection ? `Managing ${userDirection} direction people` : 'Managing all constituency members'}
            </p>
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              <span style={{ color: '#059669' }}>📊 Google Sheets: {people.length} records</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* ADD PERSON BUTTON */}
            <button 
              onClick={() => setShowModal(true)}
              disabled={submitting}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <Plus size={16} />
              Add Person
            </button>
          </div>
        </div>

        {/* GLOBAL EDIT VALIDATION ERROR ALERT */}
        {hasEditValidationErrors && editingId && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fca5a5', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <AlertCircle style={{ color: '#dc2626', marginRight: '8px' }} size={16} />
            <div style={{ color: '#dc2626', fontSize: '14px' }}>
              <strong>Edit Validation Error:</strong> Fix duplicate values before saving.
              {Object.entries(editValidationErrors).map(([field, error]) => 
                error ? <div key={field}>• {field}: {error}</div> : null
              )}
            </div>
          </div>
        )}

        {/* SEARCH BAR */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ width: '20px', height: '20px', position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
            <input 
              type="text"
              placeholder="Search by name, phone, gender, community, etc..."
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: searchTerm ? '40px' : '12px',
                paddingTop: '12px',
                paddingBottom: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchTerm && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              Found {filteredPeople.length} people matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* PEOPLE TABLE */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Phone</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Aadhar</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>PAN</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Voter ID</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Gender</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Community</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Ward</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Direction</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeople.length > 0 ? filteredPeople.map((person, index) => {
                  const isEditing = editingId === person.id;
                  return (
                    <tr 
                      key={person.id || index} 
                      style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: isEditing ? '#fef3c7' : 'transparent' }}
                      onMouseEnter={e => { if (!isEditing) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={e => { if (!isEditing) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* NAME */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editData.name || ''}
                            onChange={e => handleEditChange('name', e.target.value)}
                            style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                          />
                        ) : (
                          <span style={{ fontWeight: '500' }}>{person.name || 'N/A'}</span>
                        )}
                      </td>

                      {/* PHONE - ENHANCED WITH VALIDATION */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {isEditing ? (
                          <div>
                            <input 
                              type="tel"
                              value={editData.phone || ''}
                              onChange={e => handleEditChange('phone', e.target.value)}
                              style={{ 
                                width: '100%', 
                                padding: '4px 6px', 
                                border: editValidationErrors.phone ? '2px solid #dc2626' : '1px solid #d1d5db', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                backgroundColor: editValidationErrors.phone ? '#fef2f2' : 'white'
                              }}
                            />
                            {editValidationErrors.phone && (
                              <div style={{ color: '#dc2626', fontSize: '10px', marginTop: '2px' }}>
                                {editValidationErrors.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'monospace', backgroundColor: person.phone !== 'N/A' ? '#dcfce7' : '#fecaca', padding: '2px 4px', borderRadius: '4px' }}>
                            {person.phone || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* AADHAR - ENHANCED WITH VALIDATION */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {isEditing ? (
                          <div>
                            <input 
                              type="text"
                              value={editData.aadharNumber || ''}
                              onChange={e => handleEditChange('aadharNumber', e.target.value)}
                              style={{ 
                                width: '100%', 
                                padding: '4px 6px', 
                                border: editValidationErrors.aadharNumber ? '2px solid #dc2626' : '1px solid #d1d5db', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                backgroundColor: editValidationErrors.aadharNumber ? '#fef2f2' : 'white'
                              }}
                            />
                            {editValidationErrors.aadharNumber && (
                              <div style={{ color: '#dc2626', fontSize: '10px', marginTop: '2px' }}>
                                {editValidationErrors.aadharNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ 
                            fontFamily: 'monospace', 
                            backgroundColor: person.aadharNumber && person.aadharNumber !== 'N/A' ? '#dbeafe' : '#fecaca', 
                            padding: '2px 4px', 
                            borderRadius: '4px' 
                          }}>
                            {person.aadharNumber || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* PAN - ENHANCED WITH VALIDATION */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {isEditing ? (
                          <div>
                            <input 
                              type="text"
                              value={editData.panNumber || ''}
                              onChange={e => handleEditChange('panNumber', e.target.value.toUpperCase())}
                              style={{ 
                                width: '100%', 
                                padding: '4px 6px', 
                                border: editValidationErrors.panNumber ? '2px solid #dc2626' : '1px solid #d1d5db', 
                                borderRadius: '4px', 
                                fontSize: '12px', 
                                textTransform: 'uppercase',
                                backgroundColor: editValidationErrors.panNumber ? '#fef2f2' : 'white'
                              }}
                            />
                            {editValidationErrors.panNumber && (
                              <div style={{ color: '#dc2626', fontSize: '10px', marginTop: '2px' }}>
                                {editValidationErrors.panNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ 
                            fontFamily: 'monospace', 
                            backgroundColor: person.panNumber && person.panNumber !== 'N/A' ? '#fef3c7' : '#fecaca', 
                            padding: '2px 4px', 
                            borderRadius: '4px' 
                          }}>
                            {person.panNumber || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* VOTER ID - ENHANCED WITH VALIDATION */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {isEditing ? (
                          <div>
                            <input 
                              type="text"
                              value={editData.voterIdNumber || ''}
                              onChange={e => handleEditChange('voterIdNumber', e.target.value.toUpperCase())}
                              style={{ 
                                width: '100%', 
                                padding: '4px 6px', 
                                border: editValidationErrors.voterIdNumber ? '2px solid #dc2626' : '1px solid #d1d5db', 
                                borderRadius: '4px', 
                                fontSize: '12px', 
                                textTransform: 'uppercase',
                                backgroundColor: editValidationErrors.voterIdNumber ? '#fef2f2' : 'white'
                              }}
                            />
                            {editValidationErrors.voterIdNumber && (
                              <div style={{ color: '#dc2626', fontSize: '10px', marginTop: '2px' }}>
                                {editValidationErrors.voterIdNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ 
                            fontFamily: 'monospace', 
                            backgroundColor: person.voterIdNumber && person.voterIdNumber !== 'N/A' ? '#fce7f3' : '#fecaca', 
                            padding: '2px 4px', 
                            borderRadius: '4px' 
                          }}>
                            {person.voterIdNumber || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* GENDER */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {isEditing ? (
                          <select 
                            value={editData.gender || ''}
                            onChange={e => handleEditChange('gender', e.target.value)}
                            style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <span style={{ 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: '500',
                            backgroundColor: person.gender === 'Male' ? '#dbeafe' : person.gender === 'Female' ? '#fce7f3' : '#f3f4f6',
                            color: person.gender === 'Male' ? '#1e40af' : person.gender === 'Female' ? '#be185d' : '#374151'
                          }}>
                            {person.gender || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* COMMUNITY */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {isEditing ? (
                          <select 
                            value={editData.community || ''}
                            onChange={e => handleEditChange('community', e.target.value)}
                            style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                          >
                            <option value="">Select</option>
                            <option value="General">General</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <span style={{ 
                            padding: '2px 4px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: '500',
                            backgroundColor: person.community === 'General' ? '#dcfce7' : person.community === 'OBC' ? '#fef3c7' : person.community === 'SC' ? '#fed7aa' : person.community === 'ST' ? '#fecaca' : '#f3f4f6',
                            color: person.community === 'General' ? '#166534' : person.community === 'OBC' ? '#92400e' : person.community === 'SC' ? '#c2410c' : person.community === 'ST' ? '#dc2626' : '#374151'
                          }}>
                            {person.community || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* WARD */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editData.ward || ''}
                            onChange={e => handleEditChange('ward', e.target.value)}
                            style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                          />
                        ) : (
                          <span style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '4px' }}>
                            {person.ward || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* DIRECTION */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        <span style={{ 
                          padding: '2px 4px', 
                          borderRadius: '4px', 
                          fontSize: '11px', 
                          fontWeight: '500',
                          backgroundColor: person.direction === 'East' ? '#dbeafe' : person.direction === 'West' ? '#dcfce7' : person.direction === 'North' ? '#fef3c7' : '#fecaca',
                          color: person.direction === 'East' ? '#1e40af' : person.direction === 'West' ? '#166534' : person.direction === 'North' ? '#92400e' : '#dc2626'
                        }}>
                          {person.direction}
                        </span>
                      </td>

                      {/* ACTIONS - FIXED: Check hasEditValidationErrors for save button */}
                      <td style={{ padding: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => updatePerson(person.id!)}
                                disabled={submitting || hasEditValidationErrors}
                                style={{ 
                                  color: hasEditValidationErrors ? '#9ca3af' : '#059669', 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: submitting || hasEditValidationErrors ? 'not-allowed' : 'pointer', 
                                  padding: '4px', 
                                  opacity: submitting || hasEditValidationErrors ? 0.5 : 1 
                                }}
                                title={hasEditValidationErrors ? 'Fix validation errors first' : 'Save changes'}
                              >
                                <Save size={12} />
                              </button>
                              <button 
                                onClick={cancelEdit}
                                style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                title="Cancel edit"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => startEdit(person)}
                                disabled={submitting}
                                style={{ color: '#2563eb', background: 'none', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', padding: '4px' }}
                                title="Edit person"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={() => deletePerson(person.id!, person.name)}
                                disabled={submitting}
                                style={{ color: '#dc2626', background: 'none', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', padding: '4px' }}
                                title="Delete person"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '14px' }}>
                      {people.length === 0 
                        ? `No ${userDirection ? userDirection + ' ' : ''}people found. Click "Add Person" to get started.`
                        : `No people found matching "${searchTerm}".`
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD PERSON MODAL */}
        {showModal && (
          <div style={{ position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '50', padding: '16px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ position: 'sticky', top: '0', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '24px', borderRadius: '8px 8px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>
                      Add New Person {userDirection && `(${userDirection})`}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0', marginTop: '4px' }}>
                      Saves to Google Sheets
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowModal(false); 
                      setValidationErrors({
                        phone: '',
                        aadharNumber: '',
                        panNumber: '',
                        voterIdNumber: ''
                      });
                    }}
                    style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  
                  {/* NAME */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Name *
                    </label>
                    <input 
                      {...register('name', { required: 'Name is required' })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                      placeholder="Full name"
                    />
                    {errors.name && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.name.message}</p>}
                  </div>

                  {/* PHONE - ENHANCED WITH VALIDATION */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Phone Number - Must be unique *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        {...register('phone', { required: 'Phone is required', pattern: { value: /^[0-9]{10}$/, message: 'Phone must be 10 digits' } })}
                        type="tel"
                        maxLength={10}
                        style={{ 
                          width: '100%', 
                          padding: '8px 12px', 
                          border: validationErrors.phone ? '2px solid #dc2626' : '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '14px', 
                          boxSizing: 'border-box',
                          backgroundColor: validationErrors.phone ? '#fef2f2' : 'white'
                        }}
                        placeholder="10-digit phone number"
                      />
                      {isValidating.phone && (
                        <div style={{ position: 'absolute', right: '8px', top: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            border: '2px solid #3498db', 
                            borderTop: '2px solid transparent', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite' 
                          }}></div>
                        </div>
                      )}
                    </div>
                    {validationErrors.phone && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginTop: '4px', 
                        color: '#dc2626', 
                        fontSize: '12px' 
                      }}>
                        <AlertCircle size={12} style={{ marginRight: '4px' }} />
                        {validationErrors.phone}
                      </div>
                    )}
                    {errors.phone && (
                      <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* AADHAR - ENHANCED WITH VALIDATION */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Aadhar Number (12 digits, must be unique) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        {...register('aadharNumber', { 
                          required: 'Aadhar number is required',
                          pattern: { value: /^[0-9]{12}$/, message: 'Aadhar must be exactly 12 digits' }
                        })}
                        type="text"
                        maxLength={12}
                        style={{ 
                          width: '100%', 
                          padding: '8px 12px', 
                          border: validationErrors.aadharNumber ? '2px solid #dc2626' : '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '14px', 
                          boxSizing: 'border-box',
                          backgroundColor: validationErrors.aadharNumber ? '#fef2f2' : 'white'
                        }}
                        placeholder="123456789012 (12 digits)"
                      />
                      {isValidating.aadharNumber && (
                        <div style={{ position: 'absolute', right: '8px', top: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            border: '2px solid #3498db', 
                            borderTop: '2px solid transparent', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite' 
                          }}></div>
                        </div>
                      )}
                    </div>
                    {validationErrors.aadharNumber && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginTop: '4px', 
                        color: '#dc2626', 
                        fontSize: '12px' 
                      }}>
                        <AlertCircle size={12} style={{ marginRight: '4px' }} />
                        {validationErrors.aadharNumber}
                      </div>
                    )}
                    {errors.aadharNumber && (
                      <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>
                        {errors.aadharNumber.message}
                      </p>
                    )}
                  </div>

                  {/* PAN - ENHANCED WITH VALIDATION */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      PAN Number - Must be unique *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        {...register('panNumber', { 
                          required: 'PAN number is required',
                          pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format (ABCDE1234F)' }
                        })}
                        style={{ 
                          width: '100%', 
                          padding: '8px 12px', 
                          border: validationErrors.panNumber ? '2px solid #dc2626' : '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '14px', 
                          textTransform: 'uppercase', 
                          boxSizing: 'border-box',
                          backgroundColor: validationErrors.panNumber ? '#fef2f2' : 'white'
                        }}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                      />
                      {isValidating.panNumber && (
                        <div style={{ position: 'absolute', right: '8px', top: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            border: '2px solid #3498db', 
                            borderTop: '2px solid transparent', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite' 
                          }}></div>
                        </div>
                      )}
                    </div>
                    {validationErrors.panNumber && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginTop: '4px', 
                        color: '#dc2626', 
                        fontSize: '12px' 
                      }}>
                        <AlertCircle size={12} style={{ marginRight: '4px' }} />
                        {validationErrors.panNumber}
                      </div>
                    )}
                    {errors.panNumber && (
                      <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>
                        {errors.panNumber.message}
                      </p>
                    )}
                  </div>

                  {/* VOTER ID - ENHANCED WITH VALIDATION */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Voter ID Number - Must be unique *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        {...register('voterIdNumber', { 
                          required: 'Voter ID number is required',
                          pattern: { value: /^[A-Z]{3}[0-9]{7}$/, message: 'Invalid Voter ID format (ABC1234567)' }
                        })}
                        style={{ 
                          width: '100%', 
                          padding: '8px 12px', 
                          border: validationErrors.voterIdNumber ? '2px solid #dc2626' : '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '14px', 
                          textTransform: 'uppercase', 
                          boxSizing: 'border-box',
                          backgroundColor: validationErrors.voterIdNumber ? '#fef2f2' : 'white'
                        }}
                        placeholder="ABC1234567"
                        maxLength={10}
                      />
                      {isValidating.voterIdNumber && (
                        <div style={{ position: 'absolute', right: '8px', top: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            border: '2px solid #3498db', 
                            borderTop: '2px solid transparent', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite' 
                          }}></div>
                        </div>
                      )}
                    </div>
                    {validationErrors.voterIdNumber && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginTop: '4px', 
                        color: '#dc2626', 
                        fontSize: '12px' 
                      }}>
                        <AlertCircle size={12} style={{ marginRight: '4px' }} />
                        {validationErrors.voterIdNumber}
                      </div>
                    )}
                    {errors.voterIdNumber && (
                      <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>
                        {errors.voterIdNumber.message}
                      </p>
                    )}
                  </div>

                  {/* GENDER */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Gender *
                    </label>
                    <select 
                      {...register('gender', { required: 'Gender is required' })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.gender.message}</p>}
                  </div>

                  {/* COMMUNITY */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Community *
                    </label>
                    <select 
                      {...register('community', { required: 'Community is required' })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      <option value="">Select Community</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.community && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.community.message}</p>}
                  </div>

                  {/* WARD */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Ward *
                    </label>
                    <input 
                      {...register('ward', { required: 'Ward is required' })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                      placeholder="Ward number or name"
                    />
                    {errors.ward && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.ward.message}</p>}
                  </div>

                  {/* AGE */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Age *
                    </label>
                    <input 
                      {...register('age', { required: 'Age is required', min: { value: 18, message: 'Minimum age is 18' }, max: { value: 120, message: 'Maximum age is 120' } })}
                      type="number"
                      min={18}
                      max={120}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                      placeholder="Age (18-120)"
                    />
                    {errors.age && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.age.message}</p>}
                  </div>

                  {/* CASTE */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Caste *
                    </label>
                    <input 
                      {...register('caste', { required: 'Caste is required' })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                      placeholder="Caste"
                    />
                    {errors.caste && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.caste.message}</p>}
                  </div>

                  {/* RELIGION */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Religion *
                    </label>
                    <select 
                      {...register('religion', { required: 'Religion is required' })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      <option value="">Select Religion</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Islam">Islam</option>
                      <option value="Christian">Christian</option>
                      <option value="Sikh">Sikh</option>
                      <option value="Buddhist">Buddhist</option>
                      <option value="Jain">Jain</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.religion && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.religion.message}</p>}
                  </div>

                  {/* STREET */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Street *
                    </label>
                    <input 
                      {...register('street', { required: 'Street is required' })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                      placeholder="Street name"
                    />
                    {errors.street && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.street.message}</p>}
                  </div>

                  {/* DIRECTION */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Direction *
                    </label>
                    {user?.role === 'superadmin' ? (
                      <select 
                        {...register('direction', { required: 'Direction is required' })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                      >
                        <option value="">Select Direction</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="East">East</option>
                        <option value="West">West</option>
                      </select>
                    ) : (
                      <input 
                        {...register('direction')}
                        type="text"
                        defaultValue={user?.direction || ''}
                        readOnly
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#f9fafb', color: '#6b7280' }}
                        placeholder={`Auto-assigned: ${user?.direction}`}
                      />
                    )}
                    {errors.direction && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.direction.message}</p>}
                  </div>

                  {/* ADDRESS - FULL WIDTH */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Address *
                    </label>
                    <textarea 
                      {...register('address', { required: 'Address is required' })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }}
                      placeholder="Full address"
                    />
                    {errors.address && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '0' }}>{errors.address.message}</p>}
                  </div>
                </div>

                {/* Validation Status Panel */}
                {(hasValidationErrors || isStillValidating) && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    backgroundColor: hasValidationErrors ? '#fef2f2' : '#f0f9ff', 
                    border: `1px solid ${hasValidationErrors ? '#fca5a5' : '#93c5fd'}`, 
                    borderRadius: '6px' 
                  }}>
                    {isStillValidating ? (
                      <div style={{ display: 'flex', alignItems: 'center', color: '#1d4ed8' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          border: '2px solid #3498db', 
                          borderTop: '2px solid transparent', 
                          borderRadius: '50%', 
                          animation: 'spin 1s linear infinite', 
                          marginRight: '8px' 
                        }}></div>
                        Checking for duplicate values...
                      </div>
                    ) : hasValidationErrors ? (
                      <div style={{ display: 'flex', alignItems: 'center', color: '#dc2626' }}>
                        <AlertCircle size={16} style={{ marginRight: '8px' }} />
                        Please fix the unique validation errors above before submitting.
                      </div>
                    ) : null}
                  </div>
                )}

                {/* FORM ACTIONS */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowModal(false); 
                      setValidationErrors({
                        phone: '',
                        aadharNumber: '',
                        panNumber: '',
                        voterIdNumber: ''
                      });
                    }}
                    style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontSize: '14px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting || hasValidationErrors}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: submitting || hasValidationErrors ? '#9ca3af' : '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: submitting || hasValidationErrors ? 'not-allowed' : 'pointer',
                      opacity: submitting || hasValidationErrors ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                  >
                    {submitting ? (
                      <>
                        <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Saving...
                      </>
                    ) : (
                      'Save to Google Sheets'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );
};

export default People;
