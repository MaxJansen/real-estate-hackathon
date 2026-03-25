// API Configuration
// The backend server handles all API communication securely
const API_KEY = localStorage.getItem('claudeApiKey'); // Will be set by user on first load

// DOM Elements
const addressInput = document.getElementById('address-input');
const landingPage = document.getElementById('landing-page');
const resultsPage = document.getElementById('results-page');
const backButton = document.getElementById('back-button');
const resultsContent = document.getElementById('results-content');
const resultAddress = document.getElementById('result-address');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessage = document.getElementById('error-message');
const errorRetryButton = document.getElementById('error-retry');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Request API key if not stored
    if (!API_KEY) {
        const key = prompt('Please enter your Claude API key:\n\n(You can get this from https://console.anthropic.com/)');
        if (key) {
            localStorage.setItem('claudeApiKey', key);
        } else {
            alert('API key is required to use this application.');
            return;
        }
    }

    // Event listeners
    addressInput.addEventListener('keypress', handleAddressSubmit);
    backButton.addEventListener('click', goBackToLanding);
    errorRetryButton.addEventListener('click', goBackToLanding);
});

/**
 * Handle address input submission
 */
async function handleAddressSubmit(event) {
    if (event.key !== 'Enter') return;

    const address = addressInput.value.trim();
    if (!address) {
        alert('Please enter an address');
        return;
    }

    // Switch to results page
    goToResultsPage();
    resultAddress.textContent = address;

    // Show loading state
    showLoading();

    try {
        // Call Claude API
        const response = await fetchRealEstateData(address);
        displayResults(response);
    } catch (error) {
        displayError(error.message);
    }
}

/**
 * Fetch real estate data from local backend
 */
async function fetchRealEstateData(address) {
    const apiKey = localStorage.getItem('claudeApiKey');

    if (!apiKey) {
        throw new Error('API key not found. Please refresh and provide your Claude API key.');
    }

    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            address: address,
            apiKey: apiKey,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze address');
    }

    const data = await response.json();
    return data.result;
}

/**
 * Display results on the page
 */
function displayResults(content) {
    hideLoading();
    hideError();
    resultsContent.style.display = 'block';
    resultsContent.innerHTML = `<p>${escapeHtml(content)}</p>`;
}

/**
 * Display error message
 */
function displayError(message) {
    hideLoading();
    resultsContent.style.display = 'none';
    errorDiv.style.display = 'block';
    errorMessage.textContent = `Error: ${message}`;
}

/**
 * Show loading state
 */
function showLoading() {
    loadingDiv.style.display = 'flex';
    resultsContent.style.display = 'none';
    errorDiv.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingDiv.style.display = 'none';
}

/**
 * Hide error state
 */
function hideError() {
    errorDiv.style.display = 'none';
}

/**
 * Switch to results page
 */
function goToResultsPage() {
    landingPage.classList.remove('active');
    resultsPage.classList.add('active');
}

/**
 * Go back to landing page
 */
function goBackToLanding() {
    resultsPage.classList.remove('active');
    landingPage.classList.add('active');
    addressInput.value = '';
    resultsContent.innerHTML = '';
    hideLoading();
    hideError();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
