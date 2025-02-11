import React, { useState } from 'react';
import ArComponent from './components/ArComponent';

const App = () => {
  const [navigationData, setNavigationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAR, setShowAR] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Replace with your actual backend URL
      const response = await fetch('https://e6c2-110-224-112-101.ngrok-free.app', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.start_pos && data.waypoints) {
        setNavigationData({
          startPos: data.start_pos,
          waypoints: data.waypoints
        });
        setShowAR(true);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {!showAR ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">AR Indoor Navigation</h1>
          
          <div className="mt-4">
            <label 
              htmlFor="image-upload" 
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Upload Location Image
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isLoading}
                className="hidden"
              />
            </label>
          </div>

          {isLoading && (
            <p className="mt-4 text-gray-600">Processing image...</p>
          )}
        </div>
      ) : (
        <div className="w-full h-screen relative">
          <ArComponent 
            startPos={navigationData.startPos} 
            waypoints={navigationData.waypoints} 
          />
          <button 
            onClick={() => setShowAR(false)}
            className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded z-50"
          >
            Exit AR
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
