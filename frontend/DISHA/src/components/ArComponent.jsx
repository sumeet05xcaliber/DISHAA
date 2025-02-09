import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';

const ArComponent = ({ startPos, waypoints }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const markersRef = useRef([]);
  const [arAnchor, setArAnchor] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    // Initialize Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    // Add renderer to DOM
    containerRef.current.appendChild(renderer.domElement);

    // Create AR Button with specific features
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test', 'anchors'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body },
    });
    document.body.appendChild(arButton);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Animation Loop
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (session && referenceSpace) {
          // Get hit test results
          const hitTestSource = frame.getHitTestResults(session.requestHitTestSource({
            space: referenceSpace
          }));

          if (hitTestSource.length) {
            // Use the first hit test result to position our anchor
            const hit = hitTestSource[0];
            if (!arAnchor) {
              // Create an anchor when we first get a hit test
              const anchorPose = new XRRigidTransform(hit.getPose(referenceSpace).transform.position);
              hit.createAnchor().then(anchor => {
                setArAnchor(anchor);
                updateMarkerPositions(anchor, referenceSpace);
              });
            }
          }
        }
      }
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      document.body.removeChild(arButton);
      cleanupMarkers();
    };
  }, [startPos, waypoints]);

  const cleanupMarkers = () => {
    markersRef.current.forEach(marker => {
      sceneRef.current.remove(marker);
      if (marker.geometry) marker.geometry.dispose();
      if (marker.material) marker.material.dispose();
    });
    markersRef.current = [];
  };

  const createMarker = (position, isStart = false) => {
    // Create a more visible marker
    const markerGeometry = isStart 
      ? new THREE.SphereGeometry(0.1, 32, 32)  // Larger sphere for start point
      : new THREE.CylinderGeometry(0.05, 0.05, 0.2, 32);
    
    const markerMaterial = new THREE.MeshPhongMaterial({
      color: isStart ? 0xff0000 : 0x00ff00,  // Red for start point, green for waypoints
      transparent: true,
      opacity: 0.7
    });
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Add floating arrow for non-start points
    if (!isStart) {
      const arrowGeometry = new THREE.ConeGeometry(0.03, 0.08, 32);
      const arrowMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.position.y = 0.2;
      marker.add(arrow);
    }

    // Position the marker
    marker.position.copy(position);
    
    // Add floating animation
    const animate = () => {
      marker.position.y += Math.sin(Date.now() * 0.003) * 0.0007;
      requestAnimationFrame(animate);
    };
    animate();

    return marker;
  };

  const updateMarkerPositions = (anchor, referenceSpace) => {
    cleanupMarkers();
    
    // Scale factor to make the markers visible in AR space
    const scale = 0.1; // Adjust this value based on your needs
    
    // Add start point marker
    const startPosition = new THREE.Vector3(
      startPos.x * scale,
      startPos.y * scale,
      startPos.z * scale
    );
    const startMarker = createMarker(startPosition, true);
    sceneRef.current.add(startMarker);
    markersRef.current.push(startMarker);

    // Process waypoints
    let previousPosition = startPosition;
    waypoints.forEach((waypoint, index) => {
      // Convert waypoint coordinates to AR space
      const position = new THREE.Vector3(
        waypoint.x * scale,
        waypoint.y * scale,
        waypoint.z * scale
      );

      const marker = createMarker(position);
      sceneRef.current.add(marker);
      markersRef.current.push(marker);

      // Create line connecting previous point to current point
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        previousPosition,
        position
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 2
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      sceneRef.current.add(line);
      markersRef.current.push(line);

      // Update previous position for next iteration
      previousPosition = position;
    });
  };

  return (
    <div ref={containerRef} className="w-full h-screen">
      {!arAnchor && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 p-4 rounded">
          Point your camera at the ground to place waypoints
        </div>
      )}
    </div>
  );
};

export default ArComponent;
