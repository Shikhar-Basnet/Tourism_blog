import Contact from "../models/Contact.js";
import { verifyRecaptcha } from "../utils/verifyCaptcha.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ENQUIRIES_PER_EMAIL = 3;
const ENQUIRY_WINDOW_HOURS = 24;

// @desc    Submit a contact / enquiry form
// @route   POST /api/v1/contact
// @access  Public (optionalAuth attaches req.user if logged in)
export const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, captchaToken, website } = req.body;

    // --- Honeypot ---
    // "website" is a hidden field real users never see or fill; a bot's
    // autofill will populate it. Rejected with a generic message so bots
    // don't learn which field tripped the trap.
    if (website) {
      res.status(400);
      throw new Error("Submission rejected");
    }

    // --- Presence & format validation ---
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      res.status(400);
      throw new Error("Name, email, subject, and message are required");
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      res.status(400);
      throw new Error("Please provide a valid email address");
    }
    if (name.trim().length > 100 || subject.trim().length > 150) {
      res.status(400);
      throw new Error("Name or subject is too long");
    }
    if (message.trim().length < 10) {
      res.status(400);
      throw new Error("Message is too short — please add a few more details");
    }
    if (message.trim().length > 2000) {
      res.status(400);
      throw new Error("Message is too long (max 2000 characters)");
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
      email: email.trim().toLowerCase(),
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
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      subject: subject.trim(),
      message: message.trim(),
      user: req.user?._id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]?.slice(0, 300),
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
    const { page = 1, status, search } = req.query;
    const limit = Math.min(Number(req.query.limit) || 15, 100);

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
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
      page: Number(page),
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
    const { status, adminNote } = req.body;
    const ALLOWED_STATUSES = ["new", "in_progress", "resolved"];
    if (status && !ALLOWED_STATUSES.includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      res.status(404);
      throw new Error("Enquiry not found");
    }

    if (status) contact.status = status;
    if (adminNote !== undefined) contact.adminNote = adminNote.trim().slice(0, 1000);
    await contact.save();

    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete an enquiry — staff only
// @route   DELETE /api/v1/contact/:id
export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      res.status(404);
      throw new Error("Enquiry not found");
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};