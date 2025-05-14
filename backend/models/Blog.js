import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [50, 'Content must be at least 50 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    trim: true,
    lowercase: true
  },
  coverImage: {
    type: String
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  featured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comment count
BlogSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'blog',
  count: true
});

// Virtual for like count
BlogSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Middleware to ensure slug uniqueness 
BlogSchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const slugExists = await this.constructor.findOne({ 
      slug: this.slug,
      _id: { $ne: this._id }
    });
    
    if (slugExists) {
      // Append a random string to make the slug unique
      this.slug = `${this.slug}-${Math.random().toString(36).substring(2, 8)}`;
    }
  }
  next();
});

// Index for text search
BlogSchema.index(
  { title: 'text', content: 'text', tags: 'text' },
  { weights: { title: 3, tags: 2, content: 1 } }
);

const Blog = mongoose.model('Blog', BlogSchema);

export default Blog;