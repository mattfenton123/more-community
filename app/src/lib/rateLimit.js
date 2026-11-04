const rateLimitMap = new Map();

/**
 * Basic in-memory rate limiter for server routes.
 * @param {string} identifier - IP or user/session identifier
 * @param {number} limit - maximum allowed requests within window
 * @param {number} windowMs - window size in milliseconds (default 60000 = 1 minute)
 * @returns {{ success: boolean, remaining: number, reset: number }}
 */
export function checkRateLimit(identifier, limit = 20, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier) || { count: 0, reset: now + windowMs };

  if (now > record.reset) {
    record.count = 0;
    record.reset = now + windowMs;
  }

  record.count += 1;
  rateLimitMap.set(identifier, record);

  // Periodic pruning if memory map grows large
  if (rateLimitMap.size > 2000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.reset) rateLimitMap.delete(key);
    }
  }

  return {
    success: record.count <= limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.reset
  };
}
