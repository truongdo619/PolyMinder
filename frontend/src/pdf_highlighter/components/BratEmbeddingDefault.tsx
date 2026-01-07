import React, { useState, useEffect } from 'react';
import '../../../public/css/style-vis.css';
import { collData } from '../../../public/js/brat_config';



declare global {
  interface Window {
    Util: any;
    head: any;
  }
}

interface DocData {
  text: string;
  entities: any[];
  relations: any[];
}

interface BratEmbeddingProps {
  docData: DocData;
}

const BratEmbeddingDefault: React.FC<BratEmbeddingProps> = ({ docData }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Unique, stable ID per component instance
  const [containerId] = useState(
    () => `brat-embed-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    const initializeBrat = () => {
      if (window.head && window.head.ready) {
        window.head.ready(() => {
          var dispatcher = window.Util.embed(containerId, { ...collData }, { ...docData }, []);
          setIsLoaded(true); // Set the state to true after embedding is initialized
        });
      } else {
        var dispatcher = window.Util.embed(containerId, { ...collData }, { ...docData }, []);
        setIsLoaded(true); // Set the state to true after embedding is initialized
      }
        
      // dispatcher.on('doneRendering', function () {      /* visualizer.js posts ‘doneRendering’ :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3} */
      //   var $rect = $('#embedding-entity-example')
      //         .find('rect[data-span-id="' + highlight.id.split("_")[1] + '"]');
        
      //   console.log($rect);
      //   if ($rect.length) {
      //     // fire the native mouseover event – this runs the same
      //     // onMouseOver logic as a real hover
      //     $rect[0].dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
      //   }
      // });

    };

    initializeBrat();
  }, [docData]);

  return (
    <div>
      <div id={containerId} />
    </div>
  );
};

export default BratEmbeddingDefault;
