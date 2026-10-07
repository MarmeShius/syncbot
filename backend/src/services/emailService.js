import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  } else {
    if (process.env.NODE_ENV === "production") {
      transporter = {
        sendMail: async () => {
          throw new Error("SMTP is not configured; notification email was not delivered.");
        },
      };
    } else {
      // Development fallback: report the email without sending it.
      transporter = {
        sendMail: async (mailOptions) => {
          if (process.env.NODE_ENV !== "test") {
            console.log("\n[EMAIL DISPATCH - DEV SIMULATION]");
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Preview: ${mailOptions.text?.slice(0, 120)}...`);
            console.log("-----------------------------------------\n");
          }
          return { messageId: `dev-sim-${Date.now()}` };
        },
      };
    }
  }

  return transporter;
}

const defaultFrom = () => process.env.EMAIL_FROM || "SyncBot Support <no-reply@syncbot.com>";
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
const ticketReference = (ticket) => escapeHtml(ticket.ticketNumber || ticket.id || "ticket");

export async function sendEmail({ to, subject, html, text }) {
  if (!to) return null;
  try {
    const mail = getTransporter();
    const result = await mail.sendMail({
      from: defaultFrom(),
      to,
      subject,
      text: text || html?.replace(/<[^>]+>/g, "") || "",
      html: html || `<p>${escapeHtml(text)}</p>`,
    });
    if (process.env.NODE_ENV !== "test") {
      const isSimulation = String(result.messageId || "").startsWith("dev-sim-");
      console.info(
        isSimulation
          ? "Email was simulated in development; no email was sent."
          : `Email accepted by SMTP (${result.messageId || "message id unavailable"}).`
      );
    }
    return result;
  } catch (error) {
    console.error("Email send failed:", error.message);
    return null;
  }
}

export async function sendWelcomeEmail(user) {
  const name = escapeHtml(user?.name || "there");
  return sendEmail({
    to: user?.email,
    subject: "Welcome to SyncBot Support",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px"><h2 style="color:#065f46">Welcome to SyncBot</h2><p>Hello <strong>${name}</strong>,</p><p>Your customer account has been created. You can now sign in to submit support tickets and follow replies and status updates.</p><p>For your security, SyncBot will never ask you to send your password or verification code in a ticket.</p><p>SyncBot Support</p></div>`,
  });
}

export async function sendLoginNotificationEmail(user) {
  const name = escapeHtml(user?.name || "there");
  const signedInAt = new Date().toUTCString();
  return sendEmail({
    to: user?.email,
    subject: "New sign-in to your SyncBot account",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px"><h2 style="color:#065f46">New sign-in</h2><p>Hello <strong>${name}</strong>,</p><p>Your SyncBot account was just used to sign in at ${escapeHtml(signedInAt)}.</p><p>If this was you, no action is needed. If you do not recognize this sign-in, change your password and contact your workspace administrator.</p><p>SyncBot Support</p></div>`,
  });
}

export async function sendNewRegistrationAdminEmail(admin, newUser) {
  const name = escapeHtml(newUser?.name || "New customer");
  const email = escapeHtml(newUser?.email || "");
  const username = escapeHtml(newUser?.username || "");
  return sendEmail({
    to: admin?.email,
    subject: "A new customer registered on SyncBot",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px"><h2 style="color:#065f46">New customer registration</h2><p><strong>Name:</strong> ${name}</p><p><strong>Username:</strong> ${username}</p><p><strong>Email:</strong> ${email}</p></div>`,
  });
}

export async function sendTicketCreatedEmail(ticket, customer) {
  const reference = ticketReference(ticket);
  const name = escapeHtml(customer?.name || "Customer");
  const subject = `[Ticket #${ticket.ticketNumber || ticket.id}] Received: ${ticket.subject}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px">
      <h2 style="color:#065f46;margin-top:0">SyncBot Support</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We received your support ticket. A support agent will review it shortly according to the service targets.</p>
      <div style="background:#f8fafc;padding:16px;border-radius:6px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:#64748b">Ticket reference</p><p style="margin:4px 0 12px;font-weight:bold">${reference}</p>
        <p style="margin:0;font-size:13px;color:#64748b">Subject</p><p style="margin:4px 0 12px;font-weight:600">${escapeHtml(ticket.subject)}</p>
        <p style="margin:0;font-size:13px;color:#64748b">Category and priority</p><p style="margin:4px 0 0">${escapeHtml(ticket.category)} &bull; ${escapeHtml(ticket.priority)}</p>
      </div>
      <p>You can track updates and respond in your SyncBot Customer Portal.</p>
      <p style="color:#64748b;font-size:13px">SyncBot Support Operations</p>
    </div>`;
  return sendEmail({ to: customer?.email, subject, html });
}

export async function sendNewTicketStaffEmail(staff, ticket, customer) {
  const reference = ticketReference(ticket);
  const name = escapeHtml(customer?.name || "Customer");
  const email = escapeHtml(customer?.email || "");
  const subject = `[New ticket #${ticket.ticketNumber || ticket.id}] ${ticket.subject}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px">
      <h2 style="color:#065f46;margin-top:0">New SyncBot Support Ticket</h2>
      <p>A customer submitted a new ticket.</p>
      <p><strong>Ticket:</strong> ${reference}</p><p><strong>Subject:</strong> ${escapeHtml(ticket.subject)}</p>
      <p><strong>Customer:</strong> ${name} (${email})</p>
      <p><strong>Category:</strong> ${escapeHtml(ticket.category)}</p><p><strong>Priority:</strong> ${escapeHtml(ticket.priority)}</p>
      <p><strong>Status:</strong> ${escapeHtml(ticket.status)}</p>
      <p>Sign in to the SyncBot staff dashboard to review the ticket.</p>
    </div>`;
  return sendEmail({ to: staff?.email, subject, html });
}

export async function sendTicketAssignedEmail(ticket, agent) {
  const reference = ticketReference(ticket);
  const name = escapeHtml(agent?.name || "Agent");
  const subject = `[Assigned] Ticket #${ticket.ticketNumber || ticket.id} has been assigned to you`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px">
      <h2 style="color:#065f46;margin-top:0">SyncBot Agent Queue</h2><p>Hello <strong>${name}</strong>,</p>
      <p>Ticket <strong>${reference}</strong> has been assigned to your queue.</p>
      <p><strong>Subject:</strong> ${escapeHtml(ticket.subject)}</p><p><strong>Priority:</strong> ${escapeHtml(ticket.priority)}</p>
      <p>Please review the ticket and respond according to its service target.</p>
    </div>`;
  return sendEmail({ to: agent?.email, subject, html });
}

export async function sendMessageNotificationEmail(ticket, message, author, recipient, previousStatus = null) {
  if (!recipient?.email) return null;
  const reference = ticketReference(ticket);
  const recipientName = escapeHtml(recipient?.name || "there");
  const authorName = escapeHtml(author?.name || "Support Team");
  const statusUpdate = previousStatus && previousStatus !== ticket.status
    ? `<p>The ticket status changed from <strong>${escapeHtml(previousStatus)}</strong> to <strong>${escapeHtml(ticket.status)}</strong>.</p>`
    : "";
  const subject = `[Ticket #${ticket.ticketNumber || ticket.id}] New update from ${author?.name || "Support"}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px">
      <h2 style="color:#065f46;margin-top:0">SyncBot Ticket Update</h2>
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>A new message was added to ticket <strong>#${reference}</strong> (${escapeHtml(ticket.subject)}):</p>
      <div style="background:#f8fafc;border-left:4px solid #10b981;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:0 0 8px;font-weight:bold;color:#0f172a">${authorName}:</p>
        <p style="margin:0;color:#334155;white-space:pre-wrap">${escapeHtml(message.body)}</p>
      </div>
      ${statusUpdate}
      <p>Sign in to your SyncBot dashboard to review and reply.</p>
    </div>`;
  return sendEmail({ to: recipient.email, subject, html });
}

export async function sendTicketStatusChangedEmail(ticket, customer, previousStatus) {
  const reference = ticketReference(ticket);
  const name = escapeHtml(customer?.name || "Customer");
  const status = escapeHtml(ticket.status);
  const subject = `[Ticket #${ticket.ticketNumber || ticket.id}] Status update: ${ticket.status}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px">
      <h2 style="color:#065f46;margin-top:0">SyncBot Support</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>The status of your ticket <strong>#${reference}</strong> (${escapeHtml(ticket.subject)}) changed from <strong>${escapeHtml(previousStatus)}</strong> to <strong>${status}</strong>.</p>
      <p>Sign in to your Customer Portal to view the latest ticket details or reply to the support team.</p>
    </div>`;
  return sendEmail({ to: customer?.email, subject, html });
}

export async function sendTicketResolvedEmail(ticket, customer) {
  const reference = ticketReference(ticket);
  const name = escapeHtml(customer?.name || "Customer");
  const subject = `[Ticket #${ticket.ticketNumber || ticket.id}] Marked as Resolved - How did we do?`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px">
      <h2 style="color:#065f46;margin-top:0">SyncBot Support</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your support ticket <strong>#${reference}</strong> (${escapeHtml(ticket.subject)}) has been marked as <strong>Resolved</strong>.</p>
      <div style="background:#ecfdf5;padding:16px;margin:16px 0;text-align:center">
        <p style="margin:0 0 10px;font-weight:bold;color:#065f46">Please rate your support experience</p>
        <p style="margin:0;font-size:24px">★★★★★</p>
        <p style="margin:8px 0 0;font-size:13px;color:#047857">Open your ticket to leave a rating and feedback.</p>
      </div>
      <p>If you still need assistance, reply to the ticket in your Customer Portal.</p>
    </div>`;
  return sendEmail({ to: customer?.email, subject, html });
}
