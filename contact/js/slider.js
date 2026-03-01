document.addEventListener('DOMContentLoaded', () => {
    // Service Slider
    const serviceSlider = document.querySelector('.service-slider');
    const services = Array.from(serviceSlider.querySelectorAll('.service-box'));
    const serviceSliderContainer = document.querySelector('.service-slider-container');
    let serviceCurrentIndex = 1; // Start with the first real slide

    const serviceFirstClone = services[0].cloneNode(true);
    const serviceLastClone = services[services.length - 1].cloneNode(true);
    serviceSlider.appendChild(serviceFirstClone);
    serviceSlider.insertBefore(serviceLastClone, services[0]);

    const allServices = Array.from(serviceSlider.querySelectorAll('.service-box'));

    function getServiceCenterOffset(index) {
        const containerWidth = serviceSliderContainer.offsetWidth;
        const targetService = allServices[index];
        if (!targetService) return 0;
        const targetServiceWidth = targetService.offsetWidth;
        const targetServiceLeft = targetService.offsetLeft;
        return (containerWidth / 2) - targetServiceLeft - (targetServiceWidth / 2);
    }

    function setServicePosition(index, smooth = true) {
        if (smooth) {
            serviceSlider.style.transition = 'transform 0.5s ease-in-out';
        } else {
            serviceSlider.style.transition = 'none';
        }
        const offset = getServiceCenterOffset(index);
        serviceSlider.style.transform = `translateX(${offset}px)`;
    }

    function nextServiceSlide() {
        serviceCurrentIndex++;
        setServicePosition(serviceCurrentIndex);
    }

    serviceSlider.addEventListener('transitionend', () => {
        if (serviceCurrentIndex === allServices.length - 1) {
            serviceCurrentIndex = 1;
            setServicePosition(serviceCurrentIndex, false);
        }
    });

    let serviceInterval;
    function startServiceSlider() {
        serviceInterval = setInterval(nextServiceSlide, 3000);
    }

    setTimeout(() => {
        setServicePosition(serviceCurrentIndex, false);
        startServiceSlider();
    }, 100);

    // Pause service slider on hover
    serviceSliderContainer.addEventListener('mouseenter', () => {
        clearInterval(serviceInterval);
    });
    serviceSliderContainer.addEventListener('mouseleave', () => {
        startServiceSlider();
    });

    // Logo / Collab Slider
    const logoSlider = document.querySelector('.logo-slider');
    const container = document.querySelector('.logo-slider-container');
    if (logoSlider && container) {
        const cards = Array.from(logoSlider.querySelectorAll('.collab-card'));
        const imgs = Array.from(logoSlider.querySelectorAll('img'));

        // Wait for all images inside cards to load before measuring widths
        const loadPromises = imgs.map(img => {
            return new Promise(resolve => {
                if (img.complete && img.naturalWidth !== 0) return resolve();
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve);
            });
        });

        Promise.all(loadPromises).then(() => {
            if (cards.length === 0) return;

            const originalWidth = logoSlider.scrollWidth;
            if (originalWidth === 0) return;
            const containerWidth = container.offsetWidth;

            // Clone full .collab-card elements (not bare <img>s) if we need more width
            let numCopies = 1;
            while (logoSlider.scrollWidth < containerWidth * 2) {
                cards.forEach(card => logoSlider.appendChild(card.cloneNode(true)));
                numCopies++;
            }

            if (numCopies % 2 !== 0) {
                cards.forEach(card => logoSlider.appendChild(card.cloneNode(true)));
                numCopies++;
            }

            // Set animation duration proportional to content width for constant speed
            const speedPxPerSec = 100; // lower → slower
            const distance = logoSlider.scrollWidth / 2;
            const duration = Math.max(10, Math.round(distance / speedPxPerSec));
            logoSlider.style.animationDuration = duration + 's';
        });
    }

    // Badge Slider
    const badgeSlider = document.querySelector('.badge-slider');
    const badgeContainer = document.querySelector('.badge-slider-container');
    if (badgeSlider && badgeContainer) {
        const badges = Array.from(badgeSlider.querySelectorAll('.badge-card'));

        const processBadges = (badgeCollection) => {
            const credlyDivs = Array.from(badgeCollection);
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
                }, 700);
            });
        };

        // Wait for all images to load (handles delayed loading causing width miscalculation)
        const loadPromises = badges.map(badge => {
            return new Promise(resolve => {
                const img = badge.querySelector('img');
                if (!img || (img.complete && img.naturalWidth !== 0)) return resolve();
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve);
            });
        });

        Promise.all(loadPromises).then(() => {
            const originalBadges = Array.from(badgeSlider.querySelectorAll('.badge-card'));
            if (originalBadges.length === 0) return;

            const originalWidth = badgeSlider.scrollWidth;
            if (originalWidth === 0) return;
            const containerWidth = badgeContainer.offsetWidth;

            let numCopies = 1;
            while (badgeSlider.scrollWidth < containerWidth * 2) {
                const clonedBadges = [];
                originalBadges.forEach(badge => {
                    const clone = badge.cloneNode(true);
                    badgeSlider.appendChild(clone);
                    clonedBadges.push(clone);
                });
                processBadges(clonedBadges.map(b => b.querySelector('div[data-share-badge-id]')).filter(Boolean));
                numCopies++;
            }

            if (numCopies % 2 !== 0) {
                const clonedBadges = [];
                originalBadges.forEach(badge => {
                    const clone = badge.cloneNode(true);
                    badgeSlider.appendChild(clone);
                    clonedBadges.push(clone);
                });
                processBadges(clonedBadges.map(b => b.querySelector('div[data-share-badge-id]')).filter(Boolean));
                numCopies++;
            }

            // Set animation duration proportional to content width for constant speed
            const speedPxPerSec = 100; // lower -> slower
            const distance = badgeSlider.scrollWidth / 2;
            const duration = Math.max(10, Math.round(distance / speedPxPerSec));
            badgeSlider.style.animationDuration = duration + 's';
        });

        processBadges(document.querySelectorAll('div[data-share-badge-id]'));
    }

    // Center anchored section within the viewport for nicer focus
    function centerElementByHash() {
        if (!location.hash) return;
        const id = location.hash.slice(1);
        const el = document.getElementById(id);
        if (!el) return;
        // Compute top so element is vertically centered
        const rect = el.getBoundingClientRect();
        const elHeight = rect.height;
        const offsetTop = window.pageYOffset + rect.top;
        const target = Math.max(0, Math.round(offsetTop - (window.innerHeight - elHeight) / 2));
        window.scrollTo({ top: target, behavior: 'smooth' });
    }

    // Run on load (if there is a hash) and whenever hash changes
    setTimeout(centerElementByHash, 120);
    window.addEventListener('hashchange', centerElementByHash);

    // Native smooth scrolling is handled by CSS scroll-behavior: smooth
    // No wheel event hijacking — let the browser handle scrolling naturally
});