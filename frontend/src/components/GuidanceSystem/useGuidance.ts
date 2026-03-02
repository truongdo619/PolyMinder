import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'polyminder_guidance_state';

interface PersistedState {
  dismissedIds: string[];
  completedSteps: string[];
  guidanceEnabled: boolean;
}

export interface GuidanceState {
  dismissedIds: Set<string>;
  completedSteps: Set<string>;
  guidanceEnabled: boolean;
}

const loadState = (): GuidanceState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { dismissedIds: new Set(), completedSteps: new Set(), guidanceEnabled: true };
    }
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      dismissedIds: new Set(parsed.dismissedIds ?? []),
      completedSteps: new Set(parsed.completedSteps ?? []),
      guidanceEnabled: parsed.guidanceEnabled ?? true,
    };
  } catch {
    return { dismissedIds: new Set(), completedSteps: new Set(), guidanceEnabled: true };
  }
};

const saveState = (state: GuidanceState) => {
  const serializable: PersistedState = {
    dismissedIds: [...state.dismissedIds],
    completedSteps: [...state.completedSteps],
    guidanceEnabled: state.guidanceEnabled,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
};

export const useGuidance = () => {
  const [state, setState] = useState<GuidanceState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const dismiss = useCallback((id: string) => {
    setState((prev) => {
      const next: GuidanceState = {
        ...prev,
        dismissedIds: new Set(prev.dismissedIds),
      };
      next.dismissedIds.add(id);
      return next;
    });
  }, []);

  const completeStep = useCallback((stepId: string) => {
    setState((prev) => {
      const next: GuidanceState = {
        ...prev,
        completedSteps: new Set(prev.completedSteps),
      };
      next.completedSteps.add(stepId);
      return next;
    });
  }, []);

  const toggleGuidance = useCallback(() => {
    setState((prev) => ({ ...prev, guidanceEnabled: !prev.guidanceEnabled }));
  }, []);

  const resetGuidance = useCallback(() => {
    setState({ dismissedIds: new Set(), completedSteps: new Set(), guidanceEnabled: true });
  }, []);

  const resetCompletedSteps = useCallback(() => {
    setState((prev) => ({ ...prev, completedSteps: new Set() }));
  }, []);

  const shouldShow = useCallback(
    (id: string) => state.guidanceEnabled && !state.dismissedIds.has(id),
    [state],
  );

  const isStepComplete = useCallback(
    (stepId: string) => state.completedSteps.has(stepId),
    [state],
  );

  return { state, dismiss, completeStep, toggleGuidance, resetGuidance, resetCompletedSteps, shouldShow, isStepComplete };
};
