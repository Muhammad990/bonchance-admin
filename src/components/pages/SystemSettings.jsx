import React, { useState, useEffect, useCallback } from 'react';
import './SystemSettings.css';
import { API_URL } from '../../lib/api.js';
import { getSessionToken } from '../../lib/demoAuth.js';

const SystemSettings = () => {
  const [transactionsDisabled, setTransactionsDisabled] = useState(false);
  const [disabledMessage, setDisabledMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`);
      const json = await res.json().catch(() => null);
      if (json && json.success && json.data) {
        setTransactionsDisabled(!!json.data.transactionsDisabled);
        setDisabledMessage(json.data.disabledMessage || '');
      }
    } catch (e) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const save = async () => {
    setMsg(null);
    setSaving(true);
    try {
      const token = getSessionToken();
      if (!token) {
        setMsg({ type: 'error', text: 'Session expired. Please login again.' });
        return;
      }
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionsDisabled,
          disabledMessage,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        setMsg({ type: 'success', text: 'Settings updated successfully' });
      } else {
        setMsg({ type: 'error', text: (json && json.message) || 'Unable to update settings' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Unable to reach server' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sys-settings-container">
      <div className="sys-settings-card">
        <div className="cp-head">
          <i className="layui-icon layui-icon-set" />
          <h3>Transaction Settings</h3>
        </div>

        {loading ? (
          <div style={{ padding: '20px 0', color: '#888888', fontSize: '13px' }}>Loading...</div>
        ) : (
          <>
            <div className="sys-row">
              <div className="sys-row-info">
                <div className="sys-row-title">Disable deposits &amp; withdrawals</div>
                <div className="sys-row-desc">
                  ON hone par users Deposit / Withdraw nahi kar sakein ge, aur unhe
                  neeche wala message dikhega.
                </div>
              </div>
              <label className="sys-switch">
                <input
                  type="checkbox"
                  checked={transactionsDisabled}
                  onChange={(e) => setTransactionsDisabled(e.target.checked)}
                />
                <span className="sys-slider" />
              </label>
            </div>

            <label className="cp-label" htmlFor="sys-msg">
              Message shown to users
            </label>
            <textarea
              id="sys-msg"
              className="sys-textarea"
              rows="3"
              value={disabledMessage}
              onChange={(e) => setDisabledMessage(e.target.value)}
              placeholder="Deposits and withdrawals are temporarily disabled..."
            />

            {msg && <div className={`cp-msg cp-msg-${msg.type}`}>{msg.text}</div>}

            <div className="sys-actions">
              <button className="cp-btn" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;