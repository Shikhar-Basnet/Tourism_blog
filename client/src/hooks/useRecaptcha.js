import { useCallback, useEffect, useState } from "react";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

let scriptPromise = null;
function loadRecaptchaScript() {
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function useRecaptcha() {
  const [ready, setReady] = useState(!SITE_KEY);

  useEffect(() => {
    if (!SITE_KEY) return;
    loadRecaptchaScript()
      .then(() => window.grecaptcha.ready(() => setReady(true)))
      .catch(() => setReady(false));
  }, []);

  const getToken = useCallback(async (action = "contact_form") => {
    if (!SITE_KEY || !window.grecaptcha) {
      if (!SITE_KEY) console.warn("VITE_RECAPTCHA_SITE_KEY not set — submitting without a CAPTCHA token (dev only)");
      return null;
    }
    return window.grecaptcha.execute(SITE_KEY, { action });
  }, []);

  return { ready, getToken };
}