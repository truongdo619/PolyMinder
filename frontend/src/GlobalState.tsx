// src/GlobalState.tsx
import React, { createContext, useEffect, useMemo, useState, ReactNode } from 'react';
import defaultSettings from '../settings.json';

type BratOutput = any; // tighten this when you have a shape

type TableOutput = any; // you can refine this later

type LLLOutput = any; // you can refine this later

// Shape of your settings.json (add more fields as needed)
export interface AppSettings {
  apiBaseUrl?: string;
  bratBaseUrl?: string; // e.g. "/js/client" or full URL
  [key: string]: any;
}

interface GlobalContextType {
  bratOutput: BratOutput | null;
  tableOutput: TableOutput | null;
  LLLOutput: LLLOutput | null;
  documentId: string | null;
  updateId: number;
  fileName: string | null;

  // --- New LLM States ---
  supportedModels: string[];
  // ----------------------

  settings: AppSettings;
  setSettings: (s: AppSettings) => void;

  setBratOutput: (bratOutput: BratOutput) => void;
  setTableOutput: (tableOutput: TableOutput) => void;
  setLLLOutput: (LLLOutput: LLLOutput) => void;
  setDocumentId: (documentId: string | null) => void;
  setUpdateId: (updateId: number) => void;
  setFileName: (fileName: string | null) => void;

  // --- New LLM Setters ---
  setSupportedModels: (models: string[]) => void;
  // -----------------------
}

export const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [bratOutput, setBratOutput] = useState<BratOutput | null>(null);
  const [tableOutput, setTableOutput] = useState<TableOutput | null>(null);
  const [LLLOutput, setLLLOutput] = useState<LLLOutput | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<number>(-1);
  const [fileName, setFileName] = useState<string | null>(null);

  // --- New LLM State Initialization ---
  const [supportedModels, setSupportedModels] = useState<string[]>([
    'qwen2.5:7b',
    'qwen3:14b'
  ]);
  // ------------------------------------

  // Load settings: start with bundled defaults, then try runtime override at /settings.json
  const [settings, setSettings] = useState<AppSettings>(defaultSettings as AppSettings);

  useEffect(() => {
    // Try fetching /settings.json at runtime to override (ignore if missing in dev)
    const loadRuntimeSettings = async () => {
      try {
        const res = await fetch('/settings.json', { cache: 'no-store' });
        if (res.ok) {
          const runtimeSettings = (await res.json()) as AppSettings;
          // Merge runtime over defaults
          setSettings((prev) => ({ ...prev, ...runtimeSettings }));
        }
      } catch {
        // No runtime settings available; keep defaults
      }
    };
    loadRuntimeSettings();
  }, []);

  // Utility to load a script once
  const loadScript = (url: string) =>
    new Promise<void>((resolve, reject) => {
      // If already present, resolve immediately
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.body.appendChild(script);
    });

  useEffect(() => {
    // Load BRAT assets based on settings
    const bratBase = settings.bratBaseUrl || '/js/client';
    const scripts = [
      `${bratBase}/lib/jquery.min.js`,
      `${bratBase}/lib/jquery.svg.min.js`,
      `${bratBase}/lib/jquery.svgdom.min.js`,
      `${bratBase}/src/configuration.js`,
      `${bratBase}/src/util.js`,
      `${bratBase}/src/annotation_log.js`,
      `${bratBase}/lib/webfont.js`,
      `${bratBase}/src/dispatcher.js`,
      `${bratBase}/src/url_monitor.js`,
      `${bratBase}/src/visualizer.js`,
    ];

    let cancelled = false;
    const loadAll = async () => {
      try {
        await scripts.reduce(
          (p, url) => p.then(() => (cancelled ? Promise.resolve() : loadScript(url))),
          Promise.resolve()
        );
      } catch (e) {
        // Optional: surface this via a toast/logger
        // console.error(e);
      }
    };
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [settings.bratBaseUrl]); // re-run only if the base URL changes

  const value = useMemo<GlobalContextType>(
    () => ({
      bratOutput,
      tableOutput,
      LLLOutput,
      documentId,
      updateId,
      fileName,
      supportedModels,

      settings,
      setSettings,

      setBratOutput,
      setTableOutput,
      setLLLOutput,
      setDocumentId,
      setUpdateId,
      setFileName,
      setSupportedModels,
    }),
    [
      bratOutput,
      tableOutput,
      LLLOutput,
      documentId,
      updateId,
      fileName,
      supportedModels,
      settings
    ]
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};