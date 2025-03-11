import React, { useState, useEffect } from 'react';
import '../../example/src/assets/css/style-vis.css'; // Ensure the path is correct
import {collData} from '../../example/src/assets/js/brat_config'; // Import collData

declare global {
  interface Window {
    Util: any;
    head: any;
  }
}

interface DocData {
  text: string;
  entities: Array<[]>;
  relations: Array<[]>;
}

interface BratEmbeddingProps {
  docData: DocData;
}

const BratEmbedding: React.FC<BratEmbeddingProps> = ({ docData }) => {
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    const initializeBrat = () => {
      if (window.head && window.head.ready) {
        window.head.ready(() => {
          window.Util.embed('embedding-entity-example', { ...collData }, { ...docData }, []);
          setIsLoaded(true); // Set the state to true after embedding is initialized
        });
      } else {
        window.Util.embed('embedding-entity-example', { ...collData }, { ...docData }, []);
        setIsLoaded(true); // Set the state to true after embedding is initialized
      }
    };

    initializeBrat();
  }, [docData]);

  return (
    <div>
      {isLoaded && <b>Brat Visualization:</b>}
      <div id="embedding-entity-example"></div>
    </div>
  );
};

export default BratEmbedding;