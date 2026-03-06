// Function to validate URL
function isValidURL(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

// Rate limiting
let lastRequestTime = 0;
const RATE_LIMIT_MS = 1000;

// Grade color helper
function gradeColor(grade) {
    const colors = { A: '#33ff00', B: '#aaff00', C: '#ffcc00', D: '#ff6600', F: '#ff3333' };
    return colors[grade] || '#33ff00';
}

// Status icon helper
function statusIcon(status) {
    const icons = { pass: '[PASS]', warn: '[WARN]', missing: '[FAIL]', 'optional-missing': '[----]' };
    return icons[status] || '[????]';
}

function statusColor(status) {
    const colors = { pass: '#33ff00', warn: '#ffcc00', missing: '#ff3333', 'optional-missing': 'rgba(51,255,0,0.4)' };
    return colors[status] || '#33ff00';
}

// Build a grade bar visualization
function gradeBar(score, grade) {
    const filled = Math.round(score / 5);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `<span style="color:${gradeColor(grade)}">[${bar}] ${score}/100 (${grade})</span>`;
}

// Render TLS results
function renderTLS(tls, container) {
    if (!tls) return;
    let html = '<pre>';
    html += `  Grade:   ${gradeBar(tls.score, tls.grade)}\n`;
    html += `  Version: <span style="color:${tls.version === 'TLSv1.3' ? '#33ff00' : tls.version === 'TLSv1.2' ? '#aaff00' : '#ff3333'}">${tls.version || 'N/A'}</span>\n`;
    html += `  Cipher:  ${tls.cipher || 'N/A'}\n`;
    html += `  Key:     ${tls.key_bits ? tls.key_bits + ' bits' : 'N/A'}\n`;
    if (tls.issues && tls.issues.length > 0) {
        html += '\n  <span style="color:#ff6600">Issues:</span>\n';
        tls.issues.forEach(issue => {
            html += `    <span style="color:#ff6600">⚠ ${escapeHTML(issue)}</span>\n`;
        });
    }
    html += '</pre>';
    container.innerHTML = html;
}

// Render Security Headers results
function renderHeaders(headers, container) {
    if (!headers) return;
    let html = '<pre>';
    html += `  Grade:   ${gradeBar(headers.score, headers.grade)}\n\n`;
    html += '  <span style="color:rgba(51,255,0,0.6)">Header                           Status  Details</span>\n';
    html += '  <span style="color:rgba(51,255,0,0.3)">─────────────────────────────────────────────────────────</span>\n';

    if (headers.headers) {
        for (const [name, info] of Object.entries(headers.headers)) {
            const icon = statusIcon(info.status);
            const color = statusColor(info.status);
            const shortName = name.length > 32 ? name.substring(0, 29) + '...' : name.padEnd(32);
            html += `  <span style="color:${color}">${shortName} ${icon}</span>`;
            if (info.value && info.status === 'pass') {
                html += ` <span style="color:rgba(51,255,0,0.5)">✓</span>`;
            }
            html += '\n';
            if (info.issues && info.issues.length > 0) {
                info.issues.forEach(issue => {
                    html += `    <span style="color:#ff6600">↳ ${escapeHTML(issue)}</span>\n`;
                });
            }
        }
    }

    if (headers.info_leakage && headers.info_leakage.length > 0) {
        html += '\n  <span style="color:#ff3333">Information Leakage:</span>\n';
        headers.info_leakage.forEach(leak => {
            html += `    <span style="color:#ff3333">✗ ${escapeHTML(leak.header)}: ${escapeHTML(leak.value)}</span>\n`;
            html += `      <span style="color:rgba(255,51,51,0.6)">↳ ${escapeHTML(leak.recommendation)}</span>\n`;
        });
    }

    html += '</pre>';
    container.innerHTML = html;
}

// Escape HTML to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

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

    if (!isValidURL(url)) {
        console.error('Invalid URL');
        alert("Invalid URL.");
        return;
    }

    const responseEl = document.getElementById('response');
    const tlsSection = document.getElementById('tls-section');
    const tlsResponse = document.getElementById('tls-response');
    const headersSection = document.getElementById('headers-section');
    const headersResponse = document.getElementById('headers-response');

    // Reset
    responseEl.textContent = 'Scanning target...';
    tlsSection.style.display = 'none';
    headersSection.style.display = 'none';
    tlsResponse.innerHTML = '';
    headersResponse.innerHTML = '';

    try {
        const response = await fetch("https://wafw00f.kscsc.online/api/trigger_waf_woof", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: url })
        });

        if (response.ok) {
            const data = await response.json();

            // WAF result
            const pre = document.createElement('pre');
            let output = '> Target:   ' + escapeHTML(data.target || url);
            output += '\n> Status:   ' + escapeHTML(data.status || 'unknown');
            if (data.solution) {
                output += '\n> Solution: ' + escapeHTML(String(data.solution));
            }
            pre.innerHTML = output;
            responseEl.textContent = '';
            responseEl.appendChild(pre);

            // TLS results
            if (data.tls) {
                tlsSection.style.display = '';
                renderTLS(data.tls, tlsResponse);
            }

            // Security headers results
            if (data.security_headers) {
                headersSection.style.display = '';
                renderHeaders(data.security_headers, headersResponse);
            }
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

// Allow Enter key to trigger scan
document.getElementById('field1').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') buttonClick();
});