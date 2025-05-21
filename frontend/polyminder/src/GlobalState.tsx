// src/GlobalState.tsx
import React, { createContext, useState, ReactNode, useEffect } from 'react';

interface GlobalContextType {
  bratOutput: any | null;
  documentId: string | null;
  updateId: number;
  fileName: string | null; // Add this line
  setBratOutput: (bratOutput: any) => void;
  setDocumentId: (documentId: string) => void;
  setUpdateId: (updateId: number) => void;
  setFileName: (fileName: string) => void; // Add this line
}

export const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [bratOutput, setBratOutput] = useState<any | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<number>(-1);
  const [fileName, setFileName] = useState<string | null>(null); // Add this line

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
    
    loadBratScripts();

  }, []);

  return (
    <GlobalContext.Provider value={{ 
      bratOutput, 
      documentId, 
      updateId, 
      fileName, // Add this line
      setBratOutput, 
      setDocumentId, 
      setUpdateId,
      setFileName // Add this line
    }}>
      {children}
    </GlobalContext.Provider>
  );
};