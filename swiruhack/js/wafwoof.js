// Function to validate URL
function isValidURL(string) {
    try {
        const url = new URL(string);
        // Dodać dodatkowe sprawdzenie protokołu
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

// Dodać rate limiting na froncie
let lastRequestTime = 0;
const RATE_LIMIT_MS = 1000; // 1 sekunda między requestami

// Function to handle button click
async function buttonClick() {
    const now = Date.now();
    if (now - lastRequestTime < RATE_LIMIT_MS) {
        alert("Please wait before making another request");
        return;
    }
    lastRequestTime = now;
    const textBox = document.getElementById('field1');
    const url = textBox.value;

    // Check if URL is valid
    if (!isValidURL(url)) {
        console.error('Invalid URL');
        alert("Invalid URL.")
        return;
    }

    // Show loading state
    const responseEl = document.getElementById('response');
    responseEl.textContent = 'Checking WAF...';

    try {
        // Send POST request
        const response = await fetch("https://wafw00f.kscsc.online/api/trigger_waf_woof", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ target: url })
        });
        // Print response
        if (response.ok) {
            const data = await response.json();
            // Use textContent to prevent XSS
            const pre = document.createElement('pre');
            var output = '> Target: ' + (data.target || url);
            output += '\n> Status: ' + (data.status || 'No WAF detected');
            if (data.solution) {
                output += '\n> Solution: ' + data.solution;
            }
            pre.textContent = output;
            responseEl.textContent = '';
            responseEl.appendChild(pre);
        } else {
            responseEl.textContent = 'HTTP-Error: ' + response.status;
            console.error('HTTP-Error: ' + response.status);
        }
    } catch (error) {
        responseEl.textContent = 'Network error - service may be unavailable.';
        console.error('Fetch error:', error);
    }
}

// Add event listener to button
const myButton = document.getElementById('button1');
myButton.addEventListener('click', buttonClick);