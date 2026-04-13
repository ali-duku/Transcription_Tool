import { useEffect, useState } from "react";

const TRAILING_SPACES_EVENT = "transcription:trailing-spaces-change";

function readTrailingSpacesFlag(): boolean {
  return document.documentElement.getAttribute("data-show-trailing-spaces") === "true";
}

export function useTrailingSpacesIndicator() {
  const [enabled, setEnabled] = useState(readTrailingSpacesFlag);

  useEffect(() => {
    const sync = () => setEnabled(readTrailingSpacesFlag());
    window.addEventListener(TRAILING_SPACES_EVENT, sync);
    return () => window.removeEventListener(TRAILING_SPACES_EVENT, sync);
  }, []);

  return enabled;
}
