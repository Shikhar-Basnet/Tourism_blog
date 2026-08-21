import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  MessageSquare,
  Loader2,
  ShieldCheck,
  Lock,
  Gauge,
  Check,
} from "lucide-react";
import { submitContactForm } from "../services/contactService.js";
import { useRecaptcha } from "../hooks/useRecaptcha.js";

const MESSAGE_MAX = 2000;
const MESSAGE_MIN = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const initialForm = { name: "", email: "", phone: "", subject: "", message: "", website: "" };

const contactPoints = [
  { icon: Mail, label: "Email us", value: "hello@nepaltourism.example", chip: "bg-blue-50 text-blue-600" },
  { icon: Phone, label: "Call us", value: "+977 1-4123456", chip: "bg-emerald-50 text-emerald-600" },
  { icon: MapPin, label: "Visit us", value: "Thamel, Kathmandu, Nepal", chip: "bg-rose-50 text-rose-600" },
  { icon: Clock, label: "Office hours", value: "Sun–Fri, 10am–5pm NPT", chip: "bg-amber-50 text-amber-600" },
];

const trustBadges = [
  { icon: ShieldCheck, label: "reCAPTCHA protected" },
  { icon: Gauge, label: "Rate limited" },
  { icon: Lock, label: "Sent over HTTPS" },
];

function FieldError({ error }) {
  if (!error) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle size={11} className="shrink-0" /> {error}
    </p>
  );
}

// Small inline check that appears once a field independently passes
// validation — separate from the error state, so users get positive
// reinforcement as they type instead of only ever seeing red.
function ValidIcon({ show }) {
  if (!show) return null;
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
      <Check size={15} strokeWidth={3} />
    </span>
  );
}

export default function Contact() {
  const [fields, setFields] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [serverError, setServerError] = useState("");
  const { getToken } = useRecaptcha();

  const handleChange = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleBlur = (key) => () => setTouched((prev) => ({ ...prev, [key]: true }));

  // Live validity per field — drives the green checkmarks without waiting
  // for a submit attempt. Doesn't replace the authoritative validate()
  // below, which still runs (and shows errors) on submit.
  const fieldValid = useMemo(
    () => ({
      name: fields.name.trim().length > 0 && fields.name.trim().length <= 100,
      email: EMAIL_REGEX.test(fields.email.trim()),
      subject: fields.subject.trim().length > 0 && fields.subject.trim().length <= 150,
      message: fields.message.trim().length >= MESSAGE_MIN && fields.message.trim().length <= MESSAGE_MAX,
    }),
    [fields]
  );

  const messageLen = fields.message.length;
  const messageBarColor =
    messageLen > MESSAGE_MAX ? "bg-red-500" : messageLen > MESSAGE_MAX * 0.9 ? "bg-amber-500" : "bg-blue-500";
  const messageCountColor =
    messageLen > MESSAGE_MAX ? "text-red-600" : messageLen > MESSAGE_MAX * 0.9 ? "text-amber-600" : "text-gray-400";

  const validate = () => {
    const next = {};
    if (!fields.name.trim()) next.name = "Please enter your name.";
    else if (fields.name.trim().length > 100) next.name = "Name is too long.";

    if (!fields.email.trim()) next.email = "Please enter your email.";
    else if (!EMAIL_REGEX.test(fields.email.trim())) next.email = "That doesn't look like a valid email.";

    if (!fields.subject.trim()) next.subject = "Please add a subject.";
    else if (fields.subject.trim().length > 150) next.subject = "Subject is too long.";

    if (!fields.message.trim()) next.message = "Please write a message.";
    else if (fields.message.trim().length < MESSAGE_MIN) next.message = "A few more details would help us assist you.";
    else if (fields.message.trim().length > MESSAGE_MAX) next.message = `Message must be under ${MESSAGE_MAX} characters.`;

    setErrors(next);
    setTouched({ name: true, email: true, subject: true, message: true });
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setStatus("submitting");
    try {
      const captchaToken = await getToken("contact_form");
      await submitContactForm({ ...fields, captchaToken });
      setStatus("success");
      setFields(initialForm);
      setTouched({});
    } catch (err) {
      setStatus("error");
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  const inputClass = (key, hasIcon = true) => {
    const showError = touched[key] && errors[key];
    return `w-full rounded-lg border bg-white px-3 py-2.5 ${hasIcon ? "pl-9" : ""} ${
      fieldValid[key] ? "pr-9" : ""
    } text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-4 disabled:opacity-60 ${
      showError
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : fieldValid[key]
        ? "border-emerald-200 focus:border-blue-400 focus:ring-blue-100"
        : "border-gray-300 focus:border-blue-400 focus:ring-blue-100"
    }`;
  };

  return (
    <div className="bg-gray-50">
      <Helmet>
        <title>Contact Us | Nepal Tourism</title>
        <meta name="description" content="Have a question about traveling to Nepal? Get in touch and we'll help you plan your trip." />
      </Helmet>

      {/* Header */}
      <section className="relative overflow-hidden bg-white px-4 py-16 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-blue-50/70 via-transparent to-transparent"
        />
        <div className="relative">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <MessageSquare size={12} /> We usually reply within 1–2 business days
          </span>
          <h1 className="text-4xl font-normal text-gray-900 md:text-5xl">
            Let's plan your <span className="text-blue-600">Nepal</span> trip
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Questions about a destination, a trek, or just need advice? Send us a message and our team will get back to you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Sidebar */}
          <aside className="lg:col-span-2">
            <div className="space-y-3">
              {contactPoints.map(({ icon: Icon, label, value, chip }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] transition-shadow hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)]"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${chip}`}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map preview — static OSM embed, no API key required */}
            <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
              <iframe
                title="Office location — Thamel, Kathmandu"
                src="https://www.openstreetmap.org/export/embed.html?bbox=85.297%2C27.706%2C85.328%2C27.725&layer=mapnik&marker=27.7154%2C85.3123"
                className="h-40 w-full grayscale-[15%]"
                loading="lazy"
              />
            </div>

            {/* Trust badges */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/60 px-2 py-3 text-center"
                >
                  <Icon size={16} className="text-blue-600" />
                  <span className="text-[10px] font-medium leading-tight text-blue-800">{label}</span>
                </div>
              ))}
            </div>

            <p className="mt-3 px-1 text-xs leading-relaxed text-gray-500">
              Every submission is checked by reCAPTCHA and capped per person, so replies never get buried under spam —
              your message reaches a real person, faster.
            </p>
          </aside>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] sm:p-8">
              {status === "success" ? (
                <div className="flex flex-col items-center py-10 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                    <CheckCircle2 size={30} className="text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">Message sent</h2>
                  <p className="mt-1 max-w-sm text-sm text-gray-600">
                    Thanks for reaching out — our team typically replies within 1–2 business days. A copy of your
                    enquiry has been recorded securely on our end.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="mt-6 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {serverError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  {/* Honeypot — hidden visually and from assistive tech; a bot
                      that autofills every input will populate this and get
                      silently rejected server-side. */}
                  <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={fields.website}
                      onChange={handleChange("website")}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-gray-600">
                        Full name
                      </label>
                      <div className="relative">
                        <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          id="name"
                          value={fields.name}
                          onChange={handleChange("name")}
                          onBlur={handleBlur("name")}
                          placeholder="Full Name"
                          disabled={status === "submitting"}
                          className={inputClass("name")}
                        />
                        <ValidIcon show={fieldValid.name && !(touched.name && errors.name)} />
                      </div>
                      <FieldError error={touched.name ? errors.name : undefined} />
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-gray-600">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          id="email"
                          type="email"
                          value={fields.email}
                          onChange={handleChange("email")}
                          onBlur={handleBlur("email")}
                          placeholder="you@example.com"
                          disabled={status === "submitting"}
                          className={inputClass("email")}
                        />
                        <ValidIcon show={fieldValid.email && !(touched.email && errors.email)} />
                      </div>
                      <FieldError error={touched.email ? errors.email : undefined} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-gray-600">
                      Phone <span className="text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="phone"
                        value={fields.phone}
                        onChange={handleChange("phone")}
                        placeholder="+977"
                        disabled={status === "submitting"}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pl-9 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="mb-1.5 block text-xs font-medium text-gray-600">
                      Subject
                    </label>
                    <div className="relative">
                      <input
                        id="subject"
                        value={fields.subject}
                        onChange={handleChange("subject")}
                        onBlur={handleBlur("subject")}
                        placeholder="Trip planning, trekking, or other enquiry"
                        disabled={status === "submitting"}
                        className={inputClass("subject", false)}
                      />
                      <ValidIcon show={fieldValid.subject && !(touched.subject && errors.subject)} />
                    </div>
                    <FieldError error={touched.subject ? errors.subject : undefined} />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="message" className="block text-xs font-medium text-gray-600">
                        Message
                      </label>
                      <span className={`text-xs tabular-nums transition-colors ${messageCountColor}`}>
                        {messageLen}/{MESSAGE_MAX}
                      </span>
                    </div>
                    <div className="relative">
                      <MessageSquare size={15} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
                      <textarea
                        id="message"
                        rows={5}
                        maxLength={MESSAGE_MAX}
                        value={fields.message}
                        onChange={handleChange("message")}
                        onBlur={handleBlur("message")}
                        placeholder="Tell us what you're planning and how we can help..."
                        disabled={status === "submitting"}
                        className={`w-full resize-none rounded-lg border px-3 py-2.5 pl-9 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-4 disabled:opacity-60 ${
                          touched.message && errors.message
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-gray-300 focus:border-blue-400 focus:ring-blue-100"
                        }`}
                      />
                    </div>
                    {/* Progress bar reinforces the character counter visually,
                        and turns amber/red as the visitor nears the cap. */}
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${messageBarColor}`}
                        style={{ width: `${Math.min((messageLen / MESSAGE_MAX) * 100, 100)}%` }}
                      />
                    </div>
                    <FieldError error={touched.message ? errors.message : undefined} />
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "submitting" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Send message
                        </>
                      )}
                    </button>

                    <p className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Lock size={12} /> Your details are only used to respond to this enquiry.
                    </p>
                  </div>

                  <p className="text-[11px] leading-relaxed text-gray-400">
                    This site is protected by reCAPTCHA and the Google{" "}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                      Terms of Service
                    </a>{" "}
                    apply.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}