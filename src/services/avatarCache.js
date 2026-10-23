import { getAvatar } from './api';
import { AVATAR_MAX_CONCURRENT, AVATAR_QUEUE_DELAY_MS, STORAGE_KEYS } from '../constants';

// ─── Persistence ─────────────────────────────────────────────────────────────
// sessionStorage keeps avatars alive across page refreshes within the same tab.
// This is critical: with 100+ chats, every cold page load would otherwise fire
// 100+ getAvatar requests and burn through the monthly quota in minutes.
// sessionStorage is cleared when the tab closes or on explicit logout.

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.AVATARS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToSession(chatId, url) {
  try {
    const existing = loadFromSession();
    existing[chatId] = url; // null is valid (= no photo)
    sessionStorage.setItem(STORAGE_KEYS.AVATARS, JSON.stringify(existing));
  } catch {
    // sessionStorage unavailable (private mode, storage full) — degrade silently
  }
}

function clearSession() {
  try { sessionStorage.removeItem(STORAGE_KEYS.AVATARS); } catch {}
}

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Pre-populated from sessionStorage so the first render after a refresh is instant.
const cache = new Map(Object.entries(loadFromSession()));
const pendingFetches = new Map(); // chatId → pending Promise, deduplicates concurrent requests
const queue = [];
let activeFetchCount = 0;

// ─── Fetch queue ─────────────────────────────────────────────────────────────

function drain() {
  while (activeFetchCount < AVATAR_MAX_CONCURRENT && queue.length > 0) {
    const item = queue.shift();

    // May have been resolved while waiting in the queue
    if (cache.has(item.chatId)) { item.resolve(cache.get(item.chatId)); continue; }

    activeFetchCount++;
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
        activeFetchCount--;
        pendingFetches.delete(item.chatId);
        setTimeout(drain, AVATAR_QUEUE_DELAY_MS);
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
  if (pendingFetches.has(chatId)) return pendingFetches.get(chatId);

  const promise = new Promise((resolve) => {
    queue.push({ chatId, credentials, resolve });
    drain();
  });
  pendingFetches.set(chatId, promise);
  return promise;
}

/**
 * Clear all cached avatars.
 * Call on logout so the next account gets fresh photos.
 */
export function clearAvatarCache() {
  cache.clear();
  pendingFetches.clear();
  queue.length = 0;
  activeFetchCount = 0;
  clearSession();
}
