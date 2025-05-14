import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { Edit2, Trash2, Eye, Heart, MessageSquare } from 'lucide-react';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  createdAt: string;
  status: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: '',
    profilePicture: user?.profilePicture || ''
  });
  
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchUserBlogs();
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || ''
      });
    }
  }, [user]);
  
  const fetchUserBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/blogs/user/${user?.id}`);
      setBlogs(response.data.blogs);
    } catch (error) {
      console.error('Error fetching user blogs:', error);
      addToast('Failed to load your blogs', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile(profileData);
      setEditMode(false);
      addToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast('Failed to update profile', 'error');
    }
  };
  
  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }
    
    try {
      await api.delete(`/blogs/${id}`);
      setBlogs(prev => prev.filter(blog => blog._id !== id));
      addToast('Blog post deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting blog:', error);
      addToast('Failed to delete blog post', 'error');
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {editMode ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4 flex flex-col items-center">
                  <img
                    src={profileData.profilePicture || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                    alt={user?.username}
                    className="w-24 h-24 rounded-full object-cover mb-2"
                  />
                  <input
                    type="text"
                    name="profilePicture"
                    value={profileData.profilePicture}
                    onChange={handleChange}
                    placeholder="Profile picture URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="firstName" className="block text-gray-700 text-sm font-medium mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="lastName" className="block text-gray-700 text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="bio" className="block text-gray-700 text-sm font-medium mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="text-center mb-6">
                  <img
                    src={user?.profilePicture || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                    alt={user?.username}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                  />
                  <h2 className="text-xl font-bold">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.username}
                  </h2>
                  <p className="text-gray-500">@{user?.username}</p>
                  <p className="text-gray-500 mt-1">{user?.email}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Bio</h3>
                  <p className="text-gray-700">
                    {profileData.bio || 'No bio yet'}
                  </p>
                </div>
                
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Content area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Blog Posts</h2>
              <Link
                to="/create-blog"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create New Post
              </Link>
            </div>
            
            {loading ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : blogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left text-gray-700">Title</th>
                      <th className="px-4 py-2 text-left text-gray-700 hidden sm:table-cell">Status</th>
                      <th className="px-4 py-2 text-left text-gray-700 hidden md:table-cell">Date</th>
                      <th className="px-4 py-2 text-left text-gray-700 hidden lg:table-cell">Stats</th>
                      <th className="px-4 py-2 text-center text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {blogs.map((blog) => (
                      <tr key={blog._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link 
                            to={`/blog/${blog.slug}`} 
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {blog.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            blog.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {blog.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm hidden md:table-cell">
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm hidden lg:table-cell">
                          <div className="flex space-x-2">
                            <span className="flex items-center" title="Views">
                              <Eye size={14} className="mr-1" />
                              {blog.viewCount}
                            </span>
                            <span className="flex items-center" title="Likes">
                              <Heart size={14} className="mr-1" />
                              {blog.likeCount}
                            </span>
                            <span className="flex items-center" title="Comments">
                              <MessageSquare size={14} className="mr-1" />
                              {blog.commentCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center space-x-2">
                            <Link 
                              to={`/edit-blog/${blog._id}`}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </Link>
                            <button
                              onClick={() => handleDeleteBlog(blog._id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">You haven't created any blog posts yet.</p>
                <Link
                  to="/create-blog"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Your First Post
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;