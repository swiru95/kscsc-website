// Fallback to replace blocked external embeds with safe local links/cards
document.addEventListener('DOMContentLoaded', () => {
    // Wait a short time to give third-party embed scripts (Credly/Accredible) a chance to populate
    // If after the timeout a placeholder is still empty, replace it with a safe fallback.
    const FALLBACK_DELAY = 700; // ms

    const credlyDivs = Array.from(document.querySelectorAll('div[data-share-badge-id]'));
    credlyDivs.forEach(div => {
        const id = div.getAttribute('data-share-badge-id');
        if (!id) return;
        setTimeout(() => {
            // If Credly or other script already populated the element, skip the fallback
            if (div.querySelector('iframe, img') || div.childElementCount > 0) return;

            // Create a simple SVG-based badge image (data URL) so the card shows a visual
            function makeCredlySVGDataURL() {
                const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='360' height='540' viewBox='0 0 360 540'>\n  <rect width='100%' height='100%' rx='10' fill='%23ffffff'/>\n  <g transform='translate(30,40)'>\n    <rect width='300' height='420' rx='8' fill='%23ffffff' stroke='%23eee'/>\n    <circle cx='150' cy='150' r='80' fill='%23f6fbff' stroke='%23dfeefb'/>\n    <path d='M120 150l20 20 60-60' stroke='%232b7cff' stroke-width='10' stroke-linecap='round' stroke-linejoin='round' fill='none'/>\n    <text x='150' y='330' font-family='Arial, Helvetica, sans-serif' font-size='20' text-anchor='middle' fill='%23333'>Credly</text>\n  </g>\n</svg>`;
                return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
            }

            const img = document.createElement('img');
            img.src = makeCredlySVGDataURL();
            img.className = 'credly-badge';
            img.alt = 'Credly badge';

            const a = document.createElement('a');
            a.href = `https://www.credly.com/badges/${id}`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'badge-fallback-link';
            a.appendChild(img);
            // Replace the placeholder div with the link+image
            if (div.parentNode) div.parentNode.replaceChild(a, div);
        }, FALLBACK_DELAY);
    });

    const accrediblePlaceholders = Array.from(document.querySelectorAll('div.accredible-placeholder'));
    accrediblePlaceholders.forEach(div => {
        const src = div.getAttribute('data-accredible-src');
        if (!src) return;
        setTimeout(() => {
            // If accredible script already injected an image/iframe, skip
            if (div.querySelector('iframe, img') || div.childElementCount > 0) return;

            // Create an image element so the badge is visible inside the card
            const img = document.createElement('img');
            img.src = src;
            img.className = 'accredible-badge';
            img.alt = 'Accredible badge';
            // Wrap the image in a link to the original source
            const link = document.createElement('a');
            link.href = src;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'badge-fallback-link';
            link.appendChild(img);
            if (div.parentNode) div.parentNode.replaceChild(link, div);
        }, FALLBACK_DELAY);
    });
});
