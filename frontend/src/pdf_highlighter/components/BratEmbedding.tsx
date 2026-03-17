import React, { useState, useEffect } from 'react';
import '../../../public/css/style-vis.css';
import {collData} from '../../../public/js/brat_config';
import { CommentedHighlight } from "../types";

interface DocData {
  text: string;
  entities: string[][];
  relations: (string | [string, string][])[][];
  triggers?: string[][];
  events?: (string | [string, string][])[][];
  selectedMode?: string;
}

interface BratEmbeddingProps {
  docData: DocData;
  highlight: CommentedHighlight;
}

const BratEmbedding: React.FC<BratEmbeddingProps> = ({ docData, highlight }) => {
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    const initializeBrat = () => {
      const bratDispatcher = Util.embed('embedding-entity-example', { ...collData }, { ...docData }, []);
      setIsLoaded(true);

      const PINNED = highlight.id.split("_")[1];

      function lightUp(spanId: string) {
        const r = document.querySelector(
                  `#embedding-entity-example rect[data-span-id="${spanId}"]`);
        if (r) {
          r.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        }
      }

      bratDispatcher.post('doneRendering', []);
      lightUp(PINNED);

      $('#embedding-entity-example')
        .on('mouseout.pin', () => lightUp(PINNED));
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
