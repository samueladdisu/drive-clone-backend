# Google Drive Clone - Backend API

A robust, scalable backend API for a simplified Google Drive clone built with Node.js, Express, TypeScript, and MongoDB. This application provides user authentication, file management, and secure file storage capabilities.

## 🚀 Features

### Core Features

- **User Authentication**: Secure registration, login, and JWT-based authentication
- **File Management**: Upload, download, rename, move, and delete files
- **Folder System**: Create, organize, and manage folder hierarchies
- **User Isolation**: Each user can only access their own files and folders
- **File Security**: Protected routes prevent unauthorized file access
- **File Type Support**: Support for various file types with size limitations

### Technical Features

- **TypeScript**: Full TypeScript support with strict type checking
- **MongoDB**: NoSQL database with Mongoose ODM
- **File Upload**: Secure file upload with multer and file validation
- **CORS Protection**: Configurable CORS settings for frontend integration
- **Rate Limiting**: Built-in rate limiting for API protection
- **Error Handling**: Comprehensive error handling and logging
- **Input Validation**: Joi-based request validation
- **Security**: Helmet.js for security headers and bcrypt for password hashing

## 🛠️ Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd google-drive-clone
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # File Upload Configuration
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=52428800
   # 50MB = 50 * 1024 * 1024 = 52428800 bytes

   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/google_drive_clone

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Build and start the application**

   ```bash
   # Development mode
   npm run dev

   # Production build
   npm run build
   npm start
   ```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get User Profile

```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

#### Update User Profile

```http
PUT /api/auth/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "username": "newusername"
}
```

### File Management Endpoints

#### Get Files and Folders

```http
GET /api/files?parentId=<folder-id>
Authorization: Bearer <jwt-token>
```

#### Create Folder

```http
POST /api/files/folder
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "New Folder",
  "parentId": "<parent-folder-id>" // optional
}
```

#### Upload File

```http
POST /api/files/upload
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

file: <file-data>
parentId: <parent-folder-id> // optional
```

#### Download File

```http
GET /api/files/download/<file-id>
Authorization: Bearer <jwt-token>
```

#### Rename File/Folder

```http
PUT /api/files/<item-id>/rename
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "New Name"
}
```

#### Move File/Folder

```http
PUT /api/files/<item-id>/move
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "parentId": "<new-parent-id>" // null for root
}
```

#### Delete File/Folder

```http
DELETE /api/files/<item-id>
Authorization: Bearer <jwt-token>
```

#### Get Breadcrumb Path

```http
GET /api/files/breadcrumb?itemId=<item-id>
Authorization: Bearer <jwt-token>
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds for password security
- **Input Validation**: Joi validation for all API inputs
- **File Type Validation**: Whitelist of allowed file types
- **File Size Limits**: Configurable maximum file size (default 50MB)
- **CORS Protection**: Configurable CORS origins
- **Rate Limiting**: Protection against brute force attacks
- **Helmet.js**: Security headers for HTTP responses

## 📁 Project Structure

```
google-drive-clone/
├── src/
│   ├── controllers/
│   │   ├── userController.ts    # User authentication & management
│   │   ├── fileController.ts    # File operations (upload, download, etc.)
│   │   └── folderController.ts  # Folder operations (create, navigate, etc.)
│   ├── models/
│   │   ├── User.ts             # User Mongoose model
│   │   ├── File.ts             # File Mongoose model
│   │   └── Folder.ts           # Folder Mongoose model
│   ├── routes/
│   │   ├── userRoutes.ts       # Authentication routes
│   │   ├── fileRoutes.ts       # File management routes
│   │   └── folderRoutes.ts     # Folder management routes
│   ├── middlewares/
│   │   ├── auth.ts             # JWT authentication middleware
│   │   └── errorHandler.ts     # Global error handling
│   ├── utils/
│   │   ├── database.ts         # MongoDB connection
│   │   ├── upload.ts           # File upload configuration
│   │   └── validation.ts       # Request validation schemas
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── config/
│   │   └── config.ts           # Environment configuration
│   ├── app.ts                  # Express app setup
│   └── server.ts               # Server startup
├── uploads/                    # File storage directory
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## 🧪 Supported File Types

- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, TXT, DOC, DOCX
- **Spreadsheets**: XLS, XLSX
- **Presentations**: PPT, PPTX
- **Archives**: ZIP, RAR

## 🔧 Environment Variables

| Variable         | Description                | Default                                        |
| ---------------- | -------------------------- | ---------------------------------------------- |
| `PORT`           | Server port                | `3000`                                         |
| `NODE_ENV`       | Environment mode           | `development`                                  |
| `JWT_SECRET`     | JWT signing secret         | Required                                       |
| `JWT_EXPIRES_IN` | JWT expiration time        | `7d`                                           |
| `UPLOAD_DIR`     | File upload directory      | `./uploads`                                    |
| `MAX_FILE_SIZE`  | Maximum file size in bytes | `52428800` (50MB)                              |
| `MONGO_URI`      | MongoDB connection string  | `mongodb://localhost:27017/google_drive_clone` |
| `CORS_ORIGIN`    | Allowed CORS origins       | `http://localhost:3000,http://localhost:5173`  |

## 🚦 API Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `409` - Conflict (duplicate resources)
- `422` - Unprocessable Entity
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🔍 Health Check

```http
GET /health
```

Returns server status and configuration information.

## 📈 Performance Considerations

- **Database Indexing**: Optimized MongoDB indexes for query performance
- **File Streaming**: Efficient file download using Node.js streams
- **Connection Pooling**: MongoDB connection pooling for scalability
- **Compression**: Gzip compression for HTTP responses
- **Caching**: Optimized for future caching implementation

## 🛡️ Error Handling

The API provides comprehensive error handling with:

- Detailed error messages for development
- Sanitized error responses for production
- Proper HTTP status codes
- Request validation errors
- Database constraint violations
- File system errors

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper MongoDB URI
4. Set up reverse proxy (nginx)
5. Enable HTTPS
6. Configure proper CORS origins
7. Set up monitoring and logging

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Happy coding! 🎉**
