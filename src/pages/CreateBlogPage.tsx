import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { PlusCircle, X, Image, Save } from 'lucide-react';

const CreateBlogPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    category: '',
    coverImage: '',
    slug: ''
  });
  
  const [tagInput, setTagInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const validateForm = () => {
    let valid = true;
    const errors: Record<string, string> = {};
    
    if (!formData.title) {
      errors.title = 'Title is required';
      valid = false;
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
      valid = false;
    }
    
    if (!formData.content) {
      errors.content = 'Content is required';
      valid = false;
    } else if (formData.content.length < 50) {
      errors.content = 'Content must be at least 50 characters';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleAddTag = () => {
    if (!tagInput.trim() || formData.tags.includes(tagInput.toLowerCase().trim())) {
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tagInput.toLowerCase().trim()]
    }));
    
    setTagInput('');
  };
  
  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag)
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/blogs', formData);
      
      addToast('Blog post created successfully!', 'success');
      navigate(`/blog/${response.data.blog.slug}`);
    } catch (error: any) {
      console.error('Error creating blog:', error);
      addToast(error.response?.data?.message || 'Failed to create blog post', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Blog Post</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 flex gap-4">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={`px-4 py-2 rounded-md ${
              !previewMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            } transition-colors`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={`px-4 py-2 rounded-md ${
              previewMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            } transition-colors`}
            disabled={!formData.content}
          >
            Preview
          </button>
        </div>
        
        {!previewMode ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter your blog title"
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="slug" className="block text-gray-700 font-medium mb-2">
                Slug <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="your-post-url (leave empty to generate from title)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                The URL-friendly version of the title. Leave empty to generate automatically.
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="coverImage" className="block text-gray-700 font-medium mb-2">
                Cover Image URL <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="coverImage"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-shrink-0">
                  {formData.coverImage ? (
                    <img
                      src={formData.coverImage}
                      alt="Cover preview"
                      className="w-12 h-12 object-cover rounded-md border border-gray-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+URL';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-300 flex items-center justify-center text-gray-400">
                      <Image size={20} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                <option value="technology">Technology</option>
                <option value="science">Science</option>
                <option value="health">Health</option>
                <option value="business">Business</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="sports">Sports</option>
                <option value="travel">Travel</option>
                <option value="food">Food</option>
                <option value="education">Education</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle size={18} />
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Press Enter to add a tag after typing
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your blog post in Markdown..."
                rows={15}
                className={`w-full px-3 py-2 border rounded-md font-mono ${
                  formErrors.content ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {formErrors.content && (
                <p className="mt-1 text-sm text-red-500">{formErrors.content}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Content supports Markdown formatting
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-blue-600 text-white rounded-md font-medium flex items-center ${
                  loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <Save size={18} className="mr-2" />
                {loading ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </form>
        ) : (
          <div className="border border-gray-300 rounded-md p-6">
            <h2 className="text-2xl font-bold mb-4">{formData.title || 'Untitled Blog Post'}</h2>
            
            {formData.coverImage && (
              <img
                src={formData.coverImage}
                alt={formData.title}
                className="w-full h-60 object-cover rounded-md mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                }}
              />
            )}
            
            <div className="prose max-w-none">
              {formData.content ? (
                <div dangerouslySetInnerHTML={{ __html: formData.content }}></div>
              ) : (
                <p className="text-gray-500">No content to preview</p>
              )}
            </div>
            
            {formData.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBlogPage;