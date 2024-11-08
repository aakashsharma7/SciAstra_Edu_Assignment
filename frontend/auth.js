// Common validation functions
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Handle registration form
if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validation
        if (!validateEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        if (!validatePassword(password)) {
            alert('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please login.');
                window.location.href = '/login.html';
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    });
}

// Handle login form
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!validateEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            
            if (response.ok && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Check for pending course enrollment
                const pendingCourseId = localStorage.getItem('pendingCourseId');
                const redirectUrl = localStorage.getItem('redirectAfterLogin');
                
                if (pendingCourseId && redirectUrl) {
                    localStorage.removeItem('pendingCourseId');
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = `${redirectUrl}?courseId=${pendingCourseId}`;
                } else {
                    window.location.href = '/';
                }
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });
} 