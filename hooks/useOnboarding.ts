'use client';

import { useCallback, useEffect, useState } from 'react';

const ONBOARDING_STORAGE_KEY = 'muralize_onboarding_completed_v1';

export function useOnboarding() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isOnboardingReady, setIsOnboardingReady] = useState(false);

  useEffect(() => {
    try {
      const completed = window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
      setIsOnboardingOpen(!completed);
    } catch (error) {
      console.warn('Não foi possível ler o estado do tutorial.', error);
      setIsOnboardingOpen(false);
    } finally {
      setIsOnboardingReady(true);
    }
  }, []);

  const openOnboarding = useCallback(() => {
    setIsOnboardingOpen(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('Não foi possível salvar o estado do tutorial.', error);
    }

    setIsOnboardingOpen(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    try {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (error) {
      console.warn('Não foi possível reiniciar o tutorial.', error);
    }

    setIsOnboardingOpen(true);
  }, []);

  return {
    isOnboardingOpen,
    isOnboardingReady,
    openOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}
