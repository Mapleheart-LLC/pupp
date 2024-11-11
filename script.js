const buttonContainer = document.getElementById('button-container');
const baseWebhookUrl = 'https://trigger.macrodroid.com/834a628e-a605-4607-8ecf-d36b504db193';

// Password protection
const HASHED_PASSWORD = '0e60a6a9442fa12bba169f47326f995801e892f01dfa524467b2652969edaa60';
let isAuthenticated = false;

const buttonConfigs = [
    { text: 'Unlock', uri: '/god?order=unlock' },
    { text: 'Lock Phone', uri: '/god?order=lock' },
    { text: 'Open Anydesk', uri: '/god?order=ad' },
    { text: 'Close AD & Lock Phone', uri: '/god?order=closead' },
    { text: 'Lock apps', uri: '/god?order=lockapp' },
    { text: 'Unlock apps', uri: '/god?order=unlockapp' },
    { text: 'Shutdown Phone', uri: '/god?order=shutdown' },
    { text: 'Clicker', uri: '/god?order=click' },
    { text: '[placeholder for shock]', uri: '/god?order=zap' },
    { text: 'Open a webpage', uri: '/god?url=' },
    { text: 'Launch Home screen', uri: '/god?order=home' },
    { text: 'Back Button', uri: '/god?order=back' },
    { text: 'Volume Control', uri: '/god?vol=' },
];

// Password hashing function
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function checkPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    
    try {
        const hashedInput = await hashPassword(passwordInput.value);
        
        if (hashedInput === HASHED_PASSWORD) {
            isAuthenticated = true;
            document.getElementById('loginOverlay').style.display = 'none';
            createButtons();
            updateGridLayout();
        } else {
            loginError.textContent = 'Incorrect password';
            loginError.style.display = 'block';
            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('Error hashing password:', error);
        loginError.textContent = 'An error occurred';
        loginError.style.display = 'block';
    }
    
    passwordInput.value = '';
}

function createButtons() {
    if (!isAuthenticated) return;
    
    buttonContainer.innerHTML = '';
    buttonContainer.style.display = 'grid';
    
    buttonConfigs.forEach((config, index) => {
        const button = document.createElement('button');
        button.className = 'button';
        
        if (config.text === '[placeholder for shock]') {
            button.classList.add('red-button');
        }
        
        button.textContent = config.text;
        button.addEventListener('click', () => {
            if (config.text === 'Open a webpage') {
                showModal('webpageModal');
            } else if (config.text === 'Volume Control') {
                showModal('volumeModal');
            } else if (config.text === 'Shutdown Phone') {
                showModal('shutdownModal');
            } else {
                sendWebhook(index);
            }
        });
        buttonContainer.appendChild(button);
    });
}

function updateGridLayout() {
    if (!isAuthenticated) return;
    
    const containerWidth = buttonContainer.clientWidth;
    const containerHeight = buttonContainer.clientHeight;
    const aspectRatio = containerWidth / containerHeight;
    const buttonCount = buttonConfigs.length;
    let columns, rows;

    if (aspectRatio > 1) {
        columns = Math.ceil(Math.sqrt(buttonCount * aspectRatio));
        rows = Math.ceil(buttonCount / columns);
    } else {
        rows = Math.ceil(Math.sqrt(buttonCount / aspectRatio));
        columns = Math.ceil(buttonCount / rows);
    }

    buttonContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    buttonContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
}

function sendWebhook(buttonIndex, customUri = null) {
    if (!isAuthenticated) return;
    
    const config = buttonConfigs[buttonIndex];
    let fullWebhookUrl = `${baseWebhookUrl}${config.uri}`;
    if (customUri) {
        fullWebhookUrl = customUri;
    }
    const data = { button: config.text, timestamp: new Date().toISOString() };

    console.log(`Attempting to send webhook to: ${fullWebhookUrl}`);

    fetch(fullWebhookUrl, {
        method: 'GET',
    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        return response.text();
    })
    .then(data => {
        console.log(`Webhook sent successfully to ${fullWebhookUrl}. Response:`, data);
    })
    .catch((error) => {
        console.error(`Error sending webhook to ${fullWebhookUrl}:`, error);
    });
}

function showModal(modalId) {
    if (!isAuthenticated) return;
    
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    if (modalId === 'volumeModal') {
        document.getElementById('volumeSlider').focus();
    } else if (modalId === 'webpageModal') {
        document.getElementById('webpageInput').focus();
        hideErrorMessage();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

function isValidUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

async function checkWebsiteExists(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        return true;
    } catch (error) {
        console.error('Error checking website:', error);
        return false;
    }
}

function showErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideErrorMessage() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
}

async function submitWebpage() {
    if (!isAuthenticated) return;
    
    const input = document.getElementById('webpageInput');
    let url = input.value.trim();
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    if (url) {
        if (!isValidUrl(url)) {
            showErrorMessage('Please enter a valid URL');
            setTimeout(hideErrorMessage, 5000);
            return;
        }

        const websiteExists = await checkWebsiteExists(url);
        if (!websiteExists) {
            showErrorMessage('Unable to reach the website. Please check the URL and try again.');
            return;
        }

        hideErrorMessage();
        const fullWebhookUrl = `${baseWebhookUrl}/link?link=${encodeURIComponent(url)}`;
        sendWebhook(buttonConfigs.findIndex(config => config.text === 'Open a webpage'), fullWebhookUrl);
        closeModal('webpageModal');
        input.value = '';
    }
}

function submitVolume() {
    if (!isAuthenticated) return;
    
    const slider = document.getElementById('volumeSlider');
    const volume = slider.value;
    const fullWebhookUrl = `${baseWebhookUrl}/volume?level=${encodeURIComponent(volume)}`;
    sendWebhook(buttonConfigs.findIndex(config => config.text === 'Volume Control'), fullWebhookUrl);
    closeModal('volumeModal');
}

function shutdownConfirmed() {
    sendWebhook(buttonConfigs.findIndex(config => config.text === 'Shutdown Phone'));
    closeModal('shutdownModal');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    passwordInput.addEventListener('keyup', async (event) => {
        if (event.key === 'Enter') {
            await checkPassword();
        }
    });
    
    // Hide the button container initially
    buttonContainer.style.display = 'none';
});

document.getElementById('submitButton').addEventListener('click', submitWebpage);
document.getElementById('cancelButton').addEventListener('click', () => closeModal('webpageModal'));
document.getElementById('webpageInput').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        submitWebpage();
    }
});

document.getElementById('volumeSubmitButton').addEventListener('click', submitVolume);
document.getElementById('volumeCancelButton').addEventListener('click', () => closeModal('volumeModal'));

document.getElementById('shutdownButton').addEventListener('click', shutdownConfirmed);
document.getElementById('shutdownCancel').addEventListener('click', () => closeModal('shutdownModal'));

const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

volumeSlider.addEventListener('input', function() {
    volumeValue.textContent = this.value;
});

// Initialize the layout (but don't create buttons until authenticated)
window.addEventListener('resize', updateGridLayout);