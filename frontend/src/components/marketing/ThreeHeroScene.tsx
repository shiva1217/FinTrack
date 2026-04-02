"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeHeroScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    const directionalLight = new THREE.DirectionalLight(0xf4a17e, 1.8);
    directionalLight.position.set(4, 6, 8);
    scene.add(ambientLight, directionalLight);

    const objects: THREE.Mesh[] = [];
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xf4a17e, roughness: 0.25, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x4a5ee5, roughness: 0.2, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.1 }),
    ];

    const torus = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.32, 20, 80), materials[0]);
    torus.rotation.x = 0.9;
    scene.add(torus);
    objects.push(torus);

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 32), materials[1]);
    sphere.position.set(-2.1, 1.3, -0.6);
    scene.add(sphere);
    objects.push(sphere);

    const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.5, 8, 18), materials[2]);
    capsule.position.set(2.4, -1.2, -1);
    capsule.rotation.z = 0.8;
    scene.add(capsule);
    objects.push(capsule);

    const coinGroup = new THREE.Group();
    for (let index = 0; index < 6; index += 1) {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.08, 32),
        materials[index % 2],
      );
      coin.position.set(-1.8 + index * 0.42, -2.3 + index * 0.1, -1.2 + index * 0.08);
      coin.rotation.x = Math.PI / 2;
      coinGroup.add(coin);
    }
    scene.add(coinGroup);

    const starMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
    });
    const stars = new THREE.Group();
    for (let index = 0; index < 28; index += 1) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), starMaterial);
      star.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5.5,
        -2.5 - Math.random() * 2,
      );
      stars.add(star);
    }
    scene.add(stars);

    const pointer = { x: 0, y: 0 };
    let boost = 0;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const handleClick = () => {
      boost = 1;
    };

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("click", handleClick);
    window.addEventListener("resize", handleResize);

    let frameId = 0;

    const renderFrame = () => {
      boost *= 0.96;
      torus.rotation.z += 0.004 + boost * 0.02;
      torus.rotation.y += 0.003 + boost * 0.018;
      sphere.position.y = 1.3 + Math.sin(Date.now() * 0.0012) * 0.2;
      sphere.rotation.y += 0.01 + boost * 0.03;
      capsule.rotation.x += 0.006 + boost * 0.025;
      coinGroup.rotation.z = Math.sin(Date.now() * 0.0008) * 0.18;
      coinGroup.rotation.y += 0.004 + boost * 0.02;
      stars.rotation.y += 0.0008;
      stars.rotation.x = Math.sin(Date.now() * 0.0005) * 0.08;

      scene.rotation.y += (pointer.x * 0.35 - scene.rotation.y) * 0.04;
      scene.rotation.x += (-pointer.y * 0.2 - scene.rotation.x) * 0.04;

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      materials.forEach((material) => material.dispose());
      starMaterial.dispose();
      torus.geometry.dispose();
      sphere.geometry.dispose();
      capsule.geometry.dispose();
      coinGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
      stars.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="h-[360px] w-full rounded-[32px]" />;
}
