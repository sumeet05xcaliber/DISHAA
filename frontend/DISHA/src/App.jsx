import React, { useEffect, useState } from "react";
import ArComponent from "./components/ArComponent";

function App() {
  const [waypoints, setWaypoints] = useState([]);
  const [position, setPosition] = useState(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("https://c332-114-79-176-226.ngrok-free.app/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.waypoints) {
        setWaypoints(data.waypoints);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  // ✅ Log waypoints only after state updates
  useEffect(() => {
    console.log("Updated waypoints:", waypoints);
  }, [waypoints]);

  return (
    <div>
      <h1>AR Indoor Navigation</h1>
      <input type="file" onChange={handleImageUpload} accept="image/*" />
      {waypoints.length > 0 && <ArComponent waypoints={waypoints} />}
    </div>
  );
}

export default App;
