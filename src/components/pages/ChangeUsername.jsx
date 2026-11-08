import React, { useState } from 'react';
import './ChangePassword.css';
import { API_URL } from '../../lib/api.js';
import { getSessionToken, readSession, saveSession } from '../../lib/demoAuth.js';

const ChangeUsername = () => {
  const session = readSession();
  const [newUsername, setNewUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState(session?.username || '');
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const username = String(newUsername).trim().toLowerCase();
    if (!username) {
      setMsg({ type: 'error', text: 'New username is required' });
      return;
    }
    if (username.length > 50) {
      setMsg({ type: 'error', text: 'Username cannot exceed 50 characters' });
      return;
    }

    const token = getSessionToken();
    if (!token) {
      setMsg({ type: 'error', text: 'Session expired. Please login again.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin-change-username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newUsername: username }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        const updated = json.data?.username || username;
        saveSession(updated, token);
        setCurrentUsername(updated);
        setNewUsername('');
        setMsg({ type: 'success', text: json.message || 'Username updated successfully' });
        window.dispatchEvent(new CustomEvent('admin-username-changed', { detail: updated }));
      } else {
        setMsg({ type: 'error', text: json?.message || 'Unable to update username' });
      }
    } catch (error) {
      setMsg({ type: 'error', text: 'Unable to reach server' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cp-container">
      <div className="cp-card">
        <div className="cp-head">
          <i className="layui-icon layui-icon-username" />
          <h3>Change Username</h3>
        </div>

        <div className="cp-account">
          Current Username: <strong>{currentUsername}</strong>
        </div>

        <form className="cp-form" onSubmit={submit}>
          <label className="cp-label" htmlFor="cp-new-username">
            New Username
          </label>
          <input
            id="cp-new-username"
            className="cp-input"
            type="text"
            placeholder="Enter new username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />

          {msg && <div className={`cp-msg cp-msg-${msg.type}`}>{msg.text}</div>}

          <div className="cp-actions">
            <button type="submit" className="cp-btn" disabled={saving}>
              {saving ? 'Updating...' : 'Update Username'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeUsername;
