// Real Estate Widget - Embeddable JavaScript for address lookup
class RealEstateWidget {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/.netlify/functions/analyze';
        this.addressInput = document.getElementById('address-input');
        this.resultsDiv = document.getElementById('results');
        this.init();
    }

    init() {
        if (!this.addressInput) return;
        this.addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSubmit();
        });
        this.resultsDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('reset-btn')) this.reset();
        });
    }

    async handleSubmit() {
        const address = this.addressInput.value.trim();
        if (!address) { alert('Please enter an address'); return; }

        let apiKey = localStorage.getItem('claudeApiKey');
        if (!apiKey) {
            apiKey = prompt('Claude API key:\n\n(Get it from https://console.anthropic.com/)');
            if (!apiKey) { alert('API key required'); return; }
            localStorage.setItem('claudeApiKey', apiKey);
        }

        this.resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Analyzing...</p></div>';

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, apiKey })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }
            const data = await response.json();
            this.displayResults(address, data.result);
        } catch (error) {
            this.displayError(error.message);
        }
    }

    displayResults(address, content) {
        this.resultsDiv.innerHTML = `<div class="results-container"><p class="address-label"><strong>Address:</strong> ${this.escapeHtml(address)}</p><div class="analysis"><p>${this.escapeHtml(content)}</p></div><button class="reset-btn">← New Search</button></div>`;
    }

    displayError(message) {
        this.resultsDiv.innerHTML = `<div class="error"><p><strong>Error:</strong> ${this.escapeHtml(message)}</p><button class="reset-btn">Try Again</button></div>`;
    }

    reset() {
        this.addressInput.value = '';
        this.resultsDiv.innerHTML = '';
        this.addressInput.focus();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => { new RealEstateWidget(); });
