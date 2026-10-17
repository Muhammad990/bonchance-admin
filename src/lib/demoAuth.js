/*
 * demoAuth.js — Admin login logic.
 *
 * Credentials database se verify hote hain (Backend-server ke
 * POST /api/auth/admin-login se), password bcrypt se match hoti hai.
 *
 * Response shape wahi hai jo original controller deta tha:
 *   status 102 = fields missing  -> "Please fill in all fields"
 *   status 100 = captcha ghalat  -> "Incorrect captcha"
 *   status 101 = user/pass ghalat-> "Incorrect username or password!"
 *   status 200 = success         -> "Login successful" + url
 */

import { API_URL } from './api.js';

/*
 * Login check — username/password backend database se check hota hai.
 * Captcha abhi bhi client-side hi rahta hai (original UX same).
 */
export async function checkLogin({ username, password, code, expectedCaptcha }) {
  const u = (username || '').trim();
  const p = (password || '').trim();
  const c = (code || '').trim();

  if (!u || !p || !c) {
    return { status: 102, msg: 'Please fill in all fields' };
  }
  // Captcha case-insensitive check hoti hai
  const captchaOk =
    expectedCaptcha &&
    expectedCaptcha.trim().toLowerCase() === c.toLowerCase();
  if (!captchaOk) {
    return { status: 100, msg: 'Incorrect captcha' };
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    });
    const json = await res.json().catch(() => null);

    if (res.ok && json && json.success) {
      return {
        status: 200,
        msg: 'Login successful',
        url: '/public/admin/Index/main.html',
        token: json.data ? json.data.token : undefined,
      };
    }
    return { status: 101, msg: 'Incorrect username or password!' };
  } catch (e) {
    return { status: 500, msg: 'Unable to reach server' };
  }
}

// 12 ghante valid cookie (browser khud max-age khatam hone par delete kar deta hai)
const COOKIE_KEY = 'pid_admin';
const COOKIE_MAX_AGE = 12 * 60 * 60; // seconds

function getCookie(name) {
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

// Login ke baad session cookie save karo (12h valid)
export function saveSession(username, token) {
  const value = encodeURIComponent(
    JSON.stringify({
      username,
      token: token || Math.random().toString(36).slice(2),
      createdAt: Date.now(),
    })
  );
  document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

// Session cookie parho — null agar logged-in nahi / cookie nahi hai
export function readSession() {
  try {
    const raw = getCookie(COOKIE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.username) return null;
    return s;
  } catch (e) {
    return null;
  }
}

// Logout — cookie remove (max-age=0)
export function clearSession() {
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

// Session ka auth token (cookie se hi milta hai) — API calls ke liye
export function getSessionToken() {
  const s = readSession();
  return s && s.token ? s.token : null;
}
