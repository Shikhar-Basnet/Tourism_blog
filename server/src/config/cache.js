import { createClient } from "redis";

// Uses the REDIS_URL already provisioned on your Redis Cloud free plan
// (30MB, forever, no card) — nothing new to sign up for.
const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("error", (err) => console.error("Redis error:", err.message));

let isConnected = false;

export const connectRedis = async () => {
  if (isConnected) return;
  try {
    await redisClient.connect();
    isConnected = true;
    console.log("Redis connected");
  } catch (err) {
    // Redis is a nice-to-have cache, not a hard dependency — if it's ever
    // unreachable, the app should keep serving from Mongo, just uncached.
    console.error("Redis connection failed, continuing without cache:", err.message);
  }
};

// Wraps a DB-fetching function with a Redis cache. If Redis is down or a
// key isn't set, this just calls fetchFn and returns fresh data — callers
// never have to know or care whether the cache is available.
export const cacheGetOrSet = async (key, ttlSeconds, fetchFn) => {
  if (!isConnected) return fetchFn();

  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
  } catch {
    // fall through to a fresh fetch
  }

  const fresh = await fetchFn();

  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(fresh));
  } catch {
    // caching failed — not worth failing the request over
  }

  return fresh;
};

// Deletes every key matching a prefix — used to invalidate a list of cached
// entries at once (e.g. every "blogs:list:*" page) after a write.
export const cacheInvalidate = async (pattern) => {
  if (!isConnected) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length) await redisClient.del(keys);
  } catch {
    // non-fatal
  }
};

export default redisClient;