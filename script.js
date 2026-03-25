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
    document.getElementById('search-btn').addEventListener('click', () => triggerSearch());
    backButton.addEventListener('click', goBackToLanding);
    errorRetryButton.addEventListener('click', goBackToLanding);
});

/**
 * Handle address input submission
 */
async function handleAddressSubmit(event) {
    if (event.key !== 'Enter') return;
    triggerSearch();
}

async function triggerSearch() {
    const address = addressInput.value.trim();
    if (!address) return;

    goToResultsPage();
    resultAddress.textContent = address;
    showLoading();

    const apiKey = localStorage.getItem('claudeApiKey');
    if (!apiKey) {
        displayError('API key not found. Please refresh and provide your Claude API key.');
        return;
    }

    // 1. Show map immediately
    const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=16`;
    hideLoading();
    hideError();
    resultsContent.style.display = 'block';
    resultsContent.innerHTML = `<iframe class="map-embed" src="${mapSrc}" allowfullscreen loading="lazy"></iframe>`;

    // 2. Add monospace pre below the map for streaming
    const pre = document.createElement('pre');
    pre.className = 'stream-output';
    resultsContent.appendChild(pre);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, apiKey }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) { displayError(parsed.error); return; }
                    if (parsed.text) {
                        fullText += parsed.text;
                        pre.textContent = fullText;
                        pre.scrollIntoView({ block: 'end', behavior: 'smooth' });
                    }
                } catch (_) {}
            }
        }

        // 3. Stream done — replace the <pre> with Garamond-rendered output
        pre.remove();
        renderFinalOutput(resultsContent, fullText);
    } catch (error) {
        displayError(error.message);
    }
}

function renderFinalOutput(container, text) {
    const sections = [];
    let currentHeader = null;
    let currentLines = [];

    for (const line of text.split('\n')) {
        if (/^[A-Z][A-Z\s]+·/.test(line)) {
            if (currentHeader !== null) {
                sections.push({ header: currentHeader, body: currentLines.join('\n').trim() });
            }
            currentHeader = line;
            currentLines = [];
        } else if (/\d+ data sources queried/.test(line)) {
            if (currentHeader !== null) {
                sections.push({ header: currentHeader, body: currentLines.join('\n').trim() });
                currentHeader = null;
                currentLines = [];
            }
            sections.push({ footer: line });
        } else {
            currentLines.push(line);
        }
    }
    if (currentHeader !== null) {
        sections.push({ header: currentHeader, body: currentLines.join('\n').trim() });
    }

    const wrap = document.createElement('div');
    wrap.className = 'final-output';

    for (const s of sections) {
        if (s.footer) {
            const footer = document.createElement('div');
            footer.className = 'final-footer';
            footer.textContent = s.footer;
            wrap.appendChild(footer);
        } else {
            const section = document.createElement('div');
            section.className = 'final-section';
            const header = document.createElement('div');
            header.className = 'final-section-header';
            header.textContent = s.header;
            const body = document.createElement('div');
            body.className = 'final-section-body';
            body.textContent = s.body;
            section.appendChild(header);
            section.appendChild(body);
            wrap.appendChild(section);
        }
    }

    container.appendChild(wrap);
    container.scrollIntoView({ block: 'start', behavior: 'smooth' });
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
