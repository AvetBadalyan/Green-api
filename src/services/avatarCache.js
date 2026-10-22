import { getAvatar } from './api';

// ─── Persistence ─────────────────────────────────────────────────────────────
// sessionStorage keeps avatars alive across page refreshes within the same tab.
// This is critical: with 100+ chats, every cold page load would otherwise fire
// 100+ getAvatar requests and burn through the monthly quota in minutes.
// sessionStorage is cleared when the tab closes or on explicit logout.

const STORAGE_KEY = 'gapi_avatars'; // single JSON object { chatId: url|null }

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToSession(chatId, url) {
  try {
    const existing = loadFromSession();
    existing[chatId] = url; // null is valid (= no photo)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // sessionStorage unavailable (private mode, storage full) — degrade silently
  }
}

function clearSession() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Pre-populated from sessionStorage so the first render after a refresh is instant.
const cache = new Map(Object.entries(loadFromSession()));
const inflight = new Map(); // chatId → Promise (deduplicates concurrent calls)
const queue = [];
let active = 0;
const MAX_CONCURRENT = 3; // stay well under GREEN-API rate limits

// ─── Fetch queue ─────────────────────────────────────────────────────────────

function drain() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const item = queue.shift();

    // May have been resolved while waiting in the queue
    if (cache.has(item.chatId)) { item.resolve(cache.get(item.chatId)); continue; }

    active++;
    getAvatar(item.credentials, item.chatId)
      .then((r) => {
        // urlAvatar can be an empty string when the contact has no photo
        const url = r?.available && r.urlAvatar?.trim() ? r.urlAvatar : null;
        cache.set(item.chatId, url);
        saveToSession(item.chatId, url);
        item.resolve(url);
      })
      .catch(() => {
        // On error (incl. quota exceeded) store null so we don't retry next render
        cache.set(item.chatId, null);
        saveToSession(item.chatId, null);
        item.resolve(null);
      })
      .finally(() => {
        active--;
        inflight.delete(item.chatId);
        setTimeout(drain, 50); // small breathing room between batches
      });
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Request the avatar URL for a chatId.
 *
 * - Returns immediately from cache if already fetched this session.
 * - Concurrent calls for the same chatId share one HTTP request.
 * - Returns null when no photo is set, the request fails, or quota is exceeded.
 */
export function requestAvatar(credentials, chatId) {
  if (!credentials || !chatId) return Promise.resolve(null);
  if (cache.has(chatId)) return Promise.resolve(cache.get(chatId));
  if (inflight.has(chatId)) return inflight.get(chatId);

  const promise = new Promise((resolve) => {
    queue.push({ chatId, credentials, resolve });
    drain();
  });
  inflight.set(chatId, promise);
  return promise;
}

/**
 * Clear all cached avatars.
 * Call on logout so the next account gets fresh photos.
 */
export function clearAvatarCache() {
  cache.clear();
  inflight.clear();
  queue.length = 0;
  active = 0;
  clearSession();
}
