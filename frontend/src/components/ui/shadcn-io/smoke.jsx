'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Create a circular smoke texture
function createSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Create radial gradient for soft circular smoke
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function SmokeParticles({
  density = 50,
  color = '#ffffff',
  opacity = 0.5,
  enableRotation = true,
  rotation = [0, 0, 0.1],
  enableWind = false,
  windStrength = [0.01, 0.01, 0.01],
  enableTurbulence = false,
  turbulenceStrength = [0.01, 0.01, 0.01],
}) {
  const groupRef = useRef();
  const timeRef = useRef(0);

  const smokeTexture = useMemo(() => createSmokeTexture(), []);

  const particles = useMemo(() => {
    const temp = [];
    const particleCount = density;

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: smokeTexture,
          color: color,
          transparent: true,
          opacity: opacity,
          blending: THREE.NormalBlending,
          depthWrite: false,
        })
      );

      const startY = -60 + (Math.random() * 20);
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        startY,
        (Math.random() - 0.5) * 20
      );

      const size = Math.random() * 30 + 15;
      mesh.scale.set(size, size, 1);

      temp.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          Math.random() * 1 + 0.5,
          (Math.random() - 0.5) * 0.3
        ),
        baseSize: size,
        life: Math.random(),
        rotationAngle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        startY: startY,
      });
    }
    return temp;
  }, [density, smokeTexture, color, opacity]);

  // Add particles to scene on mount
  React.useEffect(() => {
    if (groupRef.current) {
      particles.forEach(particle => {
        groupRef.current.add(particle.mesh);
      });
    }
    return () => {
      particles.forEach(particle => {
        particle.mesh.material.dispose();
      });
    };
  }, [particles]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    timeRef.current += delta;

    particles.forEach((particle, i) => {
      // Update life
      particle.life += delta * 0.15;
      if (particle.life > 1) {
        particle.life = 0;
        particle.mesh.position.set(
          (Math.random() - 0.5) * 20,
          particle.startY,
          (Math.random() - 0.5) * 20
        );
        particle.baseSize = Math.random() * 30 + 15;
      }

      // Apply wind
      if (enableWind) {
        particle.velocity.x += windStrength[0] * delta * 30;
        particle.velocity.y += windStrength[1] * delta * 30;
        particle.velocity.z += windStrength[2] * delta * 30;
      }

      // Apply turbulence with sine waves
      if (enableTurbulence) {
        const turbX = Math.sin(timeRef.current * 2 + particle.mesh.position.y * 0.02 + i) * turbulenceStrength[0] * delta * 30;
        const turbY = Math.cos(timeRef.current * 1.5 + particle.mesh.position.x * 0.02) * turbulenceStrength[1] * delta * 30;
        const turbZ = Math.sin(timeRef.current * 1.8 + particle.mesh.position.z * 0.02 + i * 0.5) * turbulenceStrength[2] * delta * 30;

        particle.velocity.x += turbX;
        particle.velocity.y += turbY;
        particle.velocity.z += turbZ;
      }

      // Apply rotation spiral
      if (enableRotation) {
        particle.rotationAngle += particle.rotationSpeed;
        const spiralRadius = rotation[0] * particle.life;
        const spiralX = Math.cos(particle.rotationAngle) * spiralRadius * delta * 30;
        const spiralZ = Math.sin(particle.rotationAngle) * spiralRadius * delta * 30;
        particle.velocity.x += spiralX;
        particle.velocity.z += spiralZ;
      }

      // Update position
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));

      // Fade in/out based on life
      const fadeOpacity = particle.life < 0.2
        ? particle.life * 5
        : particle.life > 0.8
        ? (1 - particle.life) * 5
        : 1;
      particle.mesh.material.opacity = fadeOpacity * opacity;

      // Scale up and spread out as it rises
      const scaleMultiplier = 1 + particle.life * 1.5;
      const finalSize = particle.baseSize * scaleMultiplier;
      particle.mesh.scale.set(finalSize, finalSize, 1);

      // Slight rotation of the sprite itself
      particle.mesh.material.rotation = particle.rotationAngle * 0.2;

      // Damping
      particle.velocity.multiplyScalar(0.99);
    });
  });

  return <group ref={groupRef} />;
}

export const Smoke = React.forwardRef(({
  className = '',
  density = 50,
  color = '#ffffff',
  opacity = 0.5,
  enableRotation = true,
  rotation = [0, 0, 0.1],
  enableWind = false,
  windStrength = [0.01, 0.01, 0.01],
  enableTurbulence = false,
  turbulenceStrength = [0.01, 0.01, 0.01],
  ...props
}, ref) => {
  const bgColor = useMemo(() => new THREE.Color('black'), []);

  return (
    <div
      ref={ref}
      className={`w-full h-full ${className}`}
      {...props}
    >
      <Canvas
        camera={{ fov: 60, position: [0, 0, 200], far: 6000 }}
        gl={{ alpha: true, antialias: true }}
      >
        <color attach="background" args={[bgColor]} />
        <SmokeParticles
          density={density}
          color={color}
          opacity={opacity}
          enableRotation={enableRotation}
          rotation={rotation}
          enableWind={enableWind}
          windStrength={windStrength}
          enableTurbulence={enableTurbulence}
          turbulenceStrength={turbulenceStrength}
        />
      </Canvas>
    </div>
  );
});

Smoke.displayName = 'Smoke';
export default Smoke;
