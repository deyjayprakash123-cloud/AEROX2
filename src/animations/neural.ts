import * as THREE from 'three';

let particles: THREE.Points;
let neuralLines: THREE.LineSegments;
let isThinking = false;
let clock: THREE.Clock;
let material: THREE.PointsMaterial;
let lineMaterial: THREE.LineBasicMaterial;
let particlesCount = 800;

export function initNeuralNetwork() {
  const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 100;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const positions = new Float32Array(particlesCount * 3);
  const colors = new Float32Array(particlesCount * 3);

  // Oval shape creation
  for (let i = 0; i < particlesCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    // Elipsoid properties
    const rX = 70, rY = 40, rZ = 20;

    positions[i * 3] = rX * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = rY * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = rZ * Math.cos(phi);

    const isBlue = Math.random() > 0.5;
    colors[i * 3] = isBlue ? 0 : 0.54;      // 0 or 138/255 (purple)
    colors[i * 3 + 1] = isBlue ? 0.94 : 0.17;  // 240/255 (blue) or 43/255 (purple)
    colors[i * 3 + 2] = isBlue ? 1 : 0.89;     // 255/255 (blue) or 226/255 (purple)
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  material = new THREE.PointsMaterial({
    size: 0.8, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const lineCount = 400;
  const linePositions = new Float32Array(lineCount * 6);
  lineMaterial = new THREE.LineBasicMaterial({ color: 0x8a2be2, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending });

  for(let i = 0; i < lineCount; i++) {
    const p1 = Math.floor(Math.random() * particlesCount);
    const p2 = Math.floor(Math.random() * particlesCount);
    linePositions[i*6] = positions[p1*3]; linePositions[i*6+1] = positions[p1*3+1]; linePositions[i*6+2] = positions[p1*3+2];
    linePositions[i*6+3] = positions[p2*3]; linePositions[i*6+4] = positions[p2*3+1]; linePositions[i*6+5] = positions[p2*3+2];
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  neuralLines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(neuralLines);

  clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Base continuous rotation
    let rotSpeedY = 0.05 * elapsedTime;
    let rotSpeedX = 0.02 * elapsedTime;

    // Advanced Thinking Animations
    if (isThinking) {
      rotSpeedY *= 4; // Rotates faster
      rotSpeedX *= 2;
      material.size = 1.2 + Math.sin(elapsedTime * 15) * 0.8; // pulsing glow
      lineMaterial.opacity = 0.4 + Math.sin(elapsedTime * 10) * 0.2;
      
      // Dots light sequentially simulation (updating colors in buffer is expensive, so pulsing size/opacity simulates it)
    } else {
      material.size = 0.8;
      lineMaterial.opacity = 0.15;
    }

    particles.rotation.y = rotSpeedY;
    particles.rotation.x = rotSpeedX;
    neuralLines.rotation.y = rotSpeedY;
    neuralLines.rotation.x = rotSpeedX;

    // Smooth scroll parallax
    camera.position.y = -(window.scrollY * 0.02);

    renderer.render(scene, camera);
  }

  animate(); // 60fps engine

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function setThinkingState(state: boolean) {
  isThinking = state;
}
