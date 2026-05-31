const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendDeadlineAlert({ to, deadline, daysLeft }) {
  const appUrl = process.env.APP_URL || 'https://deadlineowl.online';
  const urgencyColor = daysLeft <= 1 ? '#f87171' : daysLeft <= 7 ? '#fbbf24' : '#7c6cf8';
  const urgencyLabel = daysLeft <= 1 ? '🚨 URGENT' : daysLeft <= 7 ? '⚠️ Soon' : '📅 Upcoming';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:sans-serif;background:#0a0a0f;color:#f0f0f5;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:32px 24px}
.logo{font-size:1.4rem;font-weight:700;color:#7c6cf8;margin-bottom:32px}
.alert-box{background:#18181f;border:2px solid ${urgencyColor};border-radius:12px;padding:24px;margin-bottom:24px}
.badge{display:inline-block;background:${urgencyColor};color:#fff;padding:4px 12px;border-radius:100px;font-size:0.8rem;font-weight:700;margin-bottom:12px}
.title{font-size:1.3rem;font-weight:700;margin-bottom:8px}
.days{font-size:2.5rem;font-weight:700;color:${urgencyColor};margin:16px 0}
.meta{font-size:0.85rem;color:#8888a0;margin-bottom:8px}
.cta{display:inline-block;background:#7c6cf8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:20px}
.footer{margin-top:32px;font-size:0.78rem;color:#8888a0}
</style></head>
<body>
<div class="container">
  <div class="logo">🦉 DeadlineOwl</div>
  <div class="alert-box">
    <div class="badge">${urgencyLabel}</div>
    <div class="title">${deadline.title}</div>
    <div class="days">${daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}</div>
    ${deadline.description ? `<div class="meta">📝 ${deadline.description}</div>` : ''}
    ${deadline.jurisdiction ? `<div class="meta">📍 ${deadline.jurisdiction}</div>` : ''}
    ${deadline.category ? `<div class="meta">🏷️ ${deadline.category}</div>` : ''}
    <div class="meta">📅 Due: <strong>${new Date(deadline.due_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
    <a href="${appUrl}/dashboard" class="cta">View all deadlines →</a>
  </div>
  <div class="footer">
    You're receiving this from DeadlineOwl because you have an upcoming compliance deadline.<br>
    <a href="${appUrl}/dashboard" style="color:#7c6cf8">Manage your deadlines</a>
  </div>
</div>
</body>
</html>`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'DeadlineOwl <alerts@deadlineowl.online>',
    to,
    subject: `${urgencyLabel}: "${deadline.title}" is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html,
  });
}

async function sendWelcomeEmail({ to, name }) {
  const appUrl = process.env.APP_URL || 'https://deadlineowl.online';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:sans-serif;background:#0a0a0f;color:#f0f0f5;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:32px 24px}
.logo{font-size:1.4rem;font-weight:700;color:#7c6cf8;margin-bottom:32px}
.box{background:#18181f;border:1px solid rgba(124,108,248,0.3);border-radius:12px;padding:24px;margin-bottom:24px}
.cta{display:inline-block;background:#7c6cf8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:20px}
</style></head>
<body>
<div class="container">
  <div class="logo">🦉 DeadlineOwl</div>
  <div class="box">
    <h2 style="margin-bottom:12px">Welcome to DeadlineOwl${name ? ', ' + name : ''}!</h2>
    <p style="color:#d0d0e0;line-height:1.7">You'll never miss a compliance deadline again. Add your regulatory deadlines and we'll alert you automatically at 30, 14, 7, and 1 day before each one.</p>
    <p style="color:#d0d0e0;line-height:1.7">Your free plan includes up to 5 active deadlines. Upgrade to Pro for unlimited deadlines and team features.</p>
    <a href="${appUrl}/dashboard" class="cta">Add your first deadline →</a>
  </div>
</div>
</body>
</html>`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'DeadlineOwl <alerts@deadlineowl.online>',
    to,
    subject: '🦉 Welcome to DeadlineOwl — never miss a compliance deadline',
    html,
  });
}

module.exports = { sendDeadlineAlert, sendWelcomeEmail };
