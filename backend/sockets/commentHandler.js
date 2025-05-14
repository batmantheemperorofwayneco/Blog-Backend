import Comment from '../models/Comment.js';
import { verifyAccessToken } from '../utils/jwtUtils.js';

export const setupSocketHandlers = (io) => {
  // Create a namespace for comments
  const commentNamespace = io.of('/comments');
  
  // Middleware for authentication
  commentNamespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });
  
  commentNamespace.on('connection', (socket) => {
    console.log('User connected to comment socket:', socket.id);
    
    // Handle joining a blog room
    socket.on('join-blog', (blogId) => {
      socket.join(`blog:${blogId}`);
      console.log(`Socket ${socket.id} joined room for blog:${blogId}`);
    });
    
    // Handle leaving a blog room
    socket.on('leave-blog', (blogId) => {
      socket.leave(`blog:${blogId}`);
      console.log(`Socket ${socket.id} left room for blog:${blogId}`);
    });
    
    // Handle new comment
    socket.on('new-comment', async (data) => {
      try {
        const { content, blogId, parentCommentId } = data;
        const userId = socket.user.id;
        
        // Create comment
        const newComment = new Comment({
          content,
          author: userId,
          blog: blogId,
          parentComment: parentCommentId || null
        });
        
        await newComment.save();
        
        // Populate author details
        await newComment.populate('author', 'username firstName lastName profilePicture');
        
        // Emit to all users in the blog room
        commentNamespace.to(`blog:${blogId}`).emit('comment-created', {
          comment: newComment,
          parentId: parentCommentId
        });
      } catch (error) {
        console.error('Socket new comment error:', error);
        socket.emit('comment-error', { message: 'Failed to create comment' });
      }
    });
    
    // Handle comment update
    socket.on('update-comment', async (data) => {
      try {
        const { commentId, content } = data;
        const userId = socket.user.id;
        
        // Find comment
        const comment = await Comment.findById(commentId);
        
        if (!comment) {
          return socket.emit('comment-error', { message: 'Comment not found' });
        }
        
        // Check if user is the author or an admin
        if (comment.author.toString() !== userId && socket.user.role !== 'admin') {
          return socket.emit('comment-error', { message: 'Not authorized to update this comment' });
        }
        
        // Update comment
        comment.content = content;
        comment.isEdited = true;
        comment.updatedAt = Date.now();
        
        await comment.save();
        
        // Populate author details
        await comment.populate('author', 'username firstName lastName profilePicture');
        
        // Emit to all users in the blog room
        commentNamespace.to(`blog:${comment.blog}`).emit('comment-updated', {
          comment
        });
      } catch (error) {
        console.error('Socket update comment error:', error);
        socket.emit('comment-error', { message: 'Failed to update comment' });
      }
    });
    
    // Handle comment delete
    socket.on('delete-comment', async (data) => {
      try {
        const { commentId } = data;
        const userId = socket.user.id;
        
        // Find comment
        const comment = await Comment.findById(commentId);
        
        if (!comment) {
          return socket.emit('comment-error', { message: 'Comment not found' });
        }
        
        // Check if user is the author or an admin
        if (comment.author.toString() !== userId && socket.user.role !== 'admin') {
          return socket.emit('comment-error', { message: 'Not authorized to delete this comment' });
        }
        
        const blogId = comment.blog;
        
        // Delete replies
        await Comment.deleteMany({ parentComment: commentId });
        
        // Delete comment
        await Comment.findByIdAndDelete(commentId);
        
        // Emit to all users in the blog room
        commentNamespace.to(`blog:${blogId}`).emit('comment-deleted', {
          commentId
        });
      } catch (error) {
        console.error('Socket delete comment error:', error);
        socket.emit('comment-error', { message: 'Failed to delete comment' });
      }
    });
    
    // Handle comment vote
    socket.on('vote-comment', async (data) => {
      try {
        const { commentId, voteType } = data;
        const userId = socket.user.id;
        
        if (!['upvote', 'downvote'].includes(voteType)) {
          return socket.emit('comment-error', { message: 'Invalid vote type' });
        }
        
        // Find comment
        const comment = await Comment.findById(commentId);
        
        if (!comment) {
          return socket.emit('comment-error', { message: 'Comment not found' });
        }
        
        // Check if user has already voted
        const hasUpvoted = comment.upvotes.includes(userId);
        const hasDownvoted = comment.downvotes.includes(userId);
        
        // Handle upvote
        if (voteType === 'upvote') {
          if (hasUpvoted) {
            // Remove upvote if already upvoted
            comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
          } else {
            // Add upvote and remove from downvotes if already downvoted
            comment.upvotes.push(userId);
            if (hasDownvoted) {
              comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
            }
          }
        } 
        // Handle downvote
        else if (voteType === 'downvote') {
          if (hasDownvoted) {
            // Remove downvote if already downvoted
            comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
          } else {
            // Add downvote and remove from upvotes if already upvoted
            comment.downvotes.push(userId);
            if (hasUpvoted) {
              comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
            }
          }
        }
        
        await comment.save();
        
        // Emit to all users in the blog room
        commentNamespace.to(`blog:${comment.blog}`).emit('comment-voted', {
          commentId: comment._id,
          voteScore: comment.upvotes.length - comment.downvotes.length,
          upvotes: comment.upvotes.length,
          downvotes: comment.downvotes.length
        });
      } catch (error) {
        console.error('Socket vote comment error:', error);
        socket.emit('comment-error', { message: 'Failed to vote on comment' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected from comment socket:', socket.id);
    });
  });
};