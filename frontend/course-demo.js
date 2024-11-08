document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    const orderId = urlParams.get('orderId');

    if (!courseId || !orderId) {
        window.location.href = '/';
        return;
    }

    // Fetch course details
    fetch(`http://localhost:5001/api/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(course => {
        document.getElementById('course-title').innerHTML = `
            <h1>${course.title}</h1>
            <p class="subtitle">${course.subtitle || ''}</p>
        `;

        document.getElementById('course-details').innerHTML = `
            <div class="course-info">
                <p><strong>Instructor:</strong> ${course.instructor_name}</p>
                <p><strong>Duration:</strong> ${course.duration}</p>
                <p><strong>Difficulty:</strong> ${course.difficulty_level}</p>
            </div>
        `;

        // Start countdown for home page redirect
        let seconds = 5;
        const countdownElement = document.getElementById('countdown');
        const countdownInterval = setInterval(() => {
            seconds--;
            countdownElement.textContent = seconds;
            if (seconds <= 0) {
                clearInterval(countdownInterval);
                window.location.href = '/';
            }
        }, 1000);
    })
    .catch(error => {
        console.error('Error fetching course details:', error);
        window.location.href = '/';
    });
}); 