// Records that a setup screen was reached, for the onboarding funnel.
import { useEffect } from 'react';
import { track } from '../services/analytics';

export function useTrackSetupStep(step: string) {
  useEffect(() => {
    track('onboarding_step', { step });
  }, [step]);
}
