import React, { useState, useEffect, useCallback } from 'react';
import './BankCardList.css';
import { API_URL } from '../../lib/api.js';

const BankCardList = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', date: '' });
  const [applied, setApplied] = useState({ name: '', date: '' });
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branch: '',
    usdtAddress: '',
    usdtProtocol: 'ERC20',
    usdtFullName: '',
    wiseEmail: '',
    wiseFullName: '',
    revolutWallet: '',
    revolutFullName: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCards = useCallback(async (f = {}) => {
    const params = new URLSearchParams();
    if (f.name && f.name.trim()) params.set('name', f.name.trim());
    if (f.date) params.set('date', f.date);
    const query = params.toString();
    try {
      const res = await fetch(`${API_URL}/api/bank-cards${query ? `?${query}` : ''}`);
      const json = await res.json().catch(() => null);
      setCards(json && json.success ? json.data : []);
    } catch (e) {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const applySearch = () => {
    setLoading(true);
    setApplied(filters);
    loadCards(filters);
  };

  const openEdit = (card) => {
    setError('');
    setEditForm({
      bankName: card.bankName || '',
      accountNumber: card.accountNumber || '',
      accountHolderName: card.accountHolderName || '',
      branch: card.branch || '',
      usdtAddress: card.usdtAddress || '',
      usdtProtocol: card.usdtProtocol || 'ERC20',
      usdtFullName: card.usdtFullName || '',
      wiseEmail: card.wiseEmail || '',
      wiseFullName: card.wiseFullName || '',
      revolutWallet: card.revolutWallet || '',
      revolutFullName: card.revolutFullName || '',
    });
    setEditTarget(card);
  };

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      const fields = [
        'bankName',
        'accountNumber',
        'accountHolderName',
        'branch',
        'usdtAddress',
        'usdtProtocol',
        'usdtFullName',
        'wiseEmail',
        'wiseFullName',
        'revolutWallet',
        'revolutFullName',
      ];
      const body = {};
      for (const f of fields) body[f] = editForm[f];
      const res = await fetch(`${API_URL}/api/bank-cards/${editTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        setEditTarget(null);
        loadCards(applied);
      } else {
        setError((json && json.message) || 'Something went wrong, please try again');
      }
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bank-card-container">
      {/* Top Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Please enter your username"
          className="filter-input"
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
        />
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
        <span className="total-records">Total data: {cards.length} records</span>
      </div>

      {/* Data Table with Grid Lines & Horizontal Scroll */}
      <div className="table-responsive">
        <table className="bank-card-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>upper-level user</th>
              <th>Bank Name</th>
              <th>Card number</th>
              <th>Account Name</th>
              <th>USDT</th>
              <th>Wise</th>
              <th>Revolut</th>
              <th>Phone number</th>
              <th>Branch where the account was opened</th>
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
            ) : cards.length === 0 ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '30px' }}>
                  No bank cards found
                </td>
              </tr>
            ) : (
              cards.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.username}</td>
                  <td>{item.superiorId || '-'}</td>
                  <td>{item.bankName}</td>
                  <td>{item.accountNumber}</td>
                  <td>{item.accountHolderName}</td>
                  <td>
                    {item.usdtAddress ? (
                      <>
                        <div style={{ wordBreak: 'break-all' }}>{item.usdtAddress}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>
                          {item.usdtProtocol} · {item.usdtFullName}
                        </div>
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {item.wiseEmail ? (
                      <>
                        <div>{item.wiseEmail}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>
                          {item.wiseFullName}
                        </div>
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {item.revolutWallet ? (
                      <>
                        <div style={{ wordBreak: 'break-all' }}>{item.revolutWallet}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>
                          {item.revolutFullName}
                        </div>
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{item.phoneNumber || '-'}</td>
                  <td>{item.branch || '-'}</td>
                  <td>{item.time}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEdit(item)}>
                      edit
                    </button>
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
              <h3>Edit Bank Card</h3>
              <button
                className="withdrawal-modal-close"
                onClick={() => !saving && setEditTarget(null)}
              >
                &times;
              </button>
            </div>
            <div className="withdrawal-modal-body">
              {error && <div className="withdrawal-modal-error">{error}</div>}
              <label>Bank Name</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.bankName}
                onChange={(e) => setEditForm((f) => ({ ...f, bankName: e.target.value }))}
              />
              <label>Card number</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.accountNumber}
                onChange={(e) => setEditForm((f) => ({ ...f, accountNumber: e.target.value }))}
              />
              <label>Account Name</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.accountHolderName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, accountHolderName: e.target.value }))
                }
              />
              <label>Branch where the account was opened</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.branch}
                onChange={(e) => setEditForm((f) => ({ ...f, branch: e.target.value }))}
              />

              <div className="account-section-title">USDT Account</div>
              <label>USDT address</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.usdtAddress}
                onChange={(e) => setEditForm((f) => ({ ...f, usdtAddress: e.target.value }))}
              />
              <label>Protocol</label>
              <select
                className="withdrawal-modal-input"
                value={editForm.usdtProtocol}
                onChange={(e) => setEditForm((f) => ({ ...f, usdtProtocol: e.target.value }))}
              >
                <option value="ERC20">ERC20</option>
                <option value="TRC20">TRC20</option>
              </select>
              <label>Full Name</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.usdtFullName}
                onChange={(e) => setEditForm((f) => ({ ...f, usdtFullName: e.target.value }))}
              />

              <div className="account-section-title">Wise Account</div>
              <label>Wise account email</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.wiseEmail}
                onChange={(e) => setEditForm((f) => ({ ...f, wiseEmail: e.target.value }))}
              />
              <label>Full Name</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.wiseFullName}
                onChange={(e) => setEditForm((f) => ({ ...f, wiseFullName: e.target.value }))}
              />

              <div className="account-section-title">Revolut Account</div>
              <label>Wallet address</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.revolutWallet}
                onChange={(e) => setEditForm((f) => ({ ...f, revolutWallet: e.target.value }))}
              />
              <label>Full Name</label>
              <input
                type="text"
                className="withdrawal-modal-input"
                value={editForm.revolutFullName}
                onChange={(e) => setEditForm((f) => ({ ...f, revolutFullName: e.target.value }))}
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
    </div>
  );
};

export default BankCardList;