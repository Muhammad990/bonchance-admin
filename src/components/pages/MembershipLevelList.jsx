import React, { useEffect, useState, useCallback } from 'react';
import './MembershipLevelList.css';
import { API_URL } from '../../lib/api.js';

// Modal form fields (label -> model key)
const FIELDS = [
  { label: 'Daily order volume', key: 'dailyOrderVolume' },
  { label: 'Lowest price of goods', key: 'lowestPriceOfGoods' },
  { label: 'Highest price of goods', key: 'highestPriceOfGoods' },
  { label: 'Upgrade rewards', key: 'upgradeRewards' },
  { label: 'Minimum withdrawal amount', key: 'minWithdrawalAmount' },
  { label: 'Maximum withdrawal amount', key: 'maxWithdrawalAmount' },
  { label: 'Withdrawal fee rate', key: 'withdrawalFeeRate' },
  { label: 'Withdrawal limit on number of transactions', key: 'withdrawalLimitCount' },
  { label: 'Order commission rate', key: 'orderCommissionRate' },
  { label: 'Grade salary', key: 'gradeSalary' },
];

const emptyForm = () => ({
  name: '',
  picture: '',
  dailyOrderVolume: '',
  lowestPriceOfGoods: '',
  highestPriceOfGoods: '',
  upgradeRewards: '',
  minWithdrawalAmount: '',
  maxWithdrawalAmount: '',
  withdrawalFeeRate: '',
  withdrawalLimitCount: '',
  orderCommissionRate: '',
  gradeSalary: '',
});

const MembershipLevelList = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', level }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadLevels = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/membership-levels`);
      const json = await res.json().catch(() => null);
      setLevels(json && json.success ? json.data : []);
    } catch (e) {
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const openAdd = () => {
    setError(null);
    setForm(emptyForm());
    setModal({ mode: 'add', level: null });
  };

  const openEdit = (level) => {
    setError(null);
    const f = emptyForm();
    for (const key of Object.keys(f)) {
      f[key] = level[key] !== undefined && level[key] !== null ? String(level[key]) : '';
    }
    setForm(f);
    setModal({ mode: 'edit', level });
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setError(null);
  };

  const onImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, picture: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);
    const isEdit = modal && modal.mode === 'edit';
    const url = `${API_URL}/api/membership-levels${isEdit ? `/${modal.level._id}` : ''}`;

    try {
      const body = { name: form.name.trim(), picture: form.picture };
      for (const field of FIELDS) {
        body[field.key] = form[field.key];
      }

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        setModal(null);
        setForm(emptyForm());
        loadLevels();
      } else {
        setError((json && json.message) || 'Something went wrong, please try again');
      }
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/membership-levels/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteTarget(null);
        loadLevels();
      }
    } catch (e) {
      /* keep modal open on network error */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="membership-container">
      {/* Action Bar & Total Data Count */}
      <div className="action-bar">
        <button className="add-level-btn" onClick={openAdd}>
          Add membership level
        </button>
        <span className="total-records">Total data: {levels.length} records</span>
      </div>

      {/* Data Table with Horizontal Scroll */}
      <div className="table-responsive">
        <table className="membership-table">
          <thead>
            <tr>
              <th>Grade</th>
              <th>Name</th>
              <th>picture</th>
              <th>Daily order volume</th>
              <th>Top-up amount limit</th>
              <th>Upgrade Rewards</th>
              <th>Withdrawal range</th>
              <th>Withdrawal limit on the number of transactions</th>
              <th>Withdrawal fee rate</th>
              <th>Order commission rate</th>
              <th>Grade Salary</th>
              <th>Creation time</th>
              <th>Operate</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '30px' }}>
                  Loading...
                </td>
              </tr>
            ) : levels.length === 0 ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '30px' }}>
                  No membership levels found
                </td>
              </tr>
            ) : (
              levels.map((item) => (
                <tr key={item._id}>
                  <td>{item.grade}</td>
                  <td>{item.name}</td>
                  <td>
                    <img
                      src={item.picture}
                      alt={item.name}
                      className="membership-thumbnail"
                    />
                  </td>
                  <td>{item.dailyOrderVolume}</td>
                  <td>
                    {item.lowestPriceOfGoods} - {item.highestPriceOfGoods}
                  </td>
                  <td>{item.upgradeRewards}</td>
                  <td>
                    {item.minWithdrawalAmount} - {item.maxWithdrawalAmount}
                  </td>
                  <td>{item.withdrawalLimitCount}</td>
                  <td>{item.withdrawalFeeRate}</td>
                  <td>{item.orderCommissionRate}</td>
                  <td>{item.gradeSalary}</td>
                  <td>{item.creationTime}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => openEdit(item)}>
                        edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => setDeleteTarget(item)}
                      >
                        delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="product-modal-overlay" onClick={closeModal}>
          <div className="product-modal level" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h3>
                {modal.mode === 'edit' ? 'Edit membership level' : 'Add membership level'}
              </h3>
              <button className="product-modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="product-modal-body">
              {error && <div className="product-modal-error">{error}</div>}
              <div className="level-form-grid">
                <div className="level-field-full">
                  <label className="product-field-label">Name</label>
                  <input
                    type="text"
                    className="product-modal-input"
                    placeholder="Enter level name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="level-field-full">
                  <label className="product-field-label">Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="product-modal-file"
                    onChange={onImageChange}
                  />
                  {form.picture && (
                    <img
                      src={form.picture}
                      alt="preview"
                      className="product-modal-preview"
                    />
                  )}
                </div>
                {FIELDS.map((field) => (
                  <div className="level-field" key={field.key}>
                    <label className="product-field-label">{field.label}</label>
                    <input
                      type="text"
                      className="product-modal-input"
                      placeholder={field.label}
                      value={form[field.key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [field.key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="product-modal-footer">
              <button className="product-modal-btn cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="product-modal-btn add"
                onClick={submitForm}
                disabled={saving}
              >
                {saving ? 'Saving...' : modal.mode === 'edit' ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="product-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="product-modal confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="product-modal-header">
              <h3>Confirm delete</h3>
            </div>
            <div className="product-modal-body">
              <p>
                Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo; (Grade:{' '}
                {deleteTarget.grade})?
              </p>
            </div>
            <div className="product-modal-footer">
              <button
                className="product-modal-btn cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="product-modal-btn delete"
                onClick={doDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipLevelList;