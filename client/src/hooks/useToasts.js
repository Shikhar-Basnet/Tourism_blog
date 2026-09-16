import { useCallback, useRef, useState } from "react";

let idCounter = 0;
const EXIT_ANIMATION_MS = 180;

// Stack-based toast queue — each call to showToast pushes a new, independent
// toast instead of overwriting a single banner slot, so rapid successive
// actions (e.g. toggling a role back and forth) are each visibly
// acknowledged instead of silently collapsing into one message.
export function useToasts(duration = 4000) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  // Two-step dismiss: mark "leaving" so Toast.jsx can transition it out
  // smoothly, then actually drop it from the array once that plays out.
  const dismiss = useCallback(
    (id) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => remove(id), EXIT_ANIMATION_MS);
    },
    [remove]
  );

  const showToast = useCallback(
    (type, message) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, type, message, leaving: false }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    },
    [dismiss, duration]
  );

  return { toasts, showToast, dismiss };
}