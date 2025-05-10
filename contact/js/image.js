document.querySelectorAll('img[data-link]').forEach(img => {
  img.addEventListener('click', () => {
    window.location.href = img.dataset.link;
  });
});