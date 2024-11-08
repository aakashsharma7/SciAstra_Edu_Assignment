document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) {
        window.location.href = '/login.html';
        return;
    }

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = '/';
        return;
    }

    loadBlogs();
    setupEventListeners();
});

function setupEventListeners() {
    // New blog button
    document.getElementById('new-blog-btn').addEventListener('click', () => {
        window.location.href = '/admin/add-blog.html';
    });

    // Status filter
    document.getElementById('status-filter').addEventListener('change', loadBlogs);
    
    // Category filter
    document.getElementById('category-filter').addEventListener('change', loadBlogs);
    
    // Search input
    document.getElementById('search-blogs').addEventListener('input', 
        debounce(() => loadBlogs(), 300)
    );
}

function loadBlogs() {
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const searchQuery = document.getElementById('search-blogs').value.toLowerCase();

    fetch('http://localhost:5001/api/admin/blogs', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to load blogs');
        return response.json();
    })
    .then(blogs => {
        // Filter blogs
        const filteredBlogs = blogs.filter(blog => {
            const matchesStatus = statusFilter === 'all' || blog.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || blog.category === categoryFilter;
            const matchesSearch = blog.title.toLowerCase().includes(searchQuery) || 
                                blog.content.toLowerCase().includes(searchQuery);
            return matchesStatus && matchesCategory && matchesSearch;
        });

        displayBlogs(filteredBlogs);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load blogs');
    });
}

function displayBlogs(blogs) {
    const container = document.getElementById('blogs-table');
    
    if (!blogs.length) {
        container.innerHTML = '<p class="no-blogs">No blogs found</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Publish Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${blogs.map(blog => `
                    <tr>
                        <td>${blog.title}</td>
                        <td>${blog.category || 'Uncategorized'}</td>
                        <td>
                            <span class="status-badge ${blog.status}">
                                ${blog.status}
                            </span>
                        </td>
                        <td>${blog.publish_date ? new Date(blog.publish_date).toLocaleDateString() : 'Not scheduled'}</td>
                        <td class="actions">
                            <button onclick="editBlog(${blog.id})" class="edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteBlog(${blog.id})" class="delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function editBlog(blogId) {
    window.location.href = `/admin/add-blog.html?id=${blogId}`;
}

function deleteBlog(blogId) {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    fetch(`http://localhost:5001/api/admin/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to delete blog');
        return response.json();
    })
    .then(() => {
        loadBlogs();
        alert('Blog deleted successfully');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to delete blog');
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 