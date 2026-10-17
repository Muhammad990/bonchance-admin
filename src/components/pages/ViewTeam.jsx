import React, { useCallback, useEffect, useState } from 'react';
import './MemberList.css';
import { API_URL } from '../../lib/api.js';
import { toRow } from './memberRow.js';

const ViewTeam = ({ invitationCode = '', nickname = '', onClose }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', status: '' });
  const [applied, setApplied] = useState({ name: '', status: '' });

  const loadTeam = useCallback(
    async (f = {}) => {
      if (!invitationCode || !String(invitationCode).trim()) {
        setRows([]);
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      params.set('referredByCode', invitationCode);
      if (f.name && f.name.trim()) params.set('name', f.name.trim());
      if (f.status) params.set('status', f.status);
      const query = params.toString();
      try {
        const res = await fetch(`${API_URL}/api/members${query ? `?${query}` : ''}`);
        const json = await res.json().catch(() => null);
        setRows(json && json.success && Array.isArray(json.data) ? json.data.map(toRow) : []);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [invitationCode]
  );

  useEffect(() => {
    loadTeam(applied);
  }, [loadTeam, applied]);

  const onSearch = () => setApplied({ ...filters });

  return (
    <div className="member-container">
      {/* Team title bar */}
      <div className="action-bar" style={{ marginTop: 0 }}>
        <div className="left-actions">
          <button className="btn-back-team" onClick={onClose}>
            ← Back
          </button>
          <span className="team-title">
            Team of <b>{nickname}</b>
            {invitationCode ? <span className="team-code">Invitation code: {invitationCode}</span> : null}
          </span>
        </div>
        <div className="total-records">Total data: {rows.length} records</div>
      </div>

      {/* Top Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Please enter your user account"
          className="filter-input"
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch();
          }}
        />
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Please select status</option>
          <option value="Enabled">Enabled</option>
          <option value="Disabled">Disabled</option>
        </select>
        <button className="search-btn" onClick={onSearch}>
          <i className="layui-icon layui-icon-search"></i>
        </button>
      </div>

      {/* Data Table with Grid Lines — same columns as member list, no Operate */}
      <div className="table-responsive">
        <table className="member-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input type="checkbox" />
              </th>
              <th>ID</th>
              <th>Basic Information</th>
              <th>Account Information</th>
              <th>Wallet information</th>
              <th>Task status</th>
              <th>Invitation code</th>
              <th>Login information</th>
              <th>Registration time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                  No members found
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr key={item.docId}>
                  <td className="checkbox-col">
                    <input type="checkbox" />
                  </td>
                  <td>{item.id}</td>
                  <td>
                    Account: {item.basicInfo.account}
                    <br />
                    Nickname: {item.basicInfo.nickname}
                    <br />
                    Level: {item.basicInfo.level}
                    <br />
                    Superior: {item.basicInfo.superior}
                    <br />
                    Agent: {item.basicInfo.agent}
                  </td>
                  <td>
                    Type: {item.accountInfo.type}
                    <br />
                    Status: {item.accountInfo.status}
                    <br />
                    Transactions: {item.accountInfo.transactions}
                    <br />
                    Credit: {item.accountInfo.credit}
                  </td>
                  <td>
                    Available Funds: {item.walletInfo.availableFunds}
                    <br />
                    Frozen Funds: {item.walletInfo.frozenFunds}
                    <br />
                    Total Deposits: {item.walletInfo.totalDeposits}
                    <br />
                    Total Withdrawals: {item.walletInfo.totalWithdrawals}
                    <br />
                    Total Commissions: {item.walletInfo.totalCommissions}
                  </td>
                  <td>{item.taskStatus}</td>
                  <td>{item.invitationCode}</td>
                  <td>
                    Login time: {item.loginInfo.loginTime}
                    <br />
                    Login IP: {item.loginInfo.loginIp}
                  </td>
                  <td>{item.registrationTime}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewTeam;
