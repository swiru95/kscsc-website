document.querySelectorAll('img[data-link]').forEach(img => {
  img.addEventListener('click', () => {
    window.location.href = img.dataset.link;
  });
});

document.querySelectorAll('div[data-mailto]').forEach(div => {
  div.addEventListener('click', () => {
    window.location.href = div.dataset.mailto;
  });
});