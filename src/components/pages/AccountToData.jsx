import React, { useState, useEffect, useCallback } from 'react';
import './WalletDetails.css';
import './MemberList.css';
import { API_URL } from '../../lib/api.js';

const AccountToData = ({ username = '', nickname = '', onClose }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', date: '' });

  const loadRecords = useCallback(
    async (f = {}) => {
      if (!username || !String(username).trim()) {
        setRecords([]);
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      params.set('name', String(username).trim());
      if (f.type) params.set('type', f.type);
      if (f.date) params.set('date', f.date);
      try {
        const res = await fetch(`${API_URL}/api/wallet-transactions?${params.toString()}`);
        const json = await res.json().catch(() => null);
        setRecords(json && json.success ? json.data : []);
      } catch (e) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    },
    [username]
  );

  useEffect(() => {
    setLoading(true);
    loadRecords({ type: filters.type, date: filters.date });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRecords]);

  const applySearch = () => {
    setLoading(true);
    loadRecords({ type: filters.type, date: filters.date });
  };

  return (
    <div className="wallet-container">
      {/* User title bar */}
      <div className="action-bar" style={{ marginTop: 0 }}>
        <div className="left-actions">
          <button className="btn-back-team" onClick={onClose}>
            ← Back
          </button>
          <span className="team-title">
            Account to Data of <b>{nickname || '-'}</b>
            {username ? <span className="team-code">User: {username}</span> : null}
          </span>
        </div>
        <div className="total-records">Total data: {records.length} records</div>
      </div>

      {/* Top Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          value={username}
          readOnly
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

export default AccountToData;