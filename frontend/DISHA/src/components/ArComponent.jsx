import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const ArComponent = ({ startPos, waypoints }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const [arStatus, setArStatus] = useState('initializing');
  const markersRef = useRef([]);

  useEffect(() => {
    // Check for WebXR support
    if (!navigator.xr) {
      setArStatus('WebXR not supported');
      return;
    }

    let session = null;
    let animationFrameId = null;

    const initAR = async () => {
      try {
        // Request AR session
        session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test']
        });

        // Create scene and camera
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
          75, 
          window.innerWidth / window.innerHeight, 
          0.1, 
          1000
        );
        cameraRef.current = camera;

        // Create renderer
        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          canvas: containerRef.current
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpace(await session.requestReferenceSpace('local'));
        rendererRef.current = renderer;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 10, 0);
        scene.add(directionalLight);

        // Render loop
        const renderLoop = () => {
          renderer.render(scene, camera);
          animationFrameId = session.requestAnimationFrame(renderLoop);
        };

        // Start the render loop
        renderLoop();

        // Visualize navigation points
        visualizeNavigation(scene);

        setArStatus('active');
      } catch (error) {
        console.error('AR Initialization Error:', error);
        setArStatus('initialization-failed');
      }
    };

    // Visualization function
    const visualizeNavigation = (scene) => {
      // Clear previous markers
      markersRef.current.forEach(marker => scene.remove(marker));
      markersRef.current = [];

      // Scale factor
      const scale = 0.1;

      // Create start point marker
      const startPosition = new THREE.Vector3(
        startPos.x * scale,
        startPos.y * scale,
        startPos.z * scale
      );

      const startMarker = createMarker(startPosition, true);
      scene.add(startMarker);
      markersRef.current.push(startMarker);

      // Convert waypoints
      const scaledWaypoints = waypoints.map(waypoint => 
        new THREE.Vector3(
          waypoint.x * scale,
          waypoint.y * scale,
          waypoint.z * scale
        )
      );

      // Connect points
      if (scaledWaypoints.length > 0) {
        const startToFirstLine = createConnectionLine(startPosition, scaledWaypoints[0]);
        scene.add(startToFirstLine);
        markersRef.current.push(startToFirstLine);
      }

      // Create waypoint markers and connections
      scaledWaypoints.forEach((position, index) => {
        const waypointMarker = createMarker(position);
        scene.add(waypointMarker);
        markersRef.current.push(waypointMarker);

        // Connect consecutive waypoints
        if (index > 0) {
          const connectionLine = createConnectionLine(scaledWaypoints[index - 1], position);
          scene.add(connectionLine);
          markersRef.current.push(connectionLine);
        }
      });
    };

    // Marker creation helpers
    const createMarker = (position, isStart = false) => {
      const markerGeometry = isStart 
        ? new THREE.SphereGeometry(0.1, 32, 32)
        : new THREE.CylinderGeometry(0.05, 0.05, 0.2, 32);
      
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: isStart ? 0xff0000 : 0x00ff00,
        transparent: true,
        opacity: 0.7
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(position);
      return marker;
    };

    const createConnectionLine = (start, end) => {
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 3
      });
      return new THREE.Line(lineGeometry, lineMaterial);
    };

    // Initialization
    initAR();

    // Cleanup function
    return () => {
      if (session) {
        session.end();
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [startPos, waypoints]);

  // Render different content based on AR status
  const renderContent = () => {
    switch (arStatus) {
      case 'initializing':
        return <div>Initializing AR...</div>;
      case 'WebXR not supported':
        return <div>Your device does not support WebXR AR</div>;
      case 'initialization-failed':
        return <div>Failed to start AR. Check browser and device compatibility.</div>;
      case 'active':
        return null; // AR is running
      default:
        return <div>Unexpected AR status</div>;
    }
  };

  return (
    <div className="relative w-full h-screen">
      <canvas 
        ref={containerRef} 
        className="absolute top-0 left-0 w-full h-full"
      />
      <div className="absolute top-4 left-4 text-white z-50">
        {renderContent()}
      </div>
    </div>
  );
};

export default ArComponent;
