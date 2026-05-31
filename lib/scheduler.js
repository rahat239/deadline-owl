const supabase = require('./supabase');
const { sendDeadlineAlert } = require('./email');

async function runAlertScheduler() {
  console.log('Alert scheduler running at', new Date().toISOString());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all upcoming deadlines
  const { data: deadlines, error } = await supabase
    .from('deadlines')
    .select('*, users(email, email_alerts)')
    .eq('status', 'upcoming')
    .gte('due_date', today.toISOString().split('T')[0]);

  if (error) {
    console.error('Failed to fetch deadlines:', error.message);
    return;
  }

  console.log(`Checking ${deadlines?.length || 0} upcoming deadlines`);

  for (const deadline of deadlines || []) {
    const dueDate = new Date(deadline.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

    // Check if we should alert at this interval
    const alertDays = [];
    if (deadline.alert_30d) alertDays.push(30);
    if (deadline.alert_14d) alertDays.push(14);
    if (deadline.alert_7d) alertDays.push(7);
    if (deadline.alert_1d) alertDays.push(1);

    if (!alertDays.includes(daysLeft)) continue;
    if (!deadline.users?.email_alerts) continue;

    // Check if already sent this alert
    const { data: existing } = await supabase
      .from('alert_logs')
      .select('id')
      .eq('deadline_id', deadline.id)
      .eq('days_before', daysLeft)
      .single();

    if (existing) {
      console.log(`Alert already sent for ${deadline.title} at ${daysLeft} days`);
      continue;
    }

    // Send alert
    try {
      await sendDeadlineAlert({
        to: deadline.users.email,
        deadline,
        daysLeft,
      });

      // Log the alert
      await supabase.from('alert_logs').insert({
        deadline_id: deadline.id,
        days_before: daysLeft,
      });

      console.log(`Alert sent: ${deadline.title} — ${daysLeft} days left → ${deadline.users.email}`);
    } catch (err) {
      console.error(`Failed to send alert for ${deadline.title}:`, err.message);
    }

    // Small delay between emails
    await new Promise(r => setTimeout(r, 500));
  }

  // Auto-mark missed deadlines
  const { error: missedError } = await supabase
    .from('deadlines')
    .update({ status: 'missed' })
    .eq('status', 'upcoming')
    .lt('due_date', today.toISOString().split('T')[0]);

  if (missedError) console.error('Failed to mark missed:', missedError.message);
  else console.log('Missed deadlines updated');
}

module.exports = { runAlertScheduler };
