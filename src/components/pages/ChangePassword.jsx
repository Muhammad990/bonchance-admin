import React, { useState } from 'react';
import './ChangePassword.css';
import { API_URL } from '../../lib/api.js';
import { getSessionToken, readSession } from '../../lib/demoAuth.js';
import EyeToggle from '../EyeToggle.jsx';

const ChangePassword = ({ onClose }) => {
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const session = readSession();

  const updateField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleShow = (key) => () =>
    setShow((s) => ({ ...s, [key]: !s[key] }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!form.oldPassword || !form.newPassword) {
      setMsg({ type: 'error', text: 'Please fill in old and new password' });
      return;
    }
    if (String(form.newPassword).length < 6) {
      setMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    const token = getSessionToken();
    if (!token) {
      setMsg({ type: 'error', text: 'Session expired. Please login again.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin-change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        }),
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json && json.success) {
        setMsg({ type: 'success', text: json.message || 'Password updated successfully' });
        setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMsg({ type: 'error', text: (json && json.message) || 'Unable to update password' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Unable to reach server' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cp-container">
      <div className="cp-card">
        <div className="cp-head">
          <i className="layui-icon layui-icon-password" />
          <h3>Change Password</h3>
        </div>

        {session && (
          <div className="cp-account">
            Account: <strong>{session.username}</strong>
          </div>
        )}

        <form className="cp-form" onSubmit={submit}>
          <label className="cp-label" htmlFor="cp-old">
            Old Password
          </label>
          <div className="pwd-field">
            <input
              id="cp-old"
              className="cp-input"
              type={show.old ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter old password"
              value={form.oldPassword}
              onChange={updateField('oldPassword')}
            />
            <EyeToggle show={show.old} onClick={toggleShow('old')} />
          </div>

          <label className="cp-label" htmlFor="cp-new">
            New Password
          </label>
          <div className="pwd-field">
            <input
              id="cp-new"
              className="cp-input"
              type={show.new ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Enter new password (min 6 characters)"
              value={form.newPassword}
              onChange={updateField('newPassword')}
            />
            <EyeToggle show={show.new} onClick={toggleShow('new')} />
          </div>

          <label className="cp-label" htmlFor="cp-confirm">
            Confirm New Password
          </label>
          <div className="pwd-field">
            <input
              id="cp-confirm"
              className="cp-input"
              type={show.confirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
            />
            <EyeToggle show={show.confirm} onClick={toggleShow('confirm')} />
          </div>

          {msg && <div className={`cp-msg cp-msg-${msg.type}`}>{msg.text}</div>}

          <div className="cp-actions">
            {onClose && (
              <button type="button" className="cp-btn cp-btn-ghost" onClick={onClose}>
                Close
              </button>
            )}
            <button type="submit" className="cp-btn" disabled={saving}>
              {saving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
