import React, { useState, useEffect } from 'react';
import '../../../public/css/style-vis.css';
import { collData } from '../../../public/js/brat_config';

interface DocData {
  text: string;
  entities: (string | number | number[][])[][];
  relations: (string | string[][])[][];
}

interface BratEmbeddingProps {
  docData: DocData;
}

const BratEmbeddingDefault: React.FC<BratEmbeddingProps> = ({ docData }) => {
  const [_isLoaded, setIsLoaded] = useState(false);

  const [containerId] = useState(
    () => `brat-embed-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    Util.embed(containerId, { ...collData }, { ...docData }, []);
    setIsLoaded(true);
  }, [docData]);

  return (
    <div>
      <div id={containerId} />
    </div>
  );
};

export default BratEmbeddingDefault;
