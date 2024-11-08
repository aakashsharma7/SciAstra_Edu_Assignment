# SciAstra Platform

A comprehensive educational platform for IIT-JEE, NEET, and other competitive exam preparation.

## Features

- Course Management
- Blog System
- User Authentication
- Payment Integration
- Admin Dashboard
- Responsive Design

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Modern web browser

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sciastra-platform.git
cd sciastra-platform
```

2. **Set up the backend**
```bash
cd backend
npm install
```

3. **Create `.env` file in backend directory**
```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASS=your_mysql_password
DB_NAME=sciastra_db
PORT=5001
JWT_SECRET=your_jwt_secret_key
```

4. **Set up the database**
```sql
CREATE DATABASE sciastra_db;
USE sciastra_db;

-- Create necessary tables (see Database Schema section)
```

5. **Start the backend server**
```bash
npm start
```

6. **Set up the frontend**
```bash
cd ../frontend
```
- Open `index.html` in a web browser or use a local server

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Courses Table
```sql
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    discount INT DEFAULT 0,
    instructor_id INT,
    duration VARCHAR(50),
    difficulty_level VARCHAR(50),
    total_enrolled INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);
```

## API Endpoints

### Authentication
- POST `/api/register` - User registration
- POST `/api/login` - User login

### Courses
- GET `/api/courses` - Get all courses
- GET `/api/courses/:id` - Get course details
- POST `/api/admin/courses` - Create course (Admin only)

### Blogs
- GET `/api/blogs` - Get published blogs
- POST `/api/blogs` - Create blog post
- PUT `/api/blogs/:id` - Update blog post
- DELETE `/api/blogs/:id` - Delete blog post

## Frontend Structure
```
frontend/
├── index.html
├── styles.css
├── script.js
├── admin/
│   └── blog-management.js
├── course-demo.html
└── profile.html
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- Font Awesome for icons
- MySQL for database
- Express.js for backend
- JWT for authentication

For detailed code examples and implementation details, refer to the source files in the repository.