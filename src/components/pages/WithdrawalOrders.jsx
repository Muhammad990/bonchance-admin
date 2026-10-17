import React, { useState, useEffect, useCallback } from 'react';
import './WithdrawalOrders.css';
import { API_URL } from '../../lib/api.js';

const WithdrawalOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', state: '', date: '' });
  const [applied, setApplied] = useState({ name: '', state: '', date: '' });
  const [editTarget, setEditTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [editForm, setEditForm] = useState({ withdrawalAmount: '', handlingFee: '' });
  const [reviewReason, setReviewReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async (f = {}) => {
    const params = new URLSearchParams();
    if (f.name && f.name.trim()) params.set('name', f.name.trim());
    if (f.state) params.set('state', f.state);
    if (f.date) params.set('date', f.date);
    const query = params.toString();
    try {
      const res = await fetch(`${API_URL}/api/withdrawal-orders${query ? `?${query}` : ''}`);
      const json = await res.json().catch(() => null);
      setOrders(json && json.success ? json.data : []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const applySearch = () => {
    setLoading(true);
    setApplied(filters);
    loadOrders(filters);
  };

  const openEdit = (order) => {
    setError('');
    setEditForm({
      withdrawalAmount: String(order.withdrawalAmount || ''),
      handlingFee: String(order.handlingFee || ''),
    });
    setEditTarget(order);
  };

  const openReview = (order) => {
    setError('');
    setReviewReason('');
    setReviewTarget(order);
  };

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/withdrawal-orders/${editTarget._id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalAmount: editForm.withdrawalAmount.trim(),
          handlingFee: editForm.handlingFee.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        setEditTarget(null);
        loadOrders(applied);
      } else {
        setError((json && json.message) || 'Something went wrong, please try again');
      }
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const doApprove = async () => {
    if (!reviewTarget) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/withdrawal-orders/${reviewTarget._id}/approve`, {
        method: 'PUT',
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        setReviewTarget(null);
        setReviewReason('');
        loadOrders(applied);
      } else {
        setError((json && json.message) || 'Something went wrong, please try again');
      }
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const doReject = async () => {
    if (!reviewTarget) return;
    if (!reviewReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/withdrawal-orders/${reviewTarget._id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reviewReason.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        setReviewTarget(null);
        setReviewReason('');
        loadOrders(applied);
      } else {
        setError((json && json.message) || 'Something went wrong, please try again');
      }
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const totalWithdrawal = orders.reduce((s, o) => s + (Number(o.withdrawalAmount) || 0), 0);
  const totalFees = orders.reduce((s, o) => s + (Number(o.handlingFee) || 0), 0);

  return (
    <div className="withdrawal-container">
      {/* Top Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Please enter your user num"
          className="filter-input"
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
        />
        <select
          className="filter-select"
          value={filters.state}
          onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
        >
          <option value="">Please select status</option>
          <option>Approved</option>
          <option>Pending</option>
          <option>Rejected</option>
        </select>
        <input
          type="date"
          placeholder="Start time (e.g. 2026-09-19)"
          className="filter-input"
          value={filters.date}
          onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
        />
        <button className="search-btn" onClick={applySearch}>
          <i className="layui-icon layui-icon-search"></i>
        </button>
      </div>

      {/* Summary Cards and Total Count */}
      <div className="summary-bar">
        <div className="summary-cards-group">
          <div className="stat-card blue-card">
            Total withdrawals: {totalWithdrawal.toFixed(2)}
          </div>
          <div className="stat-card light-blue-card">
            Total fees: {totalFees.toFixed(2)}
          </div>
          <div className="stat-card orange-card">
            Total: {totalWithdrawal.toFixed(2)}
          </div>
        </div>
        <div className="total-records">
          Total data: {orders.length} records
        </div>
      </div>

      {/* Data Table with Grid Lines */}
      <div className="table-responsive">
        <table className="withdrawal-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Upper-level user</th>
              <th>Bank Information</th>
              <th>Withdrawal amount</th>
              <th>Handling fee</th>
              <th>State</th>
              <th>Review information</th>
              <th>Creation time</th>
              <th>Processing time</th>
              <th>Operate</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>
                  No withdrawal orders found
                </td>
              </tr>
            ) : (
              orders.map((item) => (
                <tr key={item._id}>
                  <td>{item.username}</td>
                  <td>{item.superiorId || '-'}</td>
                  <td className="bank-info-cell">{item.bankInformation || '-'}</td>
                  <td>{Number(item.withdrawalAmount || 0).toFixed(2)}</td>
                  <td>{Number(item.handlingFee || 0).toFixed(2)}</td>
                  <td>{item.state}</td>
                  <td>{item.reviewInformation || '-'}</td>
                  <td>{item.creationTime}</td>
                  <td>{item.processingTime || '-'}</td>
                  <td>
                    {item.state === 'Pending' ? (
                      <div className="action-buttons">
                        <button className="btn-edit" onClick={() => openEdit(item)}>
                          edit
                        </button>
                        <button className="btn-review" onClick={() => openReview(item)}>
                          review
                        </button>
                      </div>
                    ) : (
                      <span className="reviewed-label">reviewed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="withdrawal-modal-overlay" onClick={() => !saving && setEditTarget(null)}>
          <div className="withdrawal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="withdrawal-modal-header">
              <h3>Edit Withdrawal Order</h3>
              <button
                className="withdrawal-modal-close"
                onClick={() => !saving && setEditTarget(null)}
              >
                &times;
              </button>
            </div>
            <div className="withdrawal-modal-body">
              {error && <div className="withdrawal-modal-error">{error}</div>}
              <label>Withdrawal amount</label>
              <input
                type="number"
                className="withdrawal-modal-input"
                value={editForm.withdrawalAmount}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, withdrawalAmount: e.target.value }))
                }
              />
              <label>Handling fee (default 0)</label>
              <input
                type="number"
                className="withdrawal-modal-input"
                value={editForm.handlingFee}
                onChange={(e) => setEditForm((f) => ({ ...f, handlingFee: e.target.value }))}
              />
            </div>
            <div className="withdrawal-modal-footer">
              <button
                className="withdrawal-modal-btn cancel"
                onClick={() => setEditTarget(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="withdrawal-modal-btn add"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <div className="withdrawal-modal-overlay" onClick={() => !saving && setReviewTarget(null)}>
          <div className="withdrawal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="withdrawal-modal-header">
              <h3>Review Withdrawal Order</h3>
              <button
                className="withdrawal-modal-close"
                onClick={() => !saving && setReviewTarget(null)}
              >
                &times;
              </button>
            </div>
            <div className="withdrawal-modal-body">
              {error && <div className="withdrawal-modal-error">{error}</div>}
              <div className="review-summary">
                User: {reviewTarget.username} | Amount: {reviewTarget.withdrawalAmount}{' '}
                | Method: {reviewTarget.method}
              </div>
              <label>Reason (required for Turn Down)</label>
              <textarea
                className="withdrawal-modal-textarea"
                rows="4"
                placeholder="Enter review reason"
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
              />
            </div>
            <div className="withdrawal-modal-footer review-actions">
              <button
                className="withdrawal-modal-btn neutral"
                onClick={() => setReviewTarget(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="withdrawal-modal-btn danger"
                onClick={doReject}
                disabled={saving}
              >
                {saving ? 'Processing...' : 'Turn Down'}
              </button>
              <button
                className="withdrawal-modal-btn add"
                onClick={doApprove}
                disabled={saving}
              >
                {saving ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalOrders;