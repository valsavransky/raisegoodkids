// Shared "save → show ✓ Saved briefly → navigate back" behavior for every
// Settings save screen (Gig values, Future Fund, Edit Profile) — an instant
// silent navigate felt like nothing happened, but a "Saved" button that
// just sits there until tapped again felt unnatural too. This is the
// middle ground: confirm visibly, then leave on its own a moment later.
import { useEffect, useRef, useState } from 'react';

const CONFIRM_DELAY_MS = 700;

export function useSaveConfirmation(onDone: () => void) {
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showSavedThenGoBack = () => {
    setSaved(true);
    timerRef.current = setTimeout(onDone, CONFIRM_DELAY_MS);
  };

  return { saved, showSavedThenGoBack };
}
