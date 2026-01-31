// Fallback to replace blocked external embeds with safe local links/cards
document.addEventListener('DOMContentLoaded', () => {
    // Replace Credly badge placeholder divs with links to the badge page
    const credlyDivs = Array.from(document.querySelectorAll('div[data-share-badge-id]'));
    credlyDivs.forEach(div => {
        const id = div.getAttribute('data-share-badge-id');
        if (!id) return;
        const a = document.createElement('a');
        a.href = `https://www.credly.com/badges/${id}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'badge-fallback-link';
        a.textContent = 'View badge on Credly';
        // Replace the placeholder div with the link
        div.parentNode.replaceChild(a, div);
    });

    // Replace Accredible placeholders with links using their data-accredible-src
    const accrediblePlaceholders = Array.from(document.querySelectorAll('div.accredible-placeholder'));
    accrediblePlaceholders.forEach(div => {
        const src = div.getAttribute('data-accredible-src');
        if (!src) return;
        const link = document.createElement('a');
        link.href = src;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'badge-fallback-link';
        link.textContent = 'View badge on Accredible';
        div.parentNode.replaceChild(link, div);
    });
});
