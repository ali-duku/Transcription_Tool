import { useCallback, useEffect, useState } from "react";
import { latestWhatsNewVersion } from "../../../../shared/constants/whatsNewReleases";
import { VERSION_SEEN_KEY } from "../../../../shared/constants/storageKeys";

interface WhatsNewState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export function useWhatsNewModalState(appVersion: string): WhatsNewState {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const seenVersion = localStorage.getItem(VERSION_SEEN_KEY);
      if (seenVersion !== appVersion || latestWhatsNewVersion() !== appVersion) {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, [appVersion]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(VERSION_SEEN_KEY, appVersion);
    } catch {
      // Ignore storage failures.
    }
  }, [appVersion]);

  return { isOpen, open, close };
}
