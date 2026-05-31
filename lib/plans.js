const PLAN_LIMITS = {
  free: { maxDeadlines: 5 },
  pro: { maxDeadlines: 100 },
  enterprise: { maxDeadlines: 9999 },
};

function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

module.exports = { getPlanLimits };
