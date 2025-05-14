import React from 'react';
import DocumentList from './DocumentList'; // Assuming DocumentList is in the same directory
import ResponsiveAppBar from './ResponsiveAppBar'; // Assuming ResponsiveAppBar is in the same directory

const HomePage: React.FC = () => {
  return (
    <div>
      <ResponsiveAppBar />
      <DocumentList />
    </div>
  );
};

export default HomePage;
