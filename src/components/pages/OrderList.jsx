import React, { useState, useEffect, useCallback } from 'react';
import './OrderList.css';
import { API_URL } from '../../lib/api.js';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ orderNumber: '', name: '', date: '', status: '' });

  const loadOrders = useCallback(async (f = {}) => {
    const params = new URLSearchParams();
    if (f.orderNumber && f.orderNumber.trim()) params.set('orderNumber', f.orderNumber.trim());
    if (f.name && f.name.trim()) params.set('name', f.name.trim());
    if (f.date) params.set('date', f.date);
    if (f.status) params.set('status', f.status);
    const query = params.toString();
    try {
      const res = await fetch(`${API_URL}/api/orders${query ? `?${query}` : ''}`);
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
    loadOrders(filters);
  };

  const totalAmount = orders.reduce(
    (s, o) => s + (Number(o.transactionAmount) || 0),
    0
  );
  const totalCommission = orders.reduce(
    (s, o) => s + (Number(o.commission) || 0),
    0
  );

  return (
    <div className="order-container">
      {/* Top Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Please enter your order number"
          className="filter-input"
          value={filters.orderNumber}
          onChange={(e) => setFilters((f) => ({ ...f, orderNumber: e.target.value }))}
        />
        <input
          type="text"
          placeholder="Please enter your username"
          className="filter-input"
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          type="date"
          placeholder="Start time"
          className="filter-input"
          value={filters.date}
          onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
        />
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Please select status</option>
          <option value="Waiting for Payment">Waiting for Payment</option>
          <option value="Complete payment">Complete payment</option>
        </select>
        <button className="search-btn" onClick={applySearch}>
          <i className="layui-icon layui-icon-search"></i>
        </button>
      </div>

      {/* Summary Cards and Total Count */}
      <div className="summary-bar">
        <div className="summary-cards-group">
          <div className="stat-card blue-card">
            Total transaction amount: {totalAmount.toFixed(2)}
          </div>
          <div className="stat-card teal-card">
            Total commission: {totalCommission.toFixed(2)}
          </div>
        </div>
        <div className="total-records">
          Total data: {orders.length} records
        </div>
      </div>

      {/* Data Table with Grid Lines */}
      <div className="table-responsive">
        <table className="order-table">
          <thead>
            <tr>
              <th>Order number</th>
              <th>Username</th>
              <th>User nickname</th>
              <th>Balance</th>
              <th>Upper-level user</th>
              <th>Unit price of goods</th>
              <th>Product Name</th>
              <th>Transaction volume</th>
              <th>Transaction amount</th>
              <th>commission</th>
              <th>Transaction status</th>
              <th>Order time</th>
              <th>Settlement time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '30px' }}>
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '30px' }}>
                  No records found
                </td>
              </tr>
            ) : (
              orders.map((item) => (
                <tr key={item._id}>
                  <td>{item.orderNumber}</td>
                  <td>{item.username}</td>
                  <td>{item.userNickname || '-'}</td>
                  <td>{Number(item.balance || 0).toFixed(2)}</td>
                  <td>{item.superiorId || '-'}</td>
                  <td>{Number(item.unitPrice || 0).toFixed(2)}</td>
                  <td className="product-name-cell">{item.productName}</td>
                  <td>{item.transactionVolume}</td>
                  <td>{Number(item.transactionAmount || 0).toFixed(2)}</td>
                  <td>{Number(item.commission || 0).toFixed(2)}</td>
                  <td className={item.transactionStatus === 'Complete payment' ? 'text-success' : 'text-warning'}>
                    {item.transactionStatus}
                  </td>
                  <td>{item.orderTime}</td>
                  <td>{item.settlementTime || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;