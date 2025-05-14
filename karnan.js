// Enhanced user authentication functionality with page refresh and username preservation
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  checkLoggedInStatus();
  
  // Initialize the application
  initApp();
});

function initApp() {
  // Add event listeners to all forms
  addFormListeners();
  
  // Add scroll event listener for navbar
  window.addEventListener('scroll', handleScroll);
  
  // Initialize Google Sign-In if available
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    initGoogleSignIn();
  } else {
    console.log("Google Sign-In API not loaded or not fully initialized");
    // Try initializing again after a short delay to allow scripts to load
    setTimeout(() => {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        initGoogleSignIn();
      } else {
        console.warn("Google Sign-In API could not be loaded");
      }
    }, 2000);
  }
}

// Add event listeners to all forms
function addFormListeners() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
  });
}

// Check if user is already logged in
function checkLoggedInStatus() {
  const currentUser = localStorage.getItem('currentUser');

  if (currentUser) {
    // Parse the user data
    const user = JSON.parse(currentUser);
    
    // Update UI for logged-in user
    updateLoggedInUI(user);
    
    // Show welcome message
    showWelcomeMessage(user.name);
  }
}

// Show welcome message for returning users
function showWelcomeMessage(name) {
  // Only show welcome message if they haven't just logged in (page wasn't just refreshed after login)
  if (!sessionStorage.getItem('justLoggedIn')) {
    showSuccessAlert(`Welcome back, ${name}!`);
  }
  // Clear the session flag
  sessionStorage.removeItem('justLoggedIn');
}

// Update UI for logged-in user
function updateLoggedInUI(user) {
  // Update navigation
  const authButtons = document.querySelector('.auth-buttons');

  if (authButtons) {
    authButtons.innerHTML = `
      <div class="user-profile-menu">
        <img src="${user.picture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" alt="${user.name}" class="user-avatar">
        <span>${user.name}</span>
        <div class="user-dropdown">
          <a href="#dashboard" onclick="showDashboard()">Dashboard</a>
          <a href="#profile" onclick="showProfile()">Profile</a>
          <a href="#" onclick="signOut()">Sign Out</a>
        </div>
      </div>
    `;
    
    // Add event listener to show dropdown on click
    const userProfile = document.querySelector('.user-profile-menu');
    if (userProfile) {
      userProfile.addEventListener('click', function(e) {
        const dropdown = this.querySelector('.user-dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        e.stopPropagation();
      });
      
      // Close dropdown when clicking elsewhere
      document.addEventListener('click', function() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) dropdown.style.display = 'none';
      });
    }
  }
  
  // If we have the username element in dashboard, update it
  const userNameElement = document.getElementById('userName');
  if (userNameElement) {
    userNameElement.textContent = user.name;
  }
}

// Handle form submissions
function handleFormSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const formId = form.id;
  
  // Handle different form submissions
  if (formId === 'loginForm') {
    handleLoginForm(form);
  } 
  else if (formId === 'registerForm') {
    handleRegisterForm(form);
  }
  else {
    // Handle other form submissions (existing code)
    console.log(`Form ${formId} submitted`);
    
    if (formId === 'donationForm') {
      handleDonationForm(form);
    } else if (formId === 'ngoForm') {
      showSuccessAlert('Thank you for your interest in partnering with us! Our team will review your application and contact you within 48 hours.');
      form.reset();
    } else if (form.classList.contains('contact-form')) {
      showSuccessAlert('Thank you for your message! We will get back to you soon.');
      form.reset();
    } else if (form.classList.contains('newsletter-form')) {
      showSuccessAlert('Thank you for subscribing to our newsletter!');
      form.reset();
    }
  }
}

// Handle login form submission
function handleLoginForm(form) {
  // Get form values
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  // Validate email format
  if (!validateEmail(email)) {
    showErrorAlert('Please enter a valid email address');
    return;
  }
  
  // Simple validation
  if (!email || !password) {
    showErrorAlert('Please fill in all fields');
    return;
  }
  
  // In a real app, you would verify credentials with a server
  // For this demo, we'll check if the user exists in localStorage
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email);
  
  if (user) {
    // In a real app, you would verify the password hash
    // For demo purposes, we'll just log the user in
    
    // Store the logged-in user
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Set a flag to indicate we just logged in (to handle page refresh)
    sessionStorage.setItem('justLoggedIn', 'true');
    
    // Close modal
    closeModal('loginModal');
    
    // Show success message
    showSuccessAlert('Login successful!');
    
    // Refresh the page to apply changes site-wide
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    // User doesn't exist
    showErrorAlert('Invalid email or password');
  }
}

// Handle register form submission
function handleRegisterForm(form) {
  // Get form values
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const phone = document.getElementById('registerPhone').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const userType = document.getElementById('registerType').value;
  
  // Validate email format
  if (!validateEmail(email)) {
    showErrorAlert('Please enter a valid email address');
    return;
  }
  
  // Validate phone number
  if (phone && !validatePhone(phone)) {
    showErrorAlert('Please enter a valid phone number');
    return;
  }
  
  // Simple validation
  if (!name || !email || !password) {
    showErrorAlert('Please fill in all required fields');
    return;
  }
  
  if (password !== confirmPassword) {
    showErrorAlert('Passwords do not match');
    return;
  }
  
  // Validate password strength
  if (!validatePasswordStrength(password)) {
    showErrorAlert('Password must be at least 8 characters and include a number');
    return;
  }
  
  // Create new user object
  const newUser = {
    name: name,
    email: email,
    phone: phone,
    userType: userType,
    picture: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    registeredDate: new Date().toISOString()
  };
  
  // Get existing users or initialize empty array
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Check if email already exists
  if (users.some(user => user.email === email)) {
    showErrorAlert('An account with this email already exists');
    return;
  }
  
  // In a real app, you would hash the password before storing
  // For this demo, we'll just add the user
  
  // Add new user to users array
  users.push(newUser);
  
  // Save updated users array
  localStorage.setItem('users', JSON.stringify(users));
  
  // Set as current user
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  
  // Set a flag to indicate we just registered
  sessionStorage.setItem('justLoggedIn', 'true');
  
  // Create initial donation history for the user
  createInitialUserData(newUser);
  
  // Close modal
  closeModal('registerModal');
  
  // Show success message
  showSuccessAlert('Registration successful! Welcome to KARNAN.');
  
  // Refresh the page
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Handle donation form submission
function handleDonationForm(form) {
  // Get the current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // Create tracking ID
  const trackingId = `K${Math.floor(10000 + Math.random() * 90000)}`;
  
  if (currentUser.email) {
    // Save donation to user's history
    saveDonationToHistory(currentUser.email, trackingId);
  }
  
  showSuccessAlert('Thank you for your donation! We will contact you shortly to arrange pickup.');
  alert(`Your donation has been registered! Your tracking ID is: ${trackingId}`);
  form.reset();
}

// Email validation function
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation function
function validatePhone(phone) {
  // Basic validation - adjust regex for your specific requirements
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// Password strength validation
function validatePasswordStrength(password) {
  // Require at least 8 characters and at least one number
  return password.length >= 8 && /\d/.test(password);
}

// Save donation to user's history
function saveDonationToHistory(email, trackingId) {
  // Get existing donations or initialize
  const donationKey = `donations_${email}`;
  const donations = JSON.parse(localStorage.getItem(donationKey) || '[]');
  
  // Create new donation object
  const newDonation = {
    id: trackingId,
    date: new Date().toLocaleDateString(),
    foodType: document.getElementById('foodType').value || 'Cooked Meals',
    quantity: document.getElementById('quantity').value || '1 meal',
    recipient: 'Pending Assignment',
    status: 'Processing'
  };
  
  // Add to donations array
  donations.unshift(newDonation); // Add at beginning of array
  
  // Save updated donations
  localStorage.setItem(donationKey, JSON.stringify(donations));
}

// Create initial data for new users
function createInitialUserData(user) {
  // Create empty donation history
  localStorage.setItem(`donations_${user.email}`, JSON.stringify([]));
  
  // Add other initial data as needed
  if (user.userType === 'ngo') {
    // Create initial NGO data
    localStorage.setItem(`ngo_profile_${user.email}`, JSON.stringify({
      verified: false,
      serviceAreas: [],
      capacity: 0,
      joinDate: new Date().toISOString()
    }));
  }
}

// Show dashboard function
function showDashboard() {
  // Get the dashboard section
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;
  
  // Make dashboard visible
  dashboard.style.display = 'block';
  
  // Scroll to dashboard
  dashboard.scrollIntoView({ behavior: 'smooth' });
  
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.email) return;
  
  // Get user's donations
  const donations = JSON.parse(localStorage.getItem(`donations_${currentUser.email}`) || '[]');
  
  // Update dashboard content
  const tableBody = dashboard.querySelector('.donation-list tbody');
  if (tableBody) {
    // Clear existing content
    tableBody.innerHTML = '';
    
    if (donations.length === 0) {
      // Show empty state
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 30px;">
            <i class="fas fa-box-open" style="font-size: 48px; color: #ccc; display: block; margin-bottom: 10px;"></i>
            <p>You haven't made any donations yet.</p>
            <button class="btn btn-primary" onclick="toggleSection('donateSection')">Make Your First Donation</button>
          </td>
        </tr>
      `;
    } else {
      // Populate table with donations
      donations.forEach(donation => {
        const statusClass = 
          donation.status === 'Delivered' ? 'status-delivered' : 
          donation.status === 'In Transit' ? 'status-intransit' : 'status-pending';
        
        tableBody.innerHTML += `
          <tr>
            <td>#${donation.id}</td>
            <td>${donation.date}</td>
            <td>${donation.foodType}</td>
            <td>${donation.quantity}</td>
            <td>${donation.recipient}</td>
            <td><span class="${statusClass}">${donation.status}</span></td>
            <td><a href="#" class="action-link" onclick="showDonationDetails('${donation.id}')">Track</a></td>
          </tr>
        `;
      });
    }
  }
}

// Show donation details
function showDonationDetails(donationId) {
  // In a real app, this would fetch details from server
  // For demo, show the tracking section
  document.getElementById('trackingId').value = donationId;
  document.getElementById('trackSection').scrollIntoView({ behavior: 'smooth' });
  trackDonation();
}

// Show user profile function
function showProfile() {
  // This would show the user profile page in a real app
  alert('Profile page would be shown here. This feature is coming soon!');
}

// Sign out function
function signOut() {
  // Remove current user from local storage
  localStorage.removeItem('currentUser');
  
  // Set flag to avoid welcome message on next load
  sessionStorage.setItem('justSignedOut', 'true');
  
  // Show success message
  showSuccessAlert('You have been signed out successfully!');
  
  // Refresh the page
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Initialize Google Sign-In
function initGoogleSignIn() {
  try {
    // Check if Google Sign-In API is available
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      // Initialize the Google Sign-In API with your client ID
      google.accounts.id.initialize({
        client_id: '987794861299-l6jt7l7knmd8hel28obfli9j3cou3egq.apps.googleusercontent.com',
        callback: handleGoogleSignIn,
        auto_select: false, // Don't automatically select the first account
        cancel_on_tap_outside: true // Close the popup when clicking outside
      });

      // Set up the login button
      const loginBtn = document.getElementById('googleLoginBtn');
      if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
          e.preventDefault();
          // Display the Google One Tap UI
          google.accounts.id.prompt();
        });
      }
      
      // Set up the register button
      const registerBtn = document.getElementById('googleRegisterBtn');
      if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
          e.preventDefault();
          // Display the Google One Tap UI
          google.accounts.id.prompt();
        });
      }
      
      console.log("Google Sign-In initialized successfully");
    } else {
      console.error("Google Sign-In API not fully loaded");
      setupGoogleButtonFallbacks();
    }
  } catch (error) {
    console.error("Error initializing Google Sign-In:", error);
    setupGoogleButtonFallbacks();
  }
}

// Set up fallbacks for Google Sign-In buttons
function setupGoogleButtonFallbacks() {
  const setupGoogleButtonFallback = (buttonId) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', function() {
        showErrorAlert('Google Sign-In could not be loaded. Please try again later or use email registration.');
      });
    }
  };
  
  setupGoogleButtonFallback('googleLoginBtn');
  setupGoogleButtonFallback('googleRegisterBtn');
}

// Handle the Google Sign-In response
function handleGoogleSignIn(response) {
  try {
    // Decode the JWT token to get user info
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const googleUser = JSON.parse(jsonPayload);
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.email === googleUser.email);
    
    if (!user) {
      // Create new user
      user = {
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        userType: 'donor', // Default type
        isGoogleUser: true,
        registeredDate: new Date().toISOString()
      };
      
      // Add to users array
      users.push(user);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Create initial user data
      createInitialUserData(user);
      
      showSuccessAlert('Account created successfully with Google!');
    } else {
      showSuccessAlert('Welcome back!');
    }
    
    // Store as current user
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Set flag for just logged in
    sessionStorage.setItem('justLoggedIn', 'true');
    
    // Close any open modals
    closeModal('loginModal');
    closeModal('registerModal');
    
    // Refresh the page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('Error processing Google Sign-In:', error);
    showErrorAlert('There was an error signing in with Google. Please try again.');
  }
}

// Track donation function - for the tracking feature
function trackDonation() {
  const trackingId = document.getElementById('trackingId').value;
  
  if (!trackingId) {
    showErrorAlert('Please enter a tracking ID');
    return;
  }
  
  // In a real app, this would fetch data from a server
  // For demo, just show the tracking result section
  document.getElementById('trackingResult').style.display = 'block';
  
  // Update tracking details with the ID
  // Fix for the jQuery-like selector that won't work in vanilla JS
  const donationDetails = document.querySelector('.donation-details');
  if (donationDetails) {
    const donationIdElement = donationDetails.querySelector('p:first-child');
    if (donationIdElement) {
      donationIdElement.innerHTML = `<strong>Donation ID:</strong> #${trackingId}`;
    }
  }
}

// Toggle section visibility - use for donation, join, track sections
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    // Hide all form sections first
    document.querySelectorAll('.form-section').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show the selected section
    section.style.display = 'block';
    
    // Scroll to the section
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

// Select donor type
function selectDonorType(element, type) {
  // Remove active class from all donor types
  document.querySelectorAll('.donor-type').forEach(el => {
    el.classList.remove('active');
  });
  
  // Add active class to selected donor type
  element.classList.add('active');
  
  // You could customize the form based on donor type here
  console.log(`Selected donor type: ${type}`);
}

// Show success alert
function showSuccessAlert(message) {
  // Create alert element
  const alertDiv = document.createElement('div');
  alertDiv.classList.add('alert-success');
  alertDiv.innerHTML = `
    <div class="alert-content">
      <i class="fas fa-check-circle"></i>
      <p>${message}</p>
      <button onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Add the alert to the DOM
  document.body.appendChild(alertDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Show error alert
function showErrorAlert(message) {
  const alertDiv = document.createElement('div');
  alertDiv.classList.add('alert-error');
  alertDiv.innerHTML = `
    <div class="alert-content">
      <i class="fas fa-exclamation-circle"></i>
      <p>${message}</p>
      <button onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Close modal by ID
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Open modal by ID
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

// Handle scroll for navbar styling
function handleScroll() {
  const nav = document.querySelector('nav');
  if (nav) {
    if (window.scrollY > 100) {
      nav.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
      nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
    } else {
      nav.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      nav.style.boxShadow = '0 2px 15px rgba(0,0,0,0.1)';
    }
  }
}