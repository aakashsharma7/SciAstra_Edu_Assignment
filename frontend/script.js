document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
    fetchBlogs();
    setupUserMenu();
    addSearchFunctionality();
  });
  
  function fetchCourses() {
    console.log('Fetching courses...');
    fetch('http://localhost:5001/api/courses')
      .then(response => {
        console.log('Course response status:', response.status);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log('Received courses data:', data);
        displayCourses(data);
      })
      .catch(error => {
        console.error('Error fetching courses:', error);
        const courseContainer = document.getElementById('course-container');
        courseContainer.innerHTML = `
          <div class="error-message">
            <p>Unable to load courses at the moment.</p>
            <button onclick="fetchCourses()" class="retry-btn">Try Again</button>
          </div>
        `;
      });
  }
  
  function fetchBlogs() {
    const blogContainer = document.getElementById('blog-container');
    if (!blogContainer) return;

    fetch('http://localhost:5001/api/blogs')
        .then(response => response.json())
        .then(blogs => {
            if (!blogs || blogs.length === 0) {
                blogContainer.innerHTML = '<p class="no-data">No blogs available at the moment.</p>';
                return;
            }

            blogContainer.innerHTML = blogs.map(blog => `
                <div class="blog-card">
                    <div class="blog-header">
                        <h3>${blog.title}</h3>
                        <span class="blog-category">${blog.category || 'General'}</span>
                    </div>
                    <div class="blog-content">
                        ${blog.content.substring(0, 150)}...
                    </div>
                    <div class="blog-footer">
                        <div class="blog-meta">
                            <span class="blog-author">
                                <i class="fas fa-user"></i> ${blog.author_name || 'Admin'}
                            </span>
                            <span class="blog-date">
                                <i class="fas fa-calendar"></i> ${new Date(blog.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <a href="/blog.html?id=${blog.id}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading blogs:', error);
            blogContainer.innerHTML = '<p class="error-message">Failed to load blogs. Please try again later.</p>';
        });
  }
  
  function register(userData) {
    return fetch('http://localhost:5001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(response => response.json());
  }
  
  function login(credentials) {
    return fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(response => response.json());
  }
  
  function purchaseCourse(courseId) {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('pendingCourseId', courseId);
      localStorage.setItem('redirectAfterLogin', '/payment.html');
      window.location.href = '/login.html';
      return;
    }
  
    window.location.href = `/payment.html?courseId=${courseId}`;
  }
  
  function setupUserMenu() {
    const userButton = document.getElementById('user-button');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userButton) {
        userButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (userDropdown) {
            userDropdown.classList.remove('active');
        }
    });

    // Update user info in header
    updateUserInfo();
  }
  
  function updateUserInfo() {
    const userInitial = document.getElementById('user-initial');
    const usernameDisplay = document.getElementById('username-display');
    const userButton = document.getElementById('user-button');
    const dropdownLinks = document.querySelector('.dropdown-links');
    
    const userData = localStorage.getItem('user');
    
    if (userData) {
        const user = JSON.parse(userData);
        userInitial.textContent = user.username.charAt(0).toUpperCase();
        usernameDisplay.textContent = user.username;
        userButton.style.backgroundColor = '#4a90e2';

        // Clear existing links first
        dropdownLinks.innerHTML = '';

        // Add Profile link
        dropdownLinks.innerHTML += `
            <a href="/profile.html" class="dropdown-link">
                <i class="fas fa-user"></i>
                Profile
            </a>
        `;

        // Add My Courses link
        dropdownLinks.innerHTML += `
            <a href="/my-courses.html" class="dropdown-link">
                <i class="fas fa-book-reader"></i>
                My Courses
            </a>
        `;

        // Add Blog link
        dropdownLinks.innerHTML += `
            <a href="/blogs.html" class="dropdown-link">
                <i class="fas fa-blog"></i>
                Blogs
            </a>
        `;

        // Add Admin Panel link if user is admin
        if (user.role === 'admin') {
            dropdownLinks.innerHTML += `
                <a href="/admin/blog-management.html" class="dropdown-link admin-link">
                    <i class="fas fa-user-shield"></i>
                    Admin Panel
                </a>
            `;
        }

        // Add Logout button
        dropdownLinks.innerHTML += `
            <button id="logout-button" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </button>
        `;

        // Re-attach logout event listener
        document.getElementById('logout-button').addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        });
    } else {
        userInitial.textContent = '?';
        usernameDisplay.textContent = 'Not logged in';
        userButton.style.backgroundColor = '#666';
        
        // Show login/register links for logged out users
        dropdownLinks.innerHTML = `
            <a href="/login.html" class="dropdown-link">
                <i class="fas fa-sign-in-alt"></i>
                Login
            </a>
            <a href="/register.html" class="dropdown-link">
                <i class="fas fa-user-plus"></i>
                Register
            </a>
        `;
    }
  }
  
  function displayCourses(courses) {
    const container = document.getElementById('course-container');
    container.innerHTML = courses.map(course => `
        <div class="course">
            <div class="course-header">
                <h3>${course.title}</h3>
                <span class="difficulty-badge ${course.difficulty_level?.toLowerCase() || 'beginner'}">
                    ${course.difficulty_level || 'Beginner'}
                </span>
            </div>
            <div class="course-description">
                <p>${course.description || 'No description available.'}</p>
            </div>
            <div class="course-info">
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${course.duration || '6 months'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-users"></i>
                    <span>${course.enrolled || '0'} students</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-star"></i>
                    <span>${course.rating || '4.5'}</span>
                </div>
            </div>
            <div class="course-price">
                <div class="price-info">
                    <span class="original-price">₹${course.price}</span>
                    ${course.discount ? `
                        <span class="discount-badge">${course.discount}% OFF</span>
                        <span class="final-price">₹${calculateFinalPrice(course.price, course.discount)}</span>
                    ` : ''}
                </div>
            </div>
            <button onclick="window.location.href='/payment.html?courseId=${course.id}'" class="enroll-button">
                <i class="fas fa-graduation-cap"></i>
                Enroll Now
            </button>
        </div>
    `).join('');
  }
  
  function calculateFinalPrice(price, discount) {
    const discountAmount = (price * discount) / 100;
    return price - discountAmount;
  }
  
  function addSearchFunctionality() {
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn = document.querySelector('.search-btn');
    let allCourses = [];

    // Fetch all courses initially
    fetch('http://localhost:5001/api/courses')
        .then(response => response.json())
        .then(data => {
            allCourses = data;
            displayCourses(data);
        });

    // Search function
    function searchCourses(query) {
        const searchResults = allCourses.filter(course => {
            const searchString = query.toLowerCase();
            return (
                course.title?.toLowerCase().includes(searchString) ||
                course.description?.toLowerCase().includes(searchString) ||
                course.difficulty_level?.toLowerCase().includes(searchString)
            );
        });
        displayCourses(searchResults);
    }

    // Search on input
    searchInput.addEventListener('input', (e) => {
        searchCourses(e.target.value);
    });

    // Search on button click
    searchBtn.addEventListener('click', () => {
        searchCourses(searchInput.value);
    });
  }
  