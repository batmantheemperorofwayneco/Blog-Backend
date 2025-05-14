import Comment from '../models/Comment.js';
import Blog from '../models/Blog.js';

// Create a comment
export const createComment = async (req, res) => {
  try {
    const { content, blogId, parentCommentId } = req.body;
    const userId = req.user.id;

    // Validate blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // If parent comment ID is provided, validate it exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false, 
          message: 'Parent comment not found'
        });
      }
    }

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

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

// Get comments for a blog post
export const getComments = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get only top-level comments (not replies)
    const comments = await Comment.find({ 
      blog: blogId,
      parentComment: null 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username firstName lastName profilePicture')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username firstName lastName profilePicture'
        },
        options: { sort: { createdAt: 1 } }
      });

    // Get total count for pagination
    const totalCount = await Comment.countDocuments({ 
      blog: blogId,
      parentComment: null 
    });

    return res.status(200).json({
      success: true,
      count: comments.length,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get comments',
      error: error.message
    });
  }
};

// Get replies for a comment
export const getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get replies
    const replies = await Comment.find({ parentComment: commentId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username firstName lastName profilePicture');

    // Get total count for pagination
    const totalCount = await Comment.countDocuments({ parentComment: commentId });

    return res.status(200).json({
      success: true,
      count: replies.length,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      replies
    });
  } catch (error) {
    console.error('Get replies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get replies',
      error: error.message
    });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Find comment
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author or an admin
    if (comment.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this comment'
      });
    }

    // Update comment
    comment.content = content;
    comment.isEdited = true;
    comment.updatedAt = Date.now();
    
    await comment.save();

    // Populate author details
    await comment.populate('author', 'username firstName lastName profilePicture');

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find comment
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author or an admin
    if (comment.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment'
      });
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: id });

    // Delete comment
    await Comment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// Vote on a comment (upvote or downvote)
export const voteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const userId = req.user.id;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }

    // Find comment
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
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

    return res.status(200).json({
      success: true,
      message: `Comment ${voteType === 'upvote' ? 'upvoted' : 'downvoted'} successfully`,
      voteScore: comment.upvotes.length - comment.downvotes.length,
      userVote: hasUpvoted ? (voteType === 'upvote' ? null : 'downvote') : 
                hasDownvoted ? (voteType === 'downvote' ? null : 'upvote') :
                voteType
    });
  } catch (error) {
    console.error('Vote comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to vote on comment',
      error: error.message
    });
  }
};