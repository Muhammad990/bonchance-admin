import React, { useState, useEffect, useCallback } from 'react';
import './WalletDetails.css';
import { API_URL } from '../../lib/api.js';

const WalletDetails = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', type: '', date: '' });
  const [applied, setApplied] = useState({ name: '', type: '', date: '' });

  const loadRecords = useCallback(async (f = {}) => {
    const params = new URLSearchParams();
    if (f.name && f.name.trim()) params.set('name', f.name.trim());
    if (f.type) params.set('type', f.type);
    if (f.date) params.set('date', f.date);
    const query = params.toString();
    try {
      const res = await fetch(`${API_URL}/api/wallet-transactions${query ? `?${query}` : ''}`);
      const json = await res.json().catch(() => null);
      setRecords(json && json.success ? json.data : []);
    } catch (e) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const applySearch = () => {
    setLoading(true);
    setApplied(filters);
    loadRecords(filters);
  };

  return (
    <div className="wallet-container">
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
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">Please select status</option>
          <option>Income</option>
          <option>Expenditure</option>
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

      {/* Total Data Count Bar */}
      <div className="action-bar">
        <div className="empty-space"></div>
        <span className="total-records">Total data: {records.length} records</span>
      </div>

      {/* Data Table with Grid Lines */}
      <div className="table-responsive">
        <table className="wallet-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Upper-level user</th>
              <th>Type</th>
              <th>Before modification</th>
              <th>After modification</th>
              <th>State</th>
              <th>Amount</th>
              <th>Creation time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                  Loading...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                  No wallet transactions found
                </td>
              </tr>
            ) : (
              records.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.username}</td>
                  <td>{item.superiorId || '-'}</td>
                  <td>{item.description || item.type}</td>
                  <td>{Number(item.before || 0).toFixed(2)}</td>
                  <td>{Number(item.after || 0).toFixed(2)}</td>
                  <td className={item.type === 'Income' ? 'text-income' : 'text-expenditure'}>
                    {item.type}
                  </td>
                  <td className={item.type === 'Income' ? 'text-income' : 'text-expenditure'}>
                    {item.type === 'Income' ? '+' : '-'}
                    {Number(item.amount || 0).toFixed(2)}
                  </td>
                  <td>{item.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WalletDetails;