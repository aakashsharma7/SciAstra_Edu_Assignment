document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
        fetch(`http://localhost:5001/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(order => {
            document.getElementById('order-details').innerHTML = `
                <div class="order-info">
                    <p>Order ID: #${order.id}</p>
                    <p>Course: ${order.course_title}</p>
                    <p>Amount Paid: ₹${order.amount}</p>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error fetching order details:', error);
        });
    }
}); 