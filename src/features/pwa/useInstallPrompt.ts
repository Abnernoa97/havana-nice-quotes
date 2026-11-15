import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<unknown>;
};

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [standalone, setStandalone] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
  useEffect(() => {
    const onPrompt = (event: Event) => {
      const installEvent = event as InstallPromptEvent;
      installEvent.preventDefault();
      setInstallPrompt(installEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setStandalone(true);
      setShowInstallGuide(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installApplication = async () => {
    if (standalone) return;
    if (!installPrompt) {
      setShowInstallGuide(true);
      return;
    }
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } catch (error) {
      console.warn('Install prompt unavailable', error);
      setShowInstallGuide(true);
    }
  };

  return { standalone, installApplication, showInstallGuide, setShowInstallGuide };
}
