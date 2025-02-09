import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const ArComponent = ({ startPos,waypoints }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return; // Ensure containerRef exists

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    document.body.appendChild(ARButton.createButton(renderer));

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    waypoints.forEach(({ x, y, z }) => {
      const geometry = new THREE.SphereGeometry(0.1, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(x, y, z);
      scene.add(sphere);
    });

    const animate = () => {
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    };

    animate();

    return () => {
      console.log("Cleaning up ARComponent...");
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [waypoints]);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default ArComponent;
