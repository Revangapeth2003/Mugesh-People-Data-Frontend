// src/pages/Templates.tsx - COMPLETE UPDATED VERSION WITH IMPROVED TYPE SAFETY
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { sheetsService } from '../services/googleSheets';
import Layout from '../components/Layout/Layout';
import { useForm } from 'react-hook-form';
import { Plus, FileText, Edit, Trash2, X } from 'lucide-react';
import type { Template } from '../types';
import { convertToTemplates, ensureArray, handleApiError } from '../utils/typeHelpers';

interface TemplateForm {
  title: string;
  body: string;
}

const Templates: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false); // ✅ Added submit loading state
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TemplateForm>();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await sheetsService.getTemplates();
      
      // ✅ Improved: Handle both object and array responses safely
      const rawData = response?.data || response || [];
      const dataArray = ensureArray(rawData);
      
      setTemplates(convertToTemplates(dataArray));
    } catch (error) {
      console.error('Error fetching templates:', error);
      const errorMessage = handleApiError(error);
      alert(`Failed to fetch templates: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TemplateForm) => {
    try {
      setSubmitLoading(true);
      const templateData = {
        ...data,
        createdBy: user?.email || 'unknown@example.com'
      };
      
      await sheetsService.createTemplate(templateData);
      setShowModal(false);
      reset();
      await fetchTemplates(); // Refresh the list
      
      // ✅ Success feedback
      alert('Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      const errorMessage = handleApiError(error);
      alert(`Failed to create template: ${errorMessage}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ✅ IMPROVED: Delete template function with better error handling
  const handleDeleteTemplate = async (template: Template, templateTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the template "${templateTitle}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      // Use template.id if available, otherwise use title as fallback identifier
      const templateId = template.id || template.title;
      setDeleteLoading(templateId);
      
      console.log('🗑️ Attempting to delete template:', templateId);
      
      // Call the delete service with template ID
      await sheetsService.deleteTemplate(templateId);
      
      // Refresh the templates list
      await fetchTemplates();
      
      console.log('✅ Template deleted successfully');
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      const errorMessage = handleApiError(error);
      alert(`Failed to delete template: ${errorMessage}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // ✅ IMPROVED: Edit template function (placeholder for future implementation)
  const handleEditTemplate = (template: Template) => {
    console.log('Edit template:', template);
    // TODO: Implement edit functionality
    alert('Edit functionality coming soon!');
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Message Templates</h1>
            <p className="text-gray-600 mt-1">Create and manage reusable message templates</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Template</span>
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No templates created yet.</p>
              <p className="text-gray-400 text-sm">Create your first template to get started.</p>
            </div>
          ) : (
            templates.map((template, index) => {
              // ✅ Create unique identifier for each template
              const templateId = template.id || template.title || `template-${index}`;
              
              return (
                <div key={templateId} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">
                      {template.title}
                    </h3>
                    <div className="flex space-x-2 flex-shrink-0">
                      {/* ✅ Edit button */}
                      <button 
                        onClick={() => handleEditTemplate(template)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit template"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {/* ✅ Delete button */}
                      <button 
                        onClick={() => handleDeleteTemplate(template, template.title)}
                        disabled={deleteLoading === templateId}
                        className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                        title="Delete template"
                      >
                        {deleteLoading === templateId ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{template.body}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span className="truncate">By: {template.createdBy}</span>
                    <span className="flex-shrink-0 ml-2">
                      {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Template Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Template</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={submitLoading}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Title
                  </label>
                  <input
                    {...register('title', { required: 'Title is required' })}
                    type="text"
                    className="input-field"
                    placeholder="Enter template title"
                    disabled={submitLoading}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content
                  </label>
                  <textarea
                    {...register('body', { required: 'Message content is required' })}
                    rows={5}
                    className="input-field"
                    placeholder="Enter your message template here..."
                    disabled={submitLoading}
                  />
                  {errors.body && (
                    <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Use placeholders like {'{{name}}'} for personalization
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 flex items-center justify-center"
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Template'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                    disabled={submitLoading}
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

export default Templates;
