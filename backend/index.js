const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL Connected...');
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const isAdmin = (req, res, next) => {
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });
        if (results[0].role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        next();
    });
};

// Use middleware for admin routes
app.get('/api/admin/*', verifyToken, isAdmin, (req, res, next) => next());
app.post('/api/admin/*', verifyToken, isAdmin, (req, res, next) => next());

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, hashedPassword], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User registered successfully' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const query = 'SELECT id, username, email, password, role FROM users WHERE email = ?';
        
        db.query(query, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(400).json({ error: 'User not found' });

            const validPassword = await bcrypt.compare(password, results[0].password);
            if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

            const token = jwt.sign(
                { 
                    id: results[0].id,
                    role: results[0].role 
                }, 
                process.env.JWT_SECRET
            );

            // Send user data including role
            res.json({
                token,
                user: {
                    id: results[0].id,
                    username: results[0].username,
                    email: results[0].email,
                    role: results[0].role
                }
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Course routes
app.get('/api/courses', (req, res) => {
  console.log('Fetching courses...');
  const query = 'SELECT c.*, u.username as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.discount > 0';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    console.log('Courses fetched:', results);
    res.json(results);
  });
});

// Blog routes
app.get('/api/blogs', (req, res) => {
  console.log('Fetching blogs...');
  const query = 'SELECT * FROM blogs ORDER BY publish_date DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    console.log('Blogs fetched:', results);
    res.json(results);
  });
});

app.post('/api/blogs', verifyToken, (req, res) => {
    const { title, content, publishDate, status, category } = req.body;
    const userId = req.user.id;
    
    const query = `
        INSERT INTO blogs (
            title, content, publish_date, status, 
            category, author_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    db.query(
        query,
        [title, content, publishDate, status, category, userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: 'Blog post created successfully',
                blogId: results.insertId 
            });
        }
    );
});

app.get('/api/admin/blogs', verifyToken, (req, res) => {
    const query = `
        SELECT b.*, u.username as author_name 
        FROM blogs b
        LEFT JOIN users u ON b.author_id = u.id
        ORDER BY b.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.put('/api/blogs/:id', verifyToken, (req, res) => {
    const { title, content, publishDate, status, category } = req.body;
    const blogId = req.params.id;
    const userId = req.user.id;

    const query = `
        UPDATE blogs 
        SET title = ?, content = ?, publish_date = ?, 
            status = ?, category = ?, updated_at = NOW()
        WHERE id = ? AND author_id = ?
    `;

    db.query(
        query,
        [title, content, publishDate, status, category, blogId, userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Blog post updated successfully' });
        }
    );
});

app.delete('/api/blogs/:id', verifyToken, (req, res) => {
    const blogId = req.params.id;
    const userId = req.user.id;

    const query = 'DELETE FROM blogs WHERE id = ? AND author_id = ?';
    
    db.query(query, [blogId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Blog post deleted successfully' });
    });
});

// Admin routes
app.post('/api/admin/blogs', verifyToken, isAdmin, (req, res) => {
    const { title, content, category, status, publishDate } = req.body;
    const userId = req.user.id;
    
    const query = `
        INSERT INTO blogs (
            title, content, category, status, 
            publish_date, author_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    db.query(
        query,
        [title, content, category, status, publishDate, userId],
        (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                success: true,
                message: 'Blog post created successfully',
                blogId: results.insertId 
            });
        }
    );
});

// Payment routes
app.post('/api/orders', verifyToken, (req, res) => {
  const { course_id, payment_method } = req.body;
  const query = 'INSERT INTO orders (user_id, course_id, payment_method, payment_status) VALUES (?, ?, ?, "pending")';
  db.query(query, [req.user.id, course_id, payment_method], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ order_id: results.insertId });
  });
});

// Payment verification routes
app.post('/api/payments/verify', verifyToken, (req, res) => {
  const { courseId, paymentMethod, amount } = req.body;
  
  // Generate a random 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store verification code in database
  const query = 'INSERT INTO payment_verifications (user_id, course_id, verification_code, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))';
  db.query(query, [req.user.id, courseId, verificationCode], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // In production, send OTP via SMS/email
    console.log('Verification code:', verificationCode);
    
    res.json({ verificationCode });
  });
});

// Payment completion route
app.post('/api/payments/complete', verifyToken, (req, res) => {
  const { courseId, paymentMethod, amount } = req.body;
  
  // First check if user already has this course
  const checkQuery = 'SELECT id FROM orders WHERE user_id = ? AND course_id = ? AND payment_status = "completed"';
  db.query(checkQuery, [req.user.id, courseId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error occurred' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'You have already purchased this course' });
    }

    // Create new order - Fixed the SQL query
    const orderQuery = `
      INSERT INTO orders (
        user_id, 
        course_id, 
        payment_method, 
        amount,
        payment_status,
        created_at
      ) VALUES (?, ?, ?, ?, 'completed', NOW())
    `;

    db.query(orderQuery, [req.user.id, courseId, paymentMethod, amount], (err, orderResult) => {
      if (err) {
        console.error('Order creation error:', err);
        return res.status(500).json({ error: 'Failed to create order. Error: ' + err.message });
      }

      // Update course enrollment count
      const updateCourseQuery = `
        UPDATE courses 
        SET total_enrolled = COALESCE(total_enrolled, 0) + 1 
        WHERE id = ?
      `;

      db.query(updateCourseQuery, [courseId], (updateErr) => {
        if (updateErr) {
          console.error('Course update error:', updateErr);
        }

        // Create user_courses entry
        const userCourseQuery = `
          INSERT INTO user_courses (user_id, course_id, enrollment_date)
          VALUES (?, ?, NOW())
          ON DUPLICATE KEY UPDATE enrollment_date = NOW()
        `;

        db.query(userCourseQuery, [req.user.id, courseId], (userCourseErr) => {
          if (userCourseErr) {
            console.error('User course creation error:', userCourseErr);
          }

          res.json({ 
            success: true, 
            orderId: orderResult.insertId,
            message: 'Payment successful'
          });
        });
      });
    });
  });
});

// Get single course route
app.get('/api/courses/:id', (req, res) => {
  console.log('Fetching course details...');
  const query = `
    SELECT 
      c.*,
      COALESCE(u.username, 'Expert Instructor') as instructor_name,
      COALESCE(c.duration, 'Flexible') as duration,
      COALESCE(c.rating, 0) as rating,
      COALESCE(c.total_enrolled, 0) as total_enrolled,
      COALESCE(c.difficulty_level, 'beginner') as difficulty_level
    FROM courses c 
    LEFT JOIN users u ON c.instructor_id = u.id 
    WHERE c.id = ?
  `;
  
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Format the response
    const course = results[0];
    course.price = parseFloat(course.price).toFixed(2);
    course.rating = parseFloat(course.rating).toFixed(1);
    
    console.log('Course details fetched:', course);
    res.json(course);
  });
});

// Get order details route
app.get('/api/orders/:id', verifyToken, (req, res) => {
    const query = `
        SELECT o.*, c.title as course_title, c.price, c.discount
        FROM orders o
        JOIN courses c ON o.course_id = c.id
        WHERE o.id = ? AND o.user_id = ?
    `;
    
    db.query(query, [req.params.id, req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Order not found' });
        
        const order = results[0];
        // Calculate final amount with discount
        const discount = order.discount || 0;
        const finalPrice = (order.price * (100 - discount) / 100).toFixed(2);
        order.amount = finalPrice;
        
        res.json(order);
    });
});

// Get published blogs
app.get('/api/blogs', (req, res) => {
    const query = `
        SELECT b.*, u.username as author_name 
        FROM blogs b
        LEFT JOIN users u ON b.author_id = u.id
        WHERE b.status = 'published' 
        AND (b.publish_date IS NULL OR b.publish_date <= NOW())
        ORDER BY b.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.json(results);
    });
});

// Get single blog
app.get('/api/blogs/:id', (req, res) => {
    const blogId = req.params.id;
    const query = `
        SELECT b.*, u.username as author_name 
        FROM blogs b
        LEFT JOIN users u ON b.author_id = u.id
        WHERE b.id = ? AND b.status = 'published'
    `;
    
    db.query(query, [blogId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Blog not found' });
        res.json(results[0]);
    });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
