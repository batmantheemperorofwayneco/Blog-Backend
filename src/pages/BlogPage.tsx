import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import CommentSection from '../components/blog/CommentSection';
import { Heart, Calendar, Eye, User, Edit, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

interface BlogType {
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
    bio: string;
  };
  coverImage?: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likes: string[];
  likeCount: number;
}

const BlogPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);

  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  useEffect(() => {
    if (blog && user) {
      setLiked(blog.likes.includes(user.id));
      setLikeCount(blog.likeCount);
    }
  }, [blog, user]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/blogs/${slug}`);
      setBlog(response.data.blog);
    } catch (error) {
      console.error('Error fetching blog:', error);
      addToast('Failed to load blog post', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      addToast('You must be logged in to like a blog post', 'warning');
      return;
    }

    try {
      const response = await api.post(`/blogs/${blog?._id}/like`);
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
      addToast(response.data.message, 'success');
    } catch (error) {
      console.error('Error liking blog:', error);
      addToast('Failed to like blog post', 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      await api.delete(`/blogs/${blog?._id}`);
      addToast('Blog post deleted successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error('Error deleting blog:', error);
      addToast('Failed to delete blog post', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Blog post not found</h2>
        <p className="text-gray-600 mb-6">
          The blog post you are looking for may have been removed or doesn't exist.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const canModify = isAuthenticated && (user?.id === blog.author._id || user?.role === 'admin');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Cover image */}
      {blog.coverImage && (
        <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-[400px] object-cover"
          />
        </div>
      )}

      {/* Blog title & metadata */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>

        <div className="flex flex-wrap items-center text-gray-600 gap-4 mb-6">
          <div className="flex items-center">
            <Calendar size={18} className="mr-1" />
            <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Eye size={18} className="mr-1" />
            <span>{blog.viewCount} views</span>
          </div>
          <div className="flex items-center">
            <Heart 
              size={18} 
              className={`mr-1 ${liked ? 'fill-red-500 text-red-500' : ''}`} 
            />
            <span>{likeCount} likes</span>
          </div>
        </div>

        {/* Author info */}
        <div className="flex items-center border-y border-gray-200 py-4">
          <img
            src={blog.author.profilePicture}
            alt={blog.author.username}
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <div className="font-medium text-gray-900">
              {blog.author.firstName && blog.author.lastName
                ? `${blog.author.firstName} ${blog.author.lastName}`
                : blog.author.username}
            </div>
            {blog.author.bio && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{blog.author.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Blog content */}
      <div className="prose prose-lg max-w-none mb-8">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {blog.content}
        </ReactMarkdown>
      </div>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <Link 
                to={`/?tag=${tag}`}
                key={tag} 
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4 mb-10">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            liked 
              ? 'bg-red-100 text-red-600 border border-red-300' 
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          <Heart size={18} className={liked ? 'fill-red-500' : ''} />
          {liked ? 'Liked' : 'Like'}
        </button>
        
        {canModify && (
          <>
            <Link
              to={`/edit-blog/${blog._id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit size={18} />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </>
        )}
      </div>

      {/* Comments section */}
      <CommentSection blogId={blog._id} />
    </div>
  );
};

export default BlogPage;