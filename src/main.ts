import './style.css';
import { initNeuralNetwork } from './animations/neural';
import { initUIElements } from './chat/chatUI';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the 60fps 3D Engine Neural Network 
  initNeuralNetwork();

  // Attach all DOM event listeners for Chat interactions, Files, and Preloaders
  initUIElements();

  // Scroll Animations for Feature Cards
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in-scroll').forEach(el => observer.observe(el));
});
