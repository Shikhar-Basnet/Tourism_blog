// Google reCAPTCHA v3 — free tier, no card required. v3 is invisible (no
// puzzle) and instead returns a 0.0–1.0 bot-likelihood score per request.
// Uses native fetch (Node 18+) so no new dependency is needed.
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const SCORE_THRESHOLD = 0.5;

export const verifyRecaptcha = async (token, remoteIp) => {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn("RECAPTCHA_SECRET_KEY not set — skipping CAPTCHA verification (dev only)");
    return { success: true, score: 1 };
  }
  if (!token) return { success: false, score: 0 };

  try {
    const params = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(VERIFY_URL, { method: "POST", body: params, signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();

    return {
      success: Boolean(data.success) && (data.score === undefined || data.score >= SCORE_THRESHOLD),
      score: data.score,
      errors: data["error-codes"],
    };
  } catch (err) {
    console.error("reCAPTCHA verification failed:", err.message);
    return { success: false, score: 0 };
  }
};