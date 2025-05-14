# BlogFlow - A Full Stack Blogging Platform

A comprehensive blogging platform built with MongoDB, Express.js, Node.js, and React.js.

## Features

- User authentication with JWT
- Blog post creation and management with Markdown support
- Real-time comments with WebSocket/Socket.io
- Like/unlike functionality
- Advanced search and filtering
- User profiles
- Responsive design

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- Socket.io for real-time functionality
- bcrypt for password hashing

### Frontend
- React.js
- React Router for navigation
- Tailwind CSS for styling
- axios for API requests
- Socket.io-client for WebSocket connections
- react-markdown for rendering Markdown content

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/blog-platform
   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_in_production
   CLIENT_URL=http://localhost:5173
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## API Routes

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/logout` - Logout a user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user details

### Blogs

- `GET /api/blogs` - Get all published blogs (with pagination, filtering, and search)
- `GET /api/blogs/:idOrSlug` - Get a single blog by ID or slug
- `POST /api/blogs` - Create a new blog (authenticated)
- `PUT /api/blogs/:id` - Update a blog (authenticated, author or admin)
- `DELETE /api/blogs/:id` - Delete a blog (authenticated, author or admin)
- `POST /api/blogs/:id/like` - Like/unlike a blog (authenticated)
- `GET /api/blogs/user/:userId` - Get blogs by user

### Comments

- `GET /api/comments/blog/:blogId` - Get comments for a blog
- `GET /api/comments/:commentId/replies` - Get replies for a comment
- `POST /api/comments` - Create a comment or reply (authenticated)
- `PUT /api/comments/:id` - Update a comment (authenticated, author or admin)
- `DELETE /api/comments/:id` - Delete a comment (authenticated, author or admin)
- `POST /api/comments/:id/vote` - Vote on a comment (authenticated)

### Users

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile (authenticated)
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id/role` - Update user role (admin only)

## WebSocket Events

### Comment Namespace (`/comments`)

- `join-blog` (client -> server) - Join a blog room
- `leave-blog` (client -> server) - Leave a blog room
- `new-comment` (client -> server) - Create a new comment
- `update-comment` (client -> server) - Update a comment
- `delete-comment` (client -> server) - Delete a comment
- `vote-comment` (client -> server) - Vote on a comment
- `comment-created` (server -> client) - New comment created
- `comment-updated` (server -> client) - Comment updated
- `comment-deleted` (server -> client) - Comment deleted
- `comment-voted` (server -> client) - Comment vote updated
- `comment-error` (server -> client) - Error message

## License

This project is licensed under the MIT License.