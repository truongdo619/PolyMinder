import React, { useState, useEffect } from 'react';
import '../../matsci/src/assets/css/style-vis.css'; // Ensure the path is correct
import { collData } from '../../matsci/src/assets/js/brat_config.js'; // Import collData

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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadScript = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Script load error for ${url}`));
        document.body.appendChild(script);
      });
    };

    const loadBratScripts = async () => {
      const bratLocation = 'src/assets/js/client'; // Adjust the path as necessary
      const scriptUrls = [
        `${bratLocation}/lib/jquery.min.js`,
        `${bratLocation}/lib/jquery.svg.min.js`,
        `${bratLocation}/lib/jquery.svgdom.min.js`,
        `${bratLocation}/src/configuration.js`,
        `${bratLocation}/src/util.js`,
        `${bratLocation}/src/annotation_log.js`,
        `${bratLocation}/lib/webfont.js`,
        `${bratLocation}/src/dispatcher.js`,
        `${bratLocation}/src/url_monitor.js`,
        `${bratLocation}/src/visualizer.js`,
      ];

      for (const url of scriptUrls) {
        await loadScript(url);
      }
    };

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

    loadBratScripts().then(initializeBrat).catch(error => {
      console.error("Error loading scripts: ", error);
    });
  }, [docData]);

  return (
    <div>
      {isLoaded && <b>Brat Visualization:</b>}
      <div id="embedding-entity-example"></div>
    </div>
  );
};

export default BratEmbedding;
