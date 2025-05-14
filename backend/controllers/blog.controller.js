import Blog from '../models/Blog.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Create a blog post
export const createBlog = async (req, res) => {
  try {
    const { title, content, tags, category, coverImage, slug, status, featured } = req.body;
    const userId = req.user.id;

    // Validate markdown content
    if (!content || content.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Content must be at least 50 characters'
      });
    }

    // Create slug if not provided
    let blogSlug = slug;
    if (!blogSlug) {
      blogSlug = title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    }

    // Check if slug already exists
    const slugExists = await Blog.findOne({ slug: blogSlug });
    if (slugExists) {
      blogSlug = `${blogSlug}-${Date.now().toString().slice(-6)}`;
    }

    // Create blog post
    const newBlog = new Blog({
      title,
      content,
      author: userId,
      tags: tags || [],
      category: category || 'uncategorized',
      coverImage,
      slug: blogSlug,
      status: status || 'published',
      featured: featured && req.user.role === 'admin' ? featured : false
    });

    await newBlog.save();

    return res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      blog: newBlog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create blog post',
      error: error.message
    });
  }
};

// Get all published blog posts with pagination
export const getBlogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = -1,
      tag,
      category,
      author,
      featured,
      search
    } = req.query;

    // Build filter
    const filter = { status: 'published' };
    
    if (tag) filter.tags = tag;
    if (category) filter.category = category;
    if (author) filter.author = author;
    if (featured === 'true') filter.featured = true;

    // Handle text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Prepare sort options
    const sortOptions = {};
    sortOptions[sortBy] = parseInt(sortOrder);

    // Get total count for pagination
    const totalCount = await Blog.countDocuments(filter);
    
    // Get blogs with author details and comment count
    const blogs = await Blog.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username firstName lastName profilePicture')
      .populate('commentCount')
      .lean();

    const blogData = blogs.map(blog => ({
      ...blog,
      content: blog.content.substring(0, 300) + (blog.content.length > 300 ? '...' : ''),
      likeCount: blog.likes.length
    }));

    return res.status(200).json({
      success: true,
      count: blogs.length,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      blogs: blogData
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blog posts',
      error: error.message
    });
  }
};

// Get a single blog post by ID or slug
export const getBlogByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Check if parameter is ObjectId or slug
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    
    const filter = isObjectId 
      ? { _id: idOrSlug, status: 'published' }
      : { slug: idOrSlug, status: 'published' };

    // Increment view count
    const blog = await Blog.findOneAndUpdate(
      filter,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
    .populate('author', 'username firstName lastName profilePicture bio')
    .populate({
      path: 'commentCount'
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    return res.status(200).json({
      success: true,
      blog
    });
  } catch (error) {
    console.error('Get blog error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blog post',
      error: error.message
    });
  }
};

// Update a blog post
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, category, coverImage, status, featured } = req.body;
    const userId = req.user.id;

    // Find blog post
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Check if user is the author or an admin
    if (blog.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this blog post'
      });
    }

    // Update blog post
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title: title || blog.title,
        content: content || blog.content,
        tags: tags || blog.tags,
        category: category || blog.category,
        coverImage: coverImage || blog.coverImage,
        status: status || blog.status,
        featured: req.user.role === 'admin' ? (featured !== undefined ? featured : blog.featured) : blog.featured,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('author', 'username firstName lastName profilePicture');

    return res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      blog: updatedBlog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update blog post',
      error: error.message
    });
  }
};

// Delete a blog post
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find blog post
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Check if user is the author or an admin
    if (blog.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this blog post'
      });
    }

    // Delete blog post
    await Blog.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete blog post',
      error: error.message
    });
  }
};

// Like or unlike a blog post
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find blog post
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Check if user has already liked the blog
    const isLiked = blog.likes.includes(userId);

    // Toggle like status
    if (isLiked) {
      // Unlike
      blog.likes = blog.likes.filter(
        (like) => like.toString() !== userId
      );
    } else {
      // Like
      blog.likes.push(userId);
    }

    await blog.save();

    return res.status(200).json({
      success: true,
      message: isLiked ? 'Blog post unliked successfully' : 'Blog post liked successfully',
      liked: !isLiked,
      likeCount: blog.likes.length
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to like/unlike blog post',
      error: error.message
    });
  }
};

// Get user's blogs
export const getUserBlogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isCurrentUser = req.user && req.user.id === userId;
    const isAdmin = req.user && req.user.role === 'admin';

    // For own blogs or admin, show all statuses, otherwise only published
    const filter = {
      author: userId,
      ...((!isCurrentUser && !isAdmin) && { status: 'published' })
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const totalCount = await Blog.countDocuments(filter);

    // Get blogs with pagination
    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('commentCount')
      .lean();

    const blogData = blogs.map(blog => ({
      ...blog,
      content: blog.content.substring(0, 300) + (blog.content.length > 300 ? '...' : ''),
      likeCount: blog.likes.length
    }));

    return res.status(200).json({
      success: true,
      count: blogs.length,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      blogs: blogData
    });
  } catch (error) {
    console.error('Get user blogs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user blogs',
      error: error.message
    });
  }
};