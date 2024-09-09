// src/GlobalState.tsx
import React, { createContext, useState, ReactNode } from 'react';

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