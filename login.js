// Authorized users and shared password (in a real application, this should be in a secure backend)
const AUTHORIZED_USERS = [
    // Add or remove names here
    // Format: 'username',
    'ali', 
    'khalifa',     // First user
    'muaath',   // Second user
    'salim',     // Third user
    'malik',    // Fourth user
    'omar'      // Last user (no comma after the last name)
];

// Map usernames to full Arabic names
const USER_FULL_NAMES = {
    'ali': 'علي الغداني',
    'khalifa': ' خليفةالغداني',
    'muaath': 'معاذ الغداني',
    'salim': 'سالم العامري',
    'malik': 'مالك الغداني',
    'omar': 'عمر المنوري'
};

// Shared password: Abs@2024#System
const SHARED_PASSWORD = 'Abs@2024#System';

// Function to validate credentials
function validateCredentials(username, password) {
    return AUTHORIZED_USERS.includes(username.toLowerCase().trim()) && 
           password === SHARED_PASSWORD;
}

// Check if user is already logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn) {
        window.location.href = 'abs.html';
    }
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.toLowerCase().trim();
    const password = document.getElementById('password').value;
    
    // Check if username is in authorized list
    if (!AUTHORIZED_USERS.includes(username)) {
        showError('اسم المستخدم غير مصرح له بالدخول');
        return;
    }
    
    // Validate credentials
    if (validateCredentials(username, password)) {
        // Successful login
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('fullName', USER_FULL_NAMES[username]); // Store full name
        window.location.href = 'abs.html';
    } else {
        showError('كلمة المرور غير صحيحة');
    }
});

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide error after 3 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

// Add password visibility toggle
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
});

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', checkAuth); 