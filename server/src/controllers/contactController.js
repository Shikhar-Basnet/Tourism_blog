import Contact from "../models/Contact.js";
import { verifyRecaptcha } from "../utils/verifyCaptcha.js";
import { sanitizeText, normalizeEmail, sanitizeObjectId, logSecurityEvent } from "../utils/security.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ENQUIRIES_PER_EMAIL = 3;
const ENQUIRY_WINDOW_HOURS = 24;

// @desc    Submit a contact / enquiry form
// @route   POST /api/v1/contact
// @access  Public (optionalAuth attaches req.user if logged in)
export const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, captchaToken, website } = req.body;

    if (website) {
      res.status(400);
      throw new Error("Submission rejected");
    }

    const safeName = sanitizeText(name, 100);
    const safeEmail = normalizeEmail(email);
    const safeSubject = sanitizeText(subject, 150);
    const safeMessage = sanitizeText(message, 2000);
    const safePhone = sanitizeText(phone, 30);

    if (!safeName || !safeEmail || !safeSubject || !safeMessage) {
      res.status(400);
      throw new Error("Name, email, subject, and message are required");
    }
    if (!EMAIL_REGEX.test(safeEmail)) {
      res.status(400);
      throw new Error("Please provide a valid email address");
    }
    if (safeMessage.length < 10) {
      res.status(400);
      throw new Error("Message is too short — please add a few more details");
    }

    // --- CAPTCHA ---
    const captchaResult = await verifyRecaptcha(captchaToken, req.ip);
    if (!captchaResult.success) {
      res.status(400);
      throw new Error("CAPTCHA verification failed. Please refresh and try again.");
    }

    // --- Per-email throttling ---
    // On top of the IP-based rate limiter (route middleware), this stops
    // one person flooding the inbox from different IPs/devices using the
    // same email. Rolling window, not a lifetime cap, so genuine repeat
    // visitors aren't locked out forever.
    const windowStart = new Date(Date.now() - ENQUIRY_WINDOW_HOURS * 60 * 60 * 1000);
    const recentCount = await Contact.countDocuments({
      email: safeEmail,
      createdAt: { $gte: windowStart },
    });
    if (recentCount >= MAX_ENQUIRIES_PER_EMAIL) {
      res.status(429);
      throw new Error(
        `You've reached the limit of ${MAX_ENQUIRIES_PER_EMAIL} enquiries per ${ENQUIRY_WINDOW_HOURS} hours. We'll get back to your existing messages soon.`
      );
    }

    // Mongoose casts every field to its declared schema type (String), so
    // an attempted NoSQL operator-injection payload like
    // { "email": { "$gt": "" } } fails casting instead of being
    // interpreted as a query operator. express-mongo-sanitize (app.js)
    // also strips any "$"/"." prefixed keys from req.body before this runs.
    const contact = await Contact.create({
      name: safeName,
      email: safeEmail,
      phone: safePhone || undefined,
      subject: safeSubject,
      message: safeMessage,
      user: req.user?._id,
      ipAddress: req.ip,
      userAgent: sanitizeText(req.headers["user-agent"], 300),
    });

    res.status(201).json({
      success: true,
      message: "Thanks for reaching out — we'll get back to you soon.",
      data: { id: contact._id, createdAt: contact.createdAt },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    List enquiries — staff only
// @route   GET /api/v1/contact
export const getContacts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Math.min(Number(req.query.limit) || 15, 100);
    const safeStatus = typeof req.query.status === "string" ? sanitizeText(req.query.status, 32) : "";
    const safeSearch = sanitizeText(req.query.search, 100);

    const query = {};
    if (safeStatus) query.status = safeStatus;
    if (safeSearch) {
      const escaped = safeSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { subject: { $regex: escaped, $options: "i" } },
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      count: contacts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: contacts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update status/note on an enquiry — staff only
// @route   PATCH /api/v1/contact/:id
export const updateContactStatus = async (req, res, next) => {
  try {
    const contactId = sanitizeObjectId(req.params.id, "Enquiry ID");
    const { status, adminNote } = req.body;
    const ALLOWED_STATUSES = ["new", "in_progress", "resolved"];
    const safeStatus = typeof status === "string" ? sanitizeText(status, 32) : status;
    if (safeStatus && !ALLOWED_STATUSES.includes(safeStatus)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    const contact = await Contact.findById(contactId);
    if (!contact) {
      res.status(404);
      throw new Error("Enquiry not found");
    }

    if (safeStatus) contact.status = safeStatus;
    if (adminNote !== undefined) contact.adminNote = sanitizeText(adminNote, 1000);
    await contact.save();
    logSecurityEvent("contact_status_updated", { actorId: req.user._id.toString(), contactId: contact._id.toString(), status: contact.status });

    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete an enquiry — staff only
// @route   DELETE /api/v1/contact/:id
export const deleteContact = async (req, res, next) => {
  try {
    const contactId = sanitizeObjectId(req.params.id, "Enquiry ID");
    const contact = await Contact.findByIdAndDelete(contactId);
    if (!contact) {
      res.status(404);
      throw new Error("Enquiry not found");
    }
    logSecurityEvent("contact_deleted", { actorId: req.user._id.toString(), contactId: contact._id.toString() });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};