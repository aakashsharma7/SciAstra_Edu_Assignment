document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    
    if (!localStorage.getItem('token')) {
        window.location.href = '/login.html?redirect=payment&courseId=' + courseId;
        return;
    }

    fetchCourseDetails(courseId);
    setupPaymentMethodListeners();
});

function setupPaymentMethodListeners() {
    const paymentForm = document.getElementById('payment-form');
    if (!paymentForm) return;

    paymentForm.addEventListener('submit', handlePaymentSubmission);

    // Setup radio button listeners
    const paymentMethods = document.getElementsByName('payment_method');
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            const paymentFields = document.getElementById('payment-fields');
            paymentFields.innerHTML = getPaymentFields(e.target.value);
        });
    });
}

function handlePaymentSubmission(e) {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    const selectedMethod = document.querySelector('input[name="payment_method"]:checked');

    if (!selectedMethod) {
        alert('Please select a payment method');
        return;
    }

    // Generate a mock order ID
    const mockOrderId = 'ORD' + Date.now();

    // Show success message and redirect
    showSuccessMessage(mockOrderId);
}

function showSuccessMessage(orderId) {
    const modal = document.createElement('div');
    modal.className = 'success-message-modal';
    modal.innerHTML = `
        <div class="success-message-content">
            <div class="success-icon">✓</div>
            <h3>Payment Successful!</h3>
            <p>Redirecting to your course...</p>
        </div>
    `;
    document.body.appendChild(modal);

    // Redirect after a short delay
    setTimeout(() => {
        window.location.href = `/payment-success.html?orderId=${orderId}`;
    }, 2000);
}

// Keep the existing fetchCourseDetails and other utility functions
function fetchCourseDetails(courseId) {
    fetch(`http://localhost:5001/api/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(course => {
        const originalPrice = parseFloat(course.price || 0);
        const discount = parseInt(course.discount || 0);
        const finalPrice = calculateFinalPrice(originalPrice, discount);

        document.getElementById('course-summary').innerHTML = `
            <div class="course-preview">
                <h3>${course.title || 'Course Title'}</h3>
                ${course.subtitle ? `<p class="course-subtitle">${course.subtitle}</p>` : ''}
                <div class="course-info">
                    <div class="info-item">
                        <span class="label">Duration:</span>
                        <span class="value">${course.duration || 'Flexible'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Difficulty:</span>
                        <span class="value ${course.difficulty_level || 'beginner'}">${course.difficulty_level || 'Beginner'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Instructor:</span>
                        <span class="value">${course.instructor_name || 'Expert Instructor'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Rating:</span>
                        <span class="value">★ ${course.rating || '0.0'} (${course.total_enrolled || 0} students)</span>
                    </div>
                </div>
                <div class="price-details">
                    <div class="original-price">Original Price: ₹${originalPrice.toFixed(2)}</div>
                    ${discount > 0 ? `<div class="discount-info">Discount: ${discount}% OFF</div>` : ''}
                    <div class="final-price" data-price="${finalPrice}">Final Price: ₹${finalPrice}</div>
                </div>
            </div>
        `;
    })
    .catch(error => {
        console.error('Error fetching course details:', error);
        document.getElementById('course-summary').innerHTML = '<p>Failed to load course details</p>';
    });
}

function calculateFinalPrice(price, discount) {
    const discountAmount = (price * discount) / 100;
    return (price - discountAmount).toFixed(2);
}

function getPaymentFields(method) {
    switch (method) {
        case 'card':
            return `
                <div class="form-group">
                    <input type="text" id="card-number" placeholder="Card Number" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <input type="text" id="expiry-date" placeholder="MM/YY" required>
                    </div>
                    <div class="form-group">
                        <input type="text" id="cvv" placeholder="CVV" required maxlength="3">
                    </div>
                </div>
            `;
        case 'upi':
            return `
                <div class="form-group">
                    <input type="text" id="upi-id" placeholder="Enter UPI ID" required>
                </div>
            `;
        case 'netbanking':
            return `
                <div class="form-group">
                    <select id="bank-select" required>
                        <option value="">Select Bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                    </select>
                </div>
            `;
        default:
            return '';
    }
} 