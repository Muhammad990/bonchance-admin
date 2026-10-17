import React, { useState, useEffect, useCallback } from 'react';
import './RechargeOrders.css';
import { API_URL } from '../../lib/api.js';

const RechargeOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', state: '', date: '' });
  const [applied, setApplied] = useState({ name: '', state: '', date: '' });
  const [actingId, setActingId] = useState(null);
  const [confirmOrder, setConfirmOrder] = useState(null);

  const loadOrders = useCallback(async (f = {}) => {
    const params = new URLSearchParams();
    if (f.name && f.name.trim()) params.set('name', f.name.trim());
    if (f.state) params.set('state', f.state);
    if (f.date) params.set('date', f.date);
    const query = params.toString();
    try {
      const res = await fetch(`${API_URL}/api/recharge-orders${query ? `?${query}` : ''}`);
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

  const confirmApprove = async () => {
    if (!confirmOrder) return;
    setActingId(confirmOrder._id);
    try {
      const res = await fetch(`${API_URL}/api/recharge-orders/${confirmOrder._id}/approve`, {
        method: 'PUT',
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        loadOrders(applied);
      } else {
        window.alert((json && json.message) || 'Something went wrong, please try again');
      }
    } catch (e) {
      window.alert('Unable to reach server');
    } finally {
      setActingId(null);
      setConfirmOrder(null);
    }
  };

  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.rechargeAmount) || 0), 0);

  return (
    <div className="recharge-container">
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
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
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
            Total recharge amount: {totalAmount.toFixed(2)}
          </div>
          <div className="stat-card orange-card">
            Total: {totalAmount.toFixed(2)}
          </div>
        </div>
        <div className="total-records">
          Total data: {orders.length} records
        </div>
      </div>

      {/* Data Table with Grid Lines */}
      <div className="table-responsive">
        <table className="recharge-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Superior ID</th>
              <th>Bank Information</th>
              <th>Recharge amount</th>
              <th>Payment voucher</th>
              <th>State</th>
              <th>Creation time</th>
              <th>Processing time</th>
              <th>Operate</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                  No recharge orders found
                </td>
              </tr>
            ) : (
              orders.map((item) => (
                <tr key={item._id}>
                  <td>{item.username}</td>
                  <td>{item.superiorId || '-'}</td>
                  <td className="bank-info-cell">
                    Bank Name: {item.bankName}
                    {'\n'}
                    Bank Card Number: {item.cardNumber}
                    {'\n'}
                    Account Holder Name: {item.accountHolderName}
                  </td>
                  <td>{Number(item.rechargeAmount || 0).toFixed(2)}</td>
                  <td>{item.paymentVoucher || 'none'}</td>
                  <td>{item.state}</td>
                  <td>{item.creationTime}</td>
                  <td>{item.processingTime || '-'}</td>
                  <td>
                    {item.state === 'Pending' ? (
                      <button
                        className="btn-operate"
                        onClick={() => setConfirmOrder(item)}
                        disabled={actingId === item._id}
                      >
                        {actingId === item._id ? 'Approving...' : 'Approve'}
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Approve Confirmation Popup */}
      {confirmOrder && (
        <div className="recharge-confirm-overlay" onClick={() => setConfirmOrder(null)}>
          <div className="recharge-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="recharge-confirm-icon">
              <i className="layui-icon layui-icon-tips"></i>
            </div>
            <div className="recharge-confirm-title">Approve Recharge Order</div>
            <p className="recharge-confirm-text">
              Approve recharge order of {confirmOrder.username} for{' '}
              {Number(confirmOrder.rechargeAmount || 0).toFixed(2)}?
            </p>
            <div className="recharge-confirm-actions">
              <button
                className="recharge-confirm-btn recharge-confirm-cancel"
                onClick={() => setConfirmOrder(null)}
              >
                Cancel
              </button>
              <button
                className="recharge-confirm-btn recharge-confirm-ok"
                onClick={confirmApprove}
                disabled={actingId === confirmOrder._id}
              >
                {actingId === confirmOrder._id ? 'Approving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RechargeOrders;