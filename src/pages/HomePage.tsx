import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Search } from 'lucide-react';

interface Blog {
  _id: string;
  title: string;
  content: string;
  slug: string;
  author: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  coverImage?: string;
  tags: string[];
  category: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
}

const HomePage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, searchQuery, selectedTag]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '10');
      params.append('sortBy', 'createdAt');
      params.append('sortOrder', '-1');
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedTag) params.append('tag', selectedTag);
      
      const response = await api.get(`/blogs?${params.toString()}`);
      
      setBlogs(response.data.blogs);
      setTotalPages(response.data.totalPages);
      
      // Extract unique tags from blogs
      if (response.data.blogs.length > 0 && allTags.length === 0) {
        const tags = response.data.blogs.flatMap(blog => blog.tags);
        setAllTags([...new Set(tags)]);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-8 mb-10 shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Welcome to BlogFlow</h1>
        <p className="text-xl mb-6">Discover stories, ideas, and expertise from writers on any topic.</p>
        
        <form onSubmit={handleSearch} className="flex w-full max-w-md">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-300" />
            </div>
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 rounded-l-lg border-0 bg-white/20 text-white placeholder-gray-200 focus:ring-2 focus:ring-white/50 focus:outline-none"
            />
          </div>
          <button 
            type="submit" 
            className="bg-white text-blue-600 px-6 py-2 rounded-r-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Filter by tags:</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  tag === selectedTag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Blog list */}
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : blogs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog._id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
              {blog.coverImage && (
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5">
                <Link to={`/blog/${blog.slug}`}>
                  <h2 className="text-xl font-bold mb-2 text-gray-800 hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h2>
                </Link>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {blog.content.replace(/<[^>]*>/g, '')}
                </p>
                
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={blog.author.profilePicture}
                    alt={blog.author.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-700">
                    {blog.author.firstName && blog.author.lastName
                      ? `${blog.author.firstName} ${blog.author.lastName}`
                      : blog.author.username}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {blog.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag} 
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      onClick={(e) => {
                        e.preventDefault();
                        handleTagClick(tag);
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-3">
                    <span>{blog.viewCount} views</span>
                    <span>{blog.likeCount} likes</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <h2 className="text-2xl font-medium text-gray-700 mb-2">No blogs found</h2>
          <p className="text-gray-500">Try a different search query or tag filter.</p>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default HomePage;