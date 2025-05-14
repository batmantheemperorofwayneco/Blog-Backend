import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import { io, Socket } from 'socket.io-client';
import { ThumbsUp, ThumbsDown, Reply, Edit, Trash2, Send } from 'lucide-react';

interface Author {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture: string;
}

interface CommentType {
  _id: string;
  content: string;
  author: Author;
  blog: string;
  parentComment: string | null;
  upvotes: string[];
  downvotes: string[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  voteScore: number;
  replies?: CommentType[];
}

interface CommentSectionProps {
  blogId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ blogId }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('accessToken');
    const socketInstance = io('http://localhost:5000/comments', {
      auth: {
        token
      }
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      socketInstance.emit('join-blog', blogId);
    });

    socketInstance.on('comment-created', ({ comment, parentId }) => {
      if (!parentId) {
        // Add new top-level comment
        setComments(prev => [comment, ...prev]);
      } else {
        // Add reply to parent comment
        setComments(prev => 
          prev.map(c => {
            if (c._id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), comment]
              };
            }
            return c;
          })
        );
      }
    });

    socketInstance.on('comment-updated', ({ comment }) => {
      setComments(prev => 
        prev.map(c => {
          if (c._id === comment._id) {
            return { ...c, ...comment };
          }
          
          // Check in replies
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => 
                r._id === comment._id ? { ...r, ...comment } : r
              )
            };
          }
          
          return c;
        })
      );
    });

    socketInstance.on('comment-deleted', ({ commentId }) => {
      setComments(prev => {
        // Check if it's a top-level comment
        const isTopLevel = prev.some(c => c._id === commentId);
        
        if (isTopLevel) {
          return prev.filter(c => c._id !== commentId);
        } else {
          // It's a reply, find its parent
          return prev.map(c => {
            if (c.replies && c.replies.some(r => r._id === commentId)) {
              return {
                ...c,
                replies: c.replies.filter(r => r._id !== commentId)
              };
            }
            return c;
          });
        }
      });
    });

    socketInstance.on('comment-voted', ({ commentId, voteScore }) => {
      setComments(prev => 
        prev.map(c => {
          if (c._id === commentId) {
            return { ...c, voteScore };
          }
          
          // Check in replies
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => 
                r._id === commentId ? { ...r, voteScore } : r
              )
            };
          }
          
          return c;
        })
      );
    });

    socketInstance.on('comment-error', ({ message }) => {
      addToast(message, 'error');
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.emit('leave-blog', blogId);
        socketInstance.disconnect();
      }
    };
  }, [blogId, isAuthenticated]);

  // Fetch initial comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/comments/blog/${blogId}`);
        setComments(response.data.comments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        addToast('Failed to load comments', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [blogId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      addToast('You must be logged in to comment', 'warning');
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      if (socket) {
        socket.emit('new-comment', {
          content: newComment,
          blogId,
          parentCommentId: null
        });
        
        setNewComment('');
      } else {
        // Fallback to REST API if socket not connected
        await api.post('/comments', {
          content: newComment,
          blogId,
          parentCommentId: null
        });
        
        // Refetch comments
        const response = await api.get(`/comments/blog/${blogId}`);
        setComments(response.data.comments);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      addToast('Failed to post comment', 'error');
    }
  };

  const handleReply = (commentId: string) => {
    if (!isAuthenticated) {
      addToast('You must be logged in to reply', 'warning');
      return;
    }
    
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyContent('');
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    
    try {
      if (socket) {
        socket.emit('new-comment', {
          content: replyContent,
          blogId,
          parentCommentId: commentId
        });
        
        setReplyContent('');
        setReplyingTo(null);
      } else {
        // Fallback to REST API if socket not connected
        await api.post('/comments', {
          content: replyContent,
          blogId,
          parentCommentId: commentId
        });
        
        // Refetch comments
        const response = await api.get(`/comments/blog/${blogId}`);
        setComments(response.data.comments);
        setReplyContent('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      addToast('Failed to post reply', 'error');
    }
  };

  const handleEdit = (comment: CommentType) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  const handleSubmitEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    try {
      if (socket) {
        socket.emit('update-comment', {
          commentId,
          content: editContent
        });
        
        setEditingId(null);
      } else {
        // Fallback to REST API if socket not connected
        await api.put(`/comments/${commentId}`, {
          content: editContent
        });
        
        // Refetch comments
        const response = await api.get(`/comments/blog/${blogId}`);
        setComments(response.data.comments);
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      addToast('Failed to update comment', 'error');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      if (socket) {
        socket.emit('delete-comment', {
          commentId
        });
      } else {
        // Fallback to REST API if socket not connected
        await api.delete(`/comments/${commentId}`);
        
        // Refetch comments
        const response = await api.get(`/comments/blog/${blogId}`);
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      addToast('Failed to delete comment', 'error');
    }
  };

  const handleVote = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      addToast('You must be logged in to vote', 'warning');
      return;
    }
    
    try {
      if (socket) {
        socket.emit('vote-comment', {
          commentId,
          voteType
        });
      } else {
        // Fallback to REST API if socket not connected
        await api.post(`/comments/${commentId}/vote`, { voteType });
        
        // Refetch comments
        const response = await api.get(`/comments/blog/${blogId}`);
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
      addToast('Failed to vote on comment', 'error');
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: CommentType, isReply?: boolean }) => {
    const isEditing = editingId === comment._id;
    const isReplying = replyingTo === comment._id;
    const canModify = user && (user.id === comment.author._id || user.role === 'admin');
    
    return (
      <div className={`${isReply ? 'ml-12 mt-3' : 'mb-6 border-b border-gray-200 pb-6'}`}>
        <div className="flex items-start gap-4">
          <img
            src={comment.author.profilePicture}
            alt={comment.author.username}
            className="w-10 h-10 rounded-full"
          />
          
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="font-medium text-gray-800">
                {comment.author.firstName && comment.author.lastName
                  ? `${comment.author.firstName} ${comment.author.lastName}`
                  : comment.author.username}
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
              {comment.isEdited && (
                <span className="ml-2 text-xs text-gray-500 italic">(edited)</span>
              )}
            </div>
            
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex mt-2 gap-2">
                  <button
                    onClick={() => handleSubmitEdit(comment._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 mt-1">{comment.content}</p>
            )}
            
            <div className="flex items-center mt-3 gap-4">
              <div className="flex items-center">
                <button
                  onClick={() => handleVote(comment._id, 'upvote')}
                  className={`text-sm flex items-center gap-1 hover:text-blue-600 ${
                    user && comment.upvotes.includes(user.id) ? 'text-blue-600' : 'text-gray-500'
                  }`}
                  disabled={!isAuthenticated}
                >
                  <ThumbsUp size={16} />
                </button>
                <span className="mx-1 text-gray-700">{comment.voteScore}</span>
                <button
                  onClick={() => handleVote(comment._id, 'downvote')}
                  className={`text-sm flex items-center gap-1 hover:text-red-600 ${
                    user && comment.downvotes.includes(user.id) ? 'text-red-600' : 'text-gray-500'
                  }`}
                  disabled={!isAuthenticated}
                >
                  <ThumbsDown size={16} />
                </button>
              </div>
              
              <button
                onClick={() => handleReply(comment._id)}
                className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
              >
                <Reply size={16} />
                Reply
              </button>
              
              {canModify && (
                <>
                  <button
                    onClick={() => handleEdit(comment)}
                    className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </>
              )}
            </div>
            
            {isReplying && (
              <div className="mt-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
                <div className="flex mt-2 gap-2">
                  <button
                    onClick={() => handleSubmitReply(comment._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Render replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => (
                  <CommentItem key={reply._id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-bold mb-6">Comments</h3>
      
      {/* Comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Join the discussion..."
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md ${
                !newComment.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              } transition-colors`}
            >
              <Send size={16} className="mr-2" />
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-md mb-8">
          <p className="text-gray-600">
            Please{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800">
              log in
            </Link>{' '}
            to join the discussion.
          </p>
        </div>
      )}
      
      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map(comment => (
            <CommentItem key={comment._id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;