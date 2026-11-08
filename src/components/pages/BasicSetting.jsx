/*
 * BasicSetting.jsx — System Management > Basic Setting page.
 *
 * Frontend-only page: default values live in DEFAULT_VALUES and are loaded
 * into the form on mount. Save validates all six fields, then shows the
 * layer.msg toast ("Saved successfully") and logs the collected data.
 * The API call is intentionally left as a TODO inside saveBasicSetting().
 */
import React, { useEffect, useState } from 'react';
import './BasicSetting.css';
import LayerMsg, { MsgStateFactory } from '../login/LayerMsg.jsx';
import { API_URL } from '../../lib/api.js';
import { getSessionToken } from '../../lib/demoAuth.js';

// Default form values — loaded on page open and restored by "Reset"
const DEFAULT_VALUES = {
  defaultLanguage: 'ru',
  systemTimeZone: 'Asia/Bishkek',
  openingTime: '09:00:00',
  closingTime: '23:58:59',
  withdrawalStartTime: '01:00:00',
  withdrawalEndTime: '17:00:00',
};

// Select options (exact order, value codes used by the form)
const LANGUAGES = [
  { value: 'uk', label: 'Українська' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'it', label: 'Italien' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'ar', label: 'العربية' },
];

const TIME_ZONES = [
  'Asia/Bishkek',
  'Asia/Karachi',
  'Asia/Tashkent',
  'Asia/Almaty',
  'Asia/Dubai',
  'Asia/Shanghai',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Europe/London',
  'America/New_York',
  'UTC',
];

const BasicSetting = () => {
  const [form, setForm] = useState({ ...DEFAULT_VALUES });
  const [msg, setMsg] = useState(null); // layer.msg toast state
  const [saving, setSaving] = useState(false);

  // Load initial data from API
  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/settings`)
      .then((res) => res.json())
      .then((json) => {
        if (!alive || !json?.success || !json.data) return;
        setForm((current) => ({
          ...current,
          defaultLanguage: json.data.defaultLanguage || current.defaultLanguage,
          systemTimeZone: json.data.systemTimeZone || current.systemTimeZone,
          openingTime: json.data.openingTime || current.openingTime,
          closingTime: json.data.closingTime || current.closingTime,
          withdrawalStartTime: json.data.withdrawalStartTime || current.withdrawalStartTime,
          withdrawalEndTime: json.data.withdrawalEndTime || current.withdrawalEndTime,
        }));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Generic field change handler
  const updateField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Save handler: validate all 6 fields, then log + show success toast.
  // TODO: Connect this to an API when the backend endpoint is available
  //       (replace the console.log block with a fetch/axios call).
  const saveBasicSetting = async (data) => {
    const values = [
      data.defaultLanguage,
      data.systemTimeZone,
      data.openingTime,
      data.closingTime,
      data.withdrawalStartTime,
      data.withdrawalEndTime,
    ];

    if (values.some((v) => !String(v || '').trim())) {
      setMsg(MsgStateFactory('Please fill in all fields', 5, 6));
      return;
    }

    const token = getSessionToken();
    if (!token) {
      setMsg(MsgStateFactory('Session expired. Please login again.', 5, 6));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await response.json().catch(() => null);
      if (response.ok && json?.success) {
        setMsg(MsgStateFactory('Saved successfully', 1));
      } else {
        setMsg(MsgStateFactory(json?.message || 'Failed to save data', 5, 6));
      }
    } catch (error) {
      setMsg(MsgStateFactory('Unable to reach server', 5, 6));
    } finally {
      setSaving(false);
    }
  };

  // Reset restores the default values and clears any toast
  const handleReset = () => {
    setForm({ ...DEFAULT_VALUES });
    setMsg(null);
  };

  return (
    <div className="bs-container">
      <div className="bs-card">
        <div className="bs-head">
          <i className="layui-icon layui-icon-set" />
          <h3>Basic Setting</h3>
        </div>

        <form
          className="bs-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveBasicSetting(form);
          }}
        >
          {/* 1. Default language */}
          <div className="bs-row">
            <label className="bs-label" htmlFor="bs-language">
              Default language <span className="bs-required">*</span>
            </label>
            <div className="bs-control">
              <select
                id="bs-language"
                className="bs-input"
                value={form.defaultLanguage}
                onChange={updateField('defaultLanguage')}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. System time zone */}
          <div className="bs-row">
            <label className="bs-label" htmlFor="bs-timezone">
              System time zone <span className="bs-required">*</span>
            </label>
            <div className="bs-control">
              <select
                id="bs-timezone"
                className="bs-input"
                value={form.systemTimeZone}
                onChange={updateField('systemTimeZone')}
              >
                {TIME_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Opening Time */}
          <div className="bs-row">
            <label className="bs-label" htmlFor="bs-opening">
              Opening Time <span className="bs-required">*</span>
            </label>
            <div className="bs-control">
              <input
                id="bs-opening"
                type="time"
                step="1"
                className="bs-input"
                value={form.openingTime}
                onChange={updateField('openingTime')}
              />
            </div>
          </div>

          {/* 4. Closing Time */}
          <div className="bs-row">
            <label className="bs-label" htmlFor="bs-closing">
              Closing Time <span className="bs-required">*</span>
            </label>
            <div className="bs-control">
              <input
                id="bs-closing"
                type="time"
                step="1"
                className="bs-input"
                value={form.closingTime}
                onChange={updateField('closingTime')}
              />
            </div>
          </div>

          {/* 5. Withdrawal - Start Time */}
          <div className="bs-row">
            <label className="bs-label" htmlFor="bs-withdraw-start">
              Withdrawal - Start Time <span className="bs-required">*</span>
            </label>
            <div className="bs-control">
              <input
                id="bs-withdraw-start"
                type="time"
                step="1"
                className="bs-input"
                value={form.withdrawalStartTime}
                onChange={updateField('withdrawalStartTime')}
              />
            </div>
          </div>

          {/* 6. Withdrawal - End Time (with time zone hint) */}
          <div className="bs-row">
            <label className="bs-label" htmlFor="bs-withdraw-end">
              Withdrawal - End Time <span className="bs-required">*</span>
            </label>
            <div className="bs-control">
              <input
                id="bs-withdraw-end"
                type="time"
                step="1"
                className="bs-input"
                value={form.withdrawalEndTime}
                onChange={updateField('withdrawalEndTime')}
              />
              <span className="bs-hint">Time is based on the system time zone</span>
            </div>
          </div>

          {/* Actions */}
          <div className="bs-actions">
            <button type="submit" className="bs-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="bs-btn bs-btn-reset"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* layer.msg toast (success icon 1 / validation icon 5) */}
      {msg && <LayerMsg state={msg} onClose={() => setMsg(null)} />}
    </div>
  );
};

export default BasicSetting;
