
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-4 px-6 bg-secondary mb-6 rounded-lg shadow-lg animate-fade-in">
      <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-app-purple via-app-blue to-app-green bg-clip-text text-transparent">
        Advanced Vision Detection System
      </h1>
      <p className="text-center text-muted-foreground mt-2">
        Real-time object detection powered by TensorFlow.js and COCO-SSD
      </p>
    </header>
  );
};

export default Header;
