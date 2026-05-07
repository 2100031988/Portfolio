const express = require("express");
const path = require("path");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const multer = require("multer");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_CONTACT = Number(process.env.RATE_MAX_CONTACT || 50);
const OTP_TTL_MS = 5 * 60 * 1000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

const dbPath = path.join(__dirname, "portfolio-data.db");
const db = new sqlite3.Database(dbPath);

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function bootstrapDb() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_id TEXT UNIQUE NOT NULL,
      from_name TEXT NOT NULL,
      from_email TEXT NOT NULL,
      from_phone TEXT,
      message TEXT NOT NULL,
      image_links TEXT,
      attachments TEXT,
      client_ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Safe migrations for older DBs.
  const migrationStatements = [
    "ALTER TABLE contact_submissions ADD COLUMN image_links TEXT",
    "ALTER TABLE contact_submissions ADD COLUMN attachments TEXT",
    "ALTER TABLE contact_submissions ADD COLUMN client_ip TEXT",
    "ALTER TABLE contact_submissions ADD COLUMN user_agent TEXT"
  ];

  for (const stmt of migrationStatements) {
    try {
      await runQuery(stmt);
    } catch (e) {
      if (!String(e.message).includes("duplicate column")) {
        console.warn("Migration warning:", e.message);
      }
    }
  }
}

const smtpConfigured = Boolean(
  process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

function buildReferenceId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SK-${yyyy}${mm}${dd}-${random}`;
}

function buildOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function parseAttachments(rawValue) {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean);
  } catch (_) {
    return [];
  }
}

function normalizeAttachment(file) {
  return {
    originalname: String(file.originalname || "attachment"),
    mimetype: String(file.mimetype || "application/octet-stream"),
    size: Number(file.size || 0),
    data: Buffer.isBuffer(file.buffer) ? file.buffer.toString("base64") : ""
  };
}

function attachmentDisplayName(attachment) {
  if (typeof attachment === "string") {
    return path.posix.basename(attachment) || attachment;
  }
  return String(attachment?.originalname || "attachment");
}

function attachmentDownloadName(attachment, index) {
  if (typeof attachment === "string") {
    return `attachment-${index + 1}`;
  }
  return String(attachment?.originalname || `attachment-${index + 1}`);
}

function brandedEmailShell(title, bodyHtml) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f5f7fb;padding:24px;color:#122033;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e9f2;">
        <div style="padding:18px 22px;background:linear-gradient(90deg,#f23b4a,#7c3aed);color:white;">
          <h2 style="margin:0;font-size:20px;letter-spacing:.3px;">${title}</h2>
          <p style="margin:6px 0 0;font-size:13px;opacity:.95;">Sabyasachi Kumar • Developer Portfolio</p>
        </div>
        <div style="padding:22px;line-height:1.6;font-size:14px;color:#213047;">${bodyHtml}</div>
        <div style="padding:14px 22px;background:#f8fafd;border-top:1px solid #e5e9f2;font-size:12px;color:#66788f;">
          This is an automated message from sabyasachi portfolio contact system.
        </div>
      </div>
    </div>
  `;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

const contactRateMap = new Map();
const otpStore = new Map();

function cleanupOtpStore() {
  const now = Date.now();
  for (const [token, data] of otpStore.entries()) {
    if (data.expiresAt <= now) otpStore.delete(token);
  }
}

function enforceContactRateLimit(req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const record = contactRateMap.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_WINDOW_MS;
  }

  record.count += 1;
  contactRateMap.set(ip, record);

  if (record.count > RATE_MAX_CONTACT) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please wait before sending again."
    });
  }

  next();
}

function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN || "admin123";
  const provided = req.headers["x-admin-token"] || req.query.token;
  if (!provided || provided !== expected) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
}

app.post("/api/otp/request", async (req, res) => {
  cleanupOtpStore();

  const email = String(req.body?.from_email || "").trim().toLowerCase();
  const honeypot = String(req.body?.website || "").trim();

  if (honeypot) {
    return res.json({ success: true, message: "OTP sent" });
  }

  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, message: "Valid email is required." });
  }

  const otpCode = buildOtpCode();
  const otpToken = crypto.randomBytes(16).toString("hex");

  otpStore.set(otpToken, {
    email,
    code: otpCode,
    expiresAt: Date.now() + OTP_TTL_MS
  });

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Your OTP verification code",
        html: brandedEmailShell(
          "OTP Verification",
          `<p>Your one-time OTP is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otpCode}</p><p>This OTP is valid for 5 minutes.</p>`
        )
      });
      return res.json({ success: true, otpToken, message: "OTP sent to your email." });
    } catch (e) {
      console.error("OTP email error:", e.message);
      return res.json({
        success: true,
        otpToken,
        message: "SMTP failed. Development OTP returned.",
        devOtp: otpCode
      });
    }
  }

  // Dev fallback if SMTP not configured yet.
  return res.json({
    success: true,
    otpToken,
    message: "SMTP not configured. Development OTP returned.",
    devOtp: otpCode
  });
});

app.post("/api/contact", enforceContactRateLimit, upload.array('attachments'), async (req, res) => {
  cleanupOtpStore();

  const {
    from_name,
    from_email,
    from_phone,
    message,
    image_links,
    website
  } = req.body || {};

  const files = Array.isArray(req.files) ? req.files : [];
  const attachments = files.map(normalizeAttachment);

  if (String(website || "").trim()) {
    return res.json({ success: true, message: "Request submitted." });
  }

  if (!from_name || !from_email || !message) {
    return res.status(400).json({
      success: false,
      message: "Please fill required fields: name, email, and message."
    });
  }

  // OTP removed: submissions no longer require OTP verification

  const referenceId = buildReferenceId();
  const createdAt = new Date().toISOString();
  const clientIp = getClientIp(req);
  const userAgent = String(req.headers["user-agent"] || "");

  try {
    await runQuery(
      `INSERT INTO contact_submissions (
        reference_id, from_name, from_email, from_phone, message, image_links, attachments, client_ip, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        referenceId,
        String(from_name).trim(),
        String(from_email).trim().toLowerCase(),
        String(from_phone || "").trim(),
        String(message).trim(),
        String(image_links || "").trim(),
        JSON.stringify(attachments || []),
        clientIp,
        userAgent,
        createdAt
      ]
    );

    let emailStatus = "disabled";

    if (transporter) {
      try {
        const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: ownerEmail,
          subject: `[ADMIN LEAD] New Portfolio Inquiry [${referenceId}]`,
          html: brandedEmailShell(
            "[ADMIN LEAD] New Contact Lead",
            `
              <p><strong>Reference ID:</strong> ${referenceId}</p>
              <p><strong>Name:</strong> ${String(from_name).trim()}</p>
              <p><strong>Email:</strong> ${String(from_email).trim().toLowerCase()}</p>
              <p><strong>Phone:</strong> ${String(from_phone || "N/A")}</p>
              <p><strong>Message:</strong><br/>${String(message).replace(/\n/g, "<br/>")}</p>
              <p><strong>Image Links:</strong><br/>${String(image_links || "N/A").replace(/\n/g, "<br/>")}</p>
              <p><strong>Attachments:</strong><br/>${(attachments.length ? attachments.map((item) => item.originalname).join("<br/>") : "N/A")}</p>
              <p><strong>Client IP:</strong> ${clientIp}</p>
              <p><strong>Created At:</strong> ${createdAt}</p>
            `
          )
        });

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: String(from_email).trim().toLowerCase(),
          subject: `[USER ACK] Thank you for contacting us [${referenceId}]`,
          html: brandedEmailShell(
            "[USER ACK] Request Received",
            `
              <p>Hello ${String(from_name).trim()},</p>
              <p>Thank you for reaching out. We have received your request and will get back to you soon.</p>
              <p><strong>Reference ID:</strong> ${referenceId}</p>
              <p>Please keep this reference ID for future communication.</p>
              <p>Regards,<br/>Sabyasachi Kumar</p>
            `
          )
        });

        emailStatus = "sent";
      } catch (mailErr) {
        console.error("Email send error:", mailErr.message);
        emailStatus = "failed";
      }
    }

    return res.json({
      success: true,
      referenceId,
      reference_id: referenceId,
      attachmentCount: attachments.length,
      emailStatus,
      message:
        emailStatus === "sent"
          ? "Request submitted and acknowledgement sent."
          : "Request submitted and saved successfully."
    });
  } catch (err) {
    console.error("Contact insert error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Could not save your request. Please try again."
    });
  }
});

app.post("/api/newsletter", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, message: "Valid email is required." });
  }

  try {
    await runQuery(
      "INSERT OR IGNORE INTO newsletter_subscribers (email, created_at) VALUES (?, ?)",
      [email, new Date().toISOString()]
    );
    return res.json({ success: true, message: "Subscribed successfully." });
  } catch (err) {
    console.error("Newsletter insert error:", err.message);
    return res.status(500).json({ success: false, message: "Could not subscribe right now." });
  }
});

app.get("/api/admin/leads", requireAdmin, async (_req, res) => {
  try {
    const rows = await allQuery(
      `SELECT id, reference_id, from_name, from_email, from_phone, message, image_links, attachments, client_ip, created_at
       FROM contact_submissions
       ORDER BY id DESC`
    );
    return res.json({ success: true, leads: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch leads." });
  }
});

app.get("/api/admin/leads/:leadId/attachments/:attachmentIndex", requireAdmin, async (req, res) => {
  try {
    const leadId = Number(req.params.leadId);
    const attachmentIndex = Number(req.params.attachmentIndex);

    if (!Number.isInteger(leadId) || leadId <= 0 || !Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
      return res.status(400).json({ success: false, message: "Invalid attachment request." });
    }

    const rows = await allQuery(
      `SELECT id, reference_id, attachments FROM contact_submissions WHERE id = ? LIMIT 1`,
      [leadId]
    );

    const lead = rows[0];
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    const attachments = parseAttachments(lead.attachments);
    const attachment = attachments[attachmentIndex];

    if (!attachment) {
      return res.status(404).json({ success: false, message: "Attachment not found." });
    }

    if (typeof attachment === "string") {
      return res.status(410).json({ success: false, message: "Legacy attachment paths are no longer available." });
    }

    const buffer = Buffer.from(String(attachment.data || ""), "base64");
    if (!buffer.length) {
      return res.status(404).json({ success: false, message: "Attachment data is empty." });
    }

    const downloadName = attachmentDownloadName(attachment, attachmentIndex);
    const mimeType = String(attachment.mimetype || "application/octet-stream");

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName.replace(/"/g, "")}"`);
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to download attachment." });
  }
});

app.get("/api/admin/leads/export.csv", requireAdmin, async (_req, res) => {
  try {
    const rows = await allQuery(
      `SELECT reference_id, from_name, from_email, from_phone, message, image_links, attachments, client_ip, created_at
       FROM contact_submissions
       ORDER BY id DESC`
    );

    const header = [
      "reference_id",
      "from_name",
      "from_email",
      "from_phone",
      "message",
      "image_links",
      "attachments",
      "client_ip",
      "created_at"
    ];

    const escape = (value) => {
      const v = String(value ?? "").replace(/"/g, '""');
      return `"${v}"`;
    };

    const lines = [header.join(",")];
    rows.forEach((r) => {
      const attachmentNames = parseAttachments(r.attachments)
        .map((attachment, index) => attachmentDisplayName(attachment, index))
        .join(" | ");

      lines.push([
        r.reference_id,
        r.from_name,
        r.from_email,
        r.from_phone,
        r.message,
        r.image_links,
        attachmentNames,
        r.client_ip,
        r.created_at
      ].map(escape).join(","));
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=portfolio-leads.csv");
    return res.send(lines.join("\n"));
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to export leads." });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, dbPath, smtpConfigured, otpCacheSize: otpStore.size });
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API route not found." });
  }
  return res.sendFile(path.join(__dirname, "index.html"));
});

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Attachment too large. Max size per file is 30MB."
      });
    }
    return res.status(400).json({ success: false, message: err.message || "Attachment upload failed." });
  }

  if (err) {
    return res.status(500).json({ success: false, message: "Unexpected server error." });
  }
  return next();
});

bootstrapDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Portfolio server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to bootstrap database:", err.message);
    process.exit(1);
  });
