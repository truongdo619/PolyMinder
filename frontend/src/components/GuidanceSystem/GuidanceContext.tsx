import React, { createContext, useContext } from 'react';
import { useGuidance } from './useGuidance';
import type { GuidanceState } from './useGuidance';

interface GuidanceContextValue {
  state: GuidanceState;
  dismiss: (id: string) => void;
  completeStep: (stepId: string) => void;
  toggleGuidance: () => void;
  resetGuidance: () => void;
  resetCompletedSteps: () => void;
  shouldShow: (id: string) => boolean;
  isStepComplete: (stepId: string) => boolean;
}

const GuidanceContext = createContext<GuidanceContextValue | null>(null);

export const GuidanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const guidance = useGuidance();
  return (
    <GuidanceContext.Provider value={guidance}>
      {children}
    </GuidanceContext.Provider>
  );
};

export const useGuidanceContext = (): GuidanceContextValue => {
  const ctx = useContext(GuidanceContext);
  if (!ctx) throw new Error('useGuidanceContext must be used within a GuidanceProvider');
  return ctx;
};
