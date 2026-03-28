"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';

class OvalScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private mount: HTMLDivElement | null = null;
  private particles: THREE.Points | null = null;
  private ovalTube: THREE.Mesh | null = null;
  private personalityDots: THREE.Mesh[] = [];
  private clock: THREE.Clock;
  private isProcessing = false;
  private targetRotationSpeed = 0.05;
  private currentRotationSpeed = 0.05;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.clock = new THREE.Clock();
  }

  init(mount: HTMLDivElement) {
    this.mount = mount;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.mount.appendChild(this.renderer.domElement);
    this.camera.position.z = 10;
    
    this.createParticles();
    this.createOval();
    this.createPersonalityDots();

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    
    this.animate();
  }

  private handleResize = () => {
    if (!this.renderer || !this.mount) return;
    const { clientWidth, clientHeight } = this.mount;
    this.renderer.setSize(clientWidth, clientHeight);
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
  };
  
  private createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 5000;
    const posArray = new Float32Array(particlesCnt * 3);

    for (let i = 0; i < particlesCnt * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 25;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: 0x6619E5,
      blending: THREE.AdditiveBlending,
    });
    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);
  }

  private createOval() {
    const curve = new THREE.EllipseCurve(0, 0, 5, 3, 0, 2 * Math.PI, false, 0);
    const points = curve.getPoints(200);
    const path = new THREE.CatmullRomCurve3(points);

    const geometry = new THREE.TubeGeometry(path, 200, 0.03, 8, true);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x6619E5,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.3
    });
    
    this.ovalTube = new THREE.Mesh(geometry, material);
    this.ovalTube.rotation.x = Math.PI / 4;
    this.ovalTube.rotation.y = Math.PI / 4;
    this.scene.add(this.ovalTube);
  }

  private createPersonalityDots() {
    const dotCount = 5;
    for (let i = 0; i < dotCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0xA1CAF7 });
      const dot = new THREE.Mesh(geometry, material);
      this.scene.add(dot);
      this.personalityDots.push(dot);
    }
  }

  setProcessing(isProcessing: boolean) {
    this.isProcessing = isProcessing;
    this.targetRotationSpeed = isProcessing ? 0.3 : 0.05;
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Lerp rotation speed for smooth transitions
    this.currentRotationSpeed += (this.targetRotationSpeed - this.currentRotationSpeed) * 0.1;

    if (this.ovalTube) {
      this.ovalTube.rotation.y += this.currentRotationSpeed * delta;
      this.ovalTube.rotation.z += this.currentRotationSpeed * delta * 0.5;
    }

    if (this.particles) {
        this.particles.rotation.y = elapsed * 0.05;
    }
    
    // Animate personality dots along the oval
    this.personalityDots.forEach((dot, index) => {
        const t = (elapsed * 0.1 + index * 0.2) % 1;
        const tubePath = (this.ovalTube?.geometry as THREE.TubeGeometry).parameters.path as THREE.CatmullRomCurve3;
        const pos = tubePath.getPointAt(t);
        dot.position.copy(pos);
        
        if (this.ovalTube) {
            dot.position.applyQuaternion(this.ovalTube.quaternion);
        }

        // Make dots glow when processing
        (dot.material as THREE.MeshBasicMaterial).color.set(this.isProcessing ? 0x6619E5 : 0xA1CAF7);
    });

    if(this.isProcessing && this.ovalTube){
      const material = this.ovalTube.material as THREE.MeshBasicMaterial;
      material.opacity = 0.5 + Math.sin(elapsed * 10) * 0.2;
    } else if(this.ovalTube) {
      const material = this.ovalTube.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3;
    }

    this.renderer?.render(this.scene, this.camera);
  };
  
  cleanUp() {
    window.removeEventListener('resize', this.handleResize);
    if(this.mount && this.renderer) {
      this.mount.removeChild(this.renderer.domElement);
    }
    // TODO: dispose geometries, materials, etc.
  }
}

type OvalNetworkHandle = {
  setProcessing: (isProcessing: boolean) => void;
};

const OvalNetwork = forwardRef<OvalNetworkHandle>((props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OvalScene | null>(null);

  useEffect(() => {
    if (mountRef.current) {
      sceneRef.current = new OvalScene();
      sceneRef.current.init(mountRef.current);
    }
    return () => {
      sceneRef.current?.cleanUp();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    setProcessing: (isProcessing: boolean) => {
      sceneRef.current?.setProcessing(isProcessing);
    }
  }));

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
});

OvalNetwork.displayName = "OvalNetwork";

export default OvalNetwork;
