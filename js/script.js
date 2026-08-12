// Fade in on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.product-card, .cat-card, .benefit, .manifesto-inner').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// Cart counter (demo)
let count = 0;
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', () => {
    count++;
    document.querySelector('.cart-count').textContent = count;
  });
});
