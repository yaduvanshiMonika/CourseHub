const db = require('../config/db');
const nodemailer = require('nodemailer');

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Accept admin datetime-local or ISO-ish string → MySQL DATETIME or null */
function parseAdminDatetime(val) {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s) return null;
  const normalized = s.includes('T') ? s.replace('T', ' ') : s;
  if (normalized.length === 16) return `${normalized}:00`;
  if (normalized.length >= 19) return normalized.slice(0, 19);
  return null;
}

function safeMeetingHref(url) {
  const u = String(url || '').trim();
  return /^https?:\/\//i.test(u) ? u : '';
}

function formatSlotForEmail(w) {
  const parts = [];
  if (w.scheduled_start) {
    try {
      const d = new Date(w.scheduled_start);
      if (!Number.isNaN(d.getTime())) {
        parts.push(`<strong>Start:</strong> ${escapeHtml(d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))}`);
      }
    } catch (_) { /* ignore */ }
  }
  if (w.scheduled_end) {
    try {
      const d = new Date(w.scheduled_end);
      if (!Number.isNaN(d.getTime())) {
        parts.push(`<strong>End:</strong> ${escapeHtml(d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))}`);
      }
    } catch (_) { /* ignore */ }
  }
  if (!parts.length) return '';
  return `<p style="color:#333;margin:12px 0 8px;">${parts.join('<br/>')}</p>`;
}

function meetingBlockForEmail(w) {
  const href = safeMeetingHref(w.meeting_link);
  const linkRow = href
    ? `<p style="margin:8px 0;"><a href="${encodeURI(href)}" style="color:#2563eb;">Join link</a></p><p style="color:#666;font-size:12px;word-break:break-all;">${escapeHtml(href)}</p>`
    : '';
  const notes = w.meeting_notes
    ? `<p style="color:#555;font-size:13px;margin-top:10px;"><strong>Join instructions:</strong><br/>${escapeHtml(w.meeting_notes).replace(/\n/g, '<br/>')}</p>`
    : '';
  if (!linkRow && !notes) return '';
  return `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin:16px 0;">${linkRow}${notes}</div>`;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─────────────────────────────────────────
// ✅ CREATE WEBINAR REQUEST (public)
// ─────────────────────────────────────────
exports.createWebinar = async (req, res) => {
  try {
    const { org_name, org_type, contact_name, email, phone,
            attendees, preferred_date, mode, topic, message } = req.body;

    if (!org_name || !org_type || !contact_name || !email ||
        !phone || !attendees || !preferred_date || !mode || !topic) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    await db.query(
      `INSERT INTO webinar_requests
        (org_name, org_type, contact_name, email, phone, attendees, preferred_date, mode, topic, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [org_name, org_type, contact_name, email, phone,
       attendees, preferred_date, mode, topic, message || null]
    );

    // ✅ Email wrapped in try/catch so it never crashes the request
    try {
      await transporter.sendMail({
        from: `"CourseHub Webinars" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Webinar Request Received — ${topic}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1a1a2e;padding:24px 32px;border-radius:8px 8px 0 0;">
              <h2 style="color:#fff;margin:0;">CourseHub Webinars</h2>
            </div>
            <div style="background:#f9f9f9;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;">
              <p style="color:#333;font-size:15px;">Hi <strong>${contact_name}</strong>,</p>
              <p style="color:#333;">Thank you for requesting a webinar session. Here's a summary:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px;color:#666;border-bottom:1px solid #eee;">Organisation</td><td style="padding:8px;color:#333;border-bottom:1px solid #eee;"><strong>${org_name}</strong></td></tr>
                <tr><td style="padding:8px;color:#666;border-bottom:1px solid #eee;">Topic</td><td style="padding:8px;color:#333;border-bottom:1px solid #eee;">${topic}</td></tr>
                <tr><td style="padding:8px;color:#666;border-bottom:1px solid #eee;">Preferred Date</td><td style="padding:8px;color:#333;border-bottom:1px solid #eee;">${preferred_date}</td></tr>
                <tr><td style="padding:8px;color:#666;border-bottom:1px solid #eee;">Mode</td><td style="padding:8px;color:#333;border-bottom:1px solid #eee;">${mode}</td></tr>
                <tr><td style="padding:8px;color:#666;">Attendees</td><td style="padding:8px;color:#333;">${attendees}</td></tr>
              </table>
              <p style="color:#333;">Our team will review your request and get back to you within <strong>24 hours</strong> to confirm the slot.</p>
              <p style="color:#333;margin-bottom:0;">Best regards,<br><strong>CourseHub Webinar Team</strong></p>
            </div>
            <p style="text-align:center;color:#aaa;font-size:12px;margin-top:16px;">© ${new Date().getFullYear()} CourseHub. All rights reserved.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.warn('Email failed (non-critical):', mailErr.message);
    }

    res.json({ message: 'Webinar request submitted ✅' });

  } catch (err) {
    console.error('createWebinar error:', err);
    res.status(500).json({ error: 'Failed to submit request.' });
  }
};

// ─────────────────────────────────────────
// ✅ GET ALL REQUESTS (admin)
// ─────────────────────────────────────────
exports.getAllWebinars = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM webinar_requests ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllWebinars error:', err);
    res.status(500).json({ error: 'Failed to fetch webinar requests.' });
  }
};

// ─────────────────────────────────────────
// ✅ GET STATS (admin dashboard)
// ─────────────────────────────────────────
exports.getWebinarStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*)                              AS total,
        SUM(status = 'pending')               AS pending,
        SUM(status = 'confirmed')             AS confirmed,
        SUM(status = 'rejected')              AS rejected,
        SUM(status = 'completed')             AS completed
      FROM webinar_requests
    `);
    res.json(stats);
  } catch (err) {
    console.error('getWebinarStats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

// ─────────────────────────────────────────
// ✅ UPDATE STATUS (admin)
// ─────────────────────────────────────────
exports.updateWebinarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      admin_notes,
      scheduled_start,
      scheduled_end,
      meeting_link,
      meeting_notes,
    } = req.body;

    const allowed = ['pending', 'confirmed', 'rejected', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const ss = parseAdminDatetime(scheduled_start);
    const se = parseAdminDatetime(scheduled_end);
    const link = meeting_link != null && String(meeting_link).trim() ? String(meeting_link).trim() : null;
    const notes = meeting_notes != null && String(meeting_notes).trim() ? String(meeting_notes).trim() : null;

    await db.query(
      `UPDATE webinar_requests SET
        status = ?,
        admin_notes = ?,
        scheduled_start = ?,
        scheduled_end = ?,
        meeting_link = ?,
        meeting_notes = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, admin_notes || null, ss, se, link, notes, id]
    );

    const [rows] = await db.query(
      `SELECT * FROM webinar_requests WHERE id = ?`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Request not found.' });

    const w = rows[0];

    const slotHtml = formatSlotForEmail(w);
    const meetHtml = meetingBlockForEmail(w);
    const notesHtml = w.admin_notes
      ? `<p style="color:#555;font-size:13px;"><strong>Note from our team:</strong> ${escapeHtml(w.admin_notes).replace(/\n/g, '<br/>')}</p>`
      : '';

    const statusMessages = {
      confirmed: {
        subject: `Webinar Confirmed — ${w.topic}`,
        color: '#22c55e',
        msg: 'Your webinar session has been <strong>confirmed</strong>. Please see the scheduled time and join details below.',
      },
      rejected: {
        subject: `Webinar Request Update — ${w.topic}`,
        color: '#ef4444',
        msg: 'Unfortunately we are unable to accommodate your request at this time. Please feel free to submit a new request with alternative dates.',
      },
      completed: {
        subject: `Webinar Completed — ${w.topic}`,
        color: '#6366f1',
        msg: 'Thank you for hosting a webinar with us! We hope it was valuable for your audience.',
      },
    };

    if (statusMessages[status]) {
      const s = statusMessages[status];
      const sessionExtras =
        status === 'confirmed' || status === 'completed' ? `${slotHtml}${meetHtml}` : '';
      const rawSubject = s.subject.replace(/[\r\n]/g, ' ');
      try {
        await transporter.sendMail({
          from: `"CourseHub Webinars" <${process.env.EMAIL_USER}>`,
          to: w.email,
          subject: rawSubject,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#1a1a2e;padding:24px 32px;border-radius:8px 8px 0 0;">
                <h2 style="color:#fff;margin:0;">CourseHub Webinars</h2>
              </div>
              <div style="background:#f9f9f9;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;">
                <p style="color:#333;">Hi <strong>${escapeHtml(w.contact_name)}</strong>,</p>
                <div style="background:#fff;border-left:4px solid ${s.color};padding:16px 20px;border-radius:4px;margin:20px 0;">
                  <p style="color:#333;margin:0;">${s.msg}</p>
                </div>
                ${sessionExtras}
                ${notesHtml}
                <p style="color:#333;margin-bottom:0;">Best regards,<br><strong>CourseHub Webinar Team</strong></p>
              </div>
            </div>
          `
        });
      } catch (mailErr) {
        console.warn('Status email failed (non-critical):', mailErr.message);
      }
    }

    res.json({ message: `Status updated to ${status} ✅`, webinar: w });
  } catch (err) {
    console.error('updateWebinarStatus error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
};

// ─────────────────────────────────────────
// ✅ DELETE REQUEST (admin)
// ─────────────────────────────────────────
exports.deleteWebinar = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      `DELETE FROM webinar_requests WHERE id = ?`, [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    res.json({ message: 'Webinar request deleted ✅' });
  } catch (err) {
    console.error('deleteWebinar error:', err);
    res.status(500).json({ error: 'Failed to delete request.' });
  }
};