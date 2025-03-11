import React from 'react';

const DocsPage = () => {
  return (
    <iframe
      src="/docs.html"  // Updated path to index.html
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="User Manual"
    />
  );
};

export default DocsPage;