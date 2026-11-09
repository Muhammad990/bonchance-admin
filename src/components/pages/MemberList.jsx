import React, { useCallback, useEffect, useState } from 'react';
import './MemberList.css';
import { API_URL } from '../../lib/api.js';
import { toRow } from './memberRow.js';

const emptyForm = () => ({
  phoneNumber: '',
  nickname: '',
  creditScore: '100',
  loginPassword: '',
  withdrawPassword: '',
  vipLevel: '',
  superiorId: '5983',
  todaySalaryPendingPayment: '0',
  amount: '',
  totalCommissions: '',
});

const EDIT_FIELDS = [
  { label: 'Phone Number', key: 'phoneNumber', type: 'text', placeholder: 'Enter phone number' },
  { label: 'Nickname', key: 'nickname', type: 'text', placeholder: 'Enter nickname' },
  { label: 'Credit Score', key: 'creditScore', type: 'number', placeholder: '100' },
  { label: 'Superior Id', key: 'superiorId', type: 'text', placeholder: '5983' },
  { label: 'Today Salary Pending Payment', key: 'todaySalaryPendingPayment', type: 'number', placeholder: '0' },
];

const MemberList = () => {
  const [membersData, setMembersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ name: '', userType: '', status: '', date: '' });
  const [applied, setApplied] = useState({ name: '', userType: '', status: '', date: '' });

  const [orderSettingMember, setOrderSettingMember] = useState(null);
  const [orderSettingProducts, setOrderSettingProducts] = useState([]);
  const [orderSettingLoaded, setOrderSettingLoaded] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [pickerProducts, setPickerProducts] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerIndex, setPickerIndex] = useState(null);
  const [pickerMultipliers, setPickerMultipliers] = useState({});
  const [pickerReturns, setPickerReturns] = useState({});
  const [pickerPriceStart, setPickerPriceStart] = useState('');
  const [pickerPriceEnd, setPickerPriceEnd] = useState('');
  const [appliedPickerRange, setAppliedPickerRange] = useState(null);

  const pickerRangeStart = Number(pickerPriceStart);
  const pickerRangeEnd = Number(pickerPriceEnd);
  const pickerRangeInvalid =
    pickerPriceStart !== '' &&
    pickerPriceEnd !== '' &&
    Number.isFinite(pickerRangeStart) &&
    Number.isFinite(pickerRangeEnd) &&
    pickerRangeStart > pickerRangeEnd;
  const filteredPickerProducts = appliedPickerRange
    ? pickerProducts.filter((product) => {
        const price = Number(product.price) || 0;
        const [start, end] = appliedPickerRange;
        return price >= start && price <= end;
      })
    : pickerProducts;

  const loadMembers = useCallback(async (f = {}) => {
    const params = new URLSearchParams();
    if (f.name && f.name.trim()) params.set('name', f.name.trim());
    if (f.userType) params.set('userType', f.userType);
    if (f.status) params.set('status', f.status);
    if (f.date) params.set('date', f.date);
    const query = params.toString();
    try {
      const res = await fetch(`${API_URL}/api/members${query ? `?${query}` : ''}`);
      const json = await res.json().catch(() => null);
      setMembersData(
        json && json.success && Array.isArray(json.data) ? json.data.map(toRow) : []
      );
    } catch (e) {
      setMembersData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLevels = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/membership-levels`);
      const json = await res.json().catch(() => null);
      setLevels(json && json.success && Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setLevels([]);
    }
  }, []);

  useEffect(() => {
    loadMembers(applied);
  }, [loadMembers, applied]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const reload = () => loadMembers(applied);

  const onSearch = () => setApplied({ ...filters });

  const openModal = (mode, member, extra = {}) => {
    setError(null);
    const f = emptyForm();
    if (mode === 'edit') {
      f.phoneNumber = member.basicInfo.account;
      f.nickname = member.basicInfo.nickname;
      f.creditScore = member.accountInfo.credit;
      f.vipLevel = member.basicInfo.level;
      f.superiorId = member.superiorIdRaw || '5983';
      f.todaySalaryPendingPayment = String(member.salaryPending ?? 0);
    }
    if (mode === 'commission') {
      f.totalCommissions = member.walletInfo.totalCommissions;
    }
    setForm(f);
    setModal({ mode, member, ...extra });
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setError(null);
  };

  const onChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const request = async (url, method, body) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json && json.success) return { ok: true, json };
    return { ok: false, message: (json && json.message) || 'Something went wrong, please try again' };
  };

  const finish = () => {
    setModal(null);
    setForm(emptyForm());
    reload();
  };

  const submitAdd = async () => {
    const requiredKeys = [
      'phoneNumber',
      'nickname',
      'creditScore',
      'loginPassword',
      'withdrawPassword',
      'superiorId',
      'todaySalaryPendingPayment',
    ];
    const LABELS = {
      phoneNumber: 'Phone Number',
      nickname: 'Nickname',
      creditScore: 'Credit Score',
      loginPassword: 'Login Password',
      withdrawPassword: 'Withdraw Password',
      superiorId: 'Superior Id',
      todaySalaryPendingPayment: 'Today Salary Pending Payment',
      vipLevel: 'VIP Level',
    };
    const missing = requiredKeys
      .filter((key) => String(form[key]).trim() === '')
      .map((key) => LABELS[key]);
    if (!form.vipLevel) missing.push(LABELS.vipLevel);

    if (missing.length > 0) {
      setError(`Required fields: ${missing.join(', ')}`);
      return;
    }
    if (String(form.loginPassword).length < 6) {
      setError('Login password must be at least 6 characters');
      return;
    }
    if (String(form.withdrawPassword).length < 6) {
      setError('Withdraw password must be at least 6 characters');
      return;
    }
    if (!Number.isFinite(Number(form.creditScore)) || Number(form.creditScore) < 0) {
      setError('Credit score must be a non-negative number');
      return;
    }
    if (
      !Number.isFinite(Number(form.todaySalaryPendingPayment)) ||
      Number(form.todaySalaryPendingPayment) < 0
    ) {
      setError('Today salary pending payment must be a non-negative number');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await request(`${API_URL}/api/members`, 'POST', {
        phoneNumber: form.phoneNumber.trim(),
        nickname: form.nickname.trim(),
        creditScore: Number(form.creditScore),
        loginPassword: form.loginPassword,
        withdrawPassword: form.withdrawPassword,
        vipLevel: form.vipLevel,
        superiorId: form.superiorId.trim(),
        todaySalaryPendingPayment: Number(form.todaySalaryPendingPayment),
      });
      if (result.ok) finish();
      else setError(result.message);
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    const missing = [];
    for (const field of EDIT_FIELDS) {
      if (String(form[field.key]).trim() === '') missing.push(field.label);
    }
    if (!form.vipLevel) missing.push('VIP Level');
    if (missing.length > 0) {
      setError(`Required fields: ${missing.join(', ')}`);
      return;
    }
    if (!Number.isFinite(Number(form.creditScore)) || Number(form.creditScore) < 0) {
      setError('Credit score must be a non-negative number');
      return;
    }
    if (
      !Number.isFinite(Number(form.todaySalaryPendingPayment)) ||
      Number(form.todaySalaryPendingPayment) < 0
    ) {
      setError('Today salary pending payment must be a non-negative number');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await request(
        `${API_URL}/api/members/${modal.member.docId}`,
        'PUT',
        {
          phoneNumber: form.phoneNumber.trim(),
          nickname: form.nickname.trim(),
          creditScore: Number(form.creditScore),
          vipLevel: form.vipLevel,
          superiorId: form.superiorId.trim(),
          todaySalaryPendingPayment: Number(form.todaySalaryPendingPayment),
        }
      );
      if (result.ok) finish();
      else setError(result.message);
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const submitBalance = async (action) => {
    const value = Number(form.amount);
    if (String(form.amount).trim() === '') {
      setError('Please enter an amount');
      return;
    }
    if (!Number.isFinite(value)) {
      setError('Amount must be a valid number');
      return;
    }
    if (value < 0) {
      setError('Amount cannot be negative');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await request(
        `${API_URL}/api/members/${modal.member.docId}/balance`,
        'PUT',
        { amount: value, action }
      );
      if (result.ok) finish();
      else setError(result.message);
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const submitCommission = async () => {
    const value = Number(form.totalCommissions);
    if (String(form.totalCommissions).trim() === '') {
      setError('Commission is required');
      return;
    }
    if (!Number.isFinite(value) || value < 0) {
      setError('Commission must be a non-negative number');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await request(
        `${API_URL}/api/members/${modal.member.docId}/commission`,
        'PUT',
        { totalCommissions: value }
      );
      if (result.ok) finish();
      else setError(result.message);
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async () => {
    const login = form.loginPassword;
    const withdraw = form.withdrawPassword;
    if (!login && !withdraw) {
      setError('Enter at least one password to change, leave blank to keep the old one');
      return;
    }
    if (login && login.length < 6) {
      setError('Login password must be at least 6 characters');
      return;
    }
    if (withdraw && withdraw.length < 6) {
      setError('Withdraw password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const body = {};
      if (login) body.loginPassword = login;
      if (withdraw) body.withdrawPassword = withdraw;
      const result = await request(
        `${API_URL}/api/members/${modal.member.docId}/password`,
        'PUT',
        body
      );
      if (result.ok) finish();
      else setError(result.message);
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const applyState = async (updates) => {
    setSaving(true);
    setError(null);
    try {
      const result = await request(
        `${API_URL}/api/members/${modal.member.docId}/state`,
        'PUT',
        updates
      );
      if (result.ok) finish();
      else setError(result.message);
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const submitConfirm = async () => {
    const { confirmUpdates, confirmAction } = modal;
    if (confirmAction === 'resetOrder') {
      await resetOrderSetting(modal.member.docId);
      return;
    }
    await applyState(confirmUpdates);
  };

  const toggleUserType = async (member, nextType) => {
    setSaving(true);
    try {
      const result = await request(
        `${API_URL}/api/members/${member.docId}/state`,
        'PUT',
        { userType: nextType }
      );
      if (result.ok) reload();
    } catch (e) {
      /* keep list as is on network error */
    } finally {
      setSaving(false);
    }
  };

  const dailyVolumeOf = (levelName) => {
    const l = levels.find((x) => x.name === levelName);
    const volume = Number(l?.dailyOrderVolume);
    return Number.isFinite(volume) && volume > 0 ? Math.floor(volume) : 30;
  };

  const loadPickerProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const json = await res.json().catch(() => null);
      setPickerProducts(json && json.success && Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setPickerProducts([]);
    }
  };

  const openOrderSetting = async (item) => {
    setSettingsError(null);
    setSettingsMsg(null);
    setOrderSettingLoaded(false);
    setOrderSettingProducts([]);
    await loadPickerProducts();
    setOrderSettingMember(item);
    try {
      const res = await fetch(`${API_URL}/api/members/${item.docId}/order-setting`);
      const json = await res.json().catch(() => null);
      if (json && json.success) {
        setOrderSettingProducts(Array.isArray(json.data.products) ? json.data.products : []);
      }
    } catch (e) {
      /* keep empty */
    } finally {
      setOrderSettingLoaded(true);
    }
  };

  const closeOrderSetting = () => {
    if (settingsSaving) return;
    setOrderSettingMember(null);
    setOrderSettingProducts([]);
    setPickerOpen(false);
    setPickerIndex(null);
  };

  const openPicker = (orderNumber) => {
    setSettingsError(null);
    setSettingsMsg(null);
    setPickerPriceStart('');
    setPickerPriceEnd('');
    setAppliedPickerRange(null);
    const existing = orderNumber !== null
      ? orderSettingProducts.find((product) => Number(product.orderNumber) === orderNumber)
      : null;
    setPickerReturns(
      existing && existing.returnAmount !== undefined && existing.returnAmount !== null
        ? { [existing.productId]: String(existing.returnAmount) }
        : {}
    );
    if (existing) {
      setPickerMultipliers((current) => ({
        ...current,
        [existing.productId]: existing.multiplier ?? 1,
      }));
    }
    setPickerIndex(orderNumber);
    setPickerOpen(true);
  };

  const togglePickerSelection = (product) => {
    const price = Number(product.price) || 0;
    const multiplier = getPickerMultiplier(product);
    const returnAmount = pickerReturnAmountFor(product);
    if (Math.round(returnAmount * 100) > Math.round(price * 100)) {
      setSettingsError('Return Amount cannot be greater than Product Price');
      return;
    }
    const entry = {
      orderNumber: pickerIndex,
      productId: product._id,
      displayId: String(product.pId ?? product._id),
      name: product.name,
      picture: product.picture || '',
      price,
      rating: Number(product.rating) || 0,
      multiplier,
      returnAmount,
    };
    setOrderSettingProducts((list) => [
      ...list.filter((item) => Number(item.orderNumber) !== pickerIndex),
      entry,
    ].sort((a, b) => Number(a.orderNumber) - Number(b.orderNumber)));
    setPickerOpen(false);
    setPickerIndex(null);
  };

  const removeOrderPin = (orderNumber) => {
    setOrderSettingProducts((list) =>
      list.filter((product) => Number(product.orderNumber) !== orderNumber)
    );
  };

  const saveOrderSetting = async () => {
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsMsg(null);
    try {
      const result = await request(
        `${API_URL}/api/members/${orderSettingMember.docId}/order-setting`,
        'POST',
        { products: orderSettingProducts }
      );
      if (result.ok) {
        setSettingsMsg('Order setting saved successfully');
      } else {
        setSettingsError(result.message);
      }
    } catch (e) {
      setSettingsError('Unable to reach server');
    } finally {
      setSettingsSaving(false);
    }
  };

  const resetOrderSetting = async (docId) => {
    setSaving(true);
    setError(null);
    try {
      const result = await request(`${API_URL}/api/members/${docId}/order-setting/reset`, 'POST', {});
      if (result.ok) finish();
      else setError(result.message);
    } catch (e) {
      setError('Unable to reach server');
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = () => {
    if (!modal) return '';
    switch (modal.mode) {
      case 'edit':
        return 'Editing materials';
      case 'balance':
        return 'Balance Adjustment';
      case 'commission':
        return 'Commission settings';
      case 'password':
        return 'Password change';
      case 'confirm':
        return modal.confirmTitle;
      default:
        return '';
    }
  };

  const renderBody = () => {
    if (!modal) return null;

    if (modal.mode === 'edit') {
      return (
        <>
          {EDIT_FIELDS.slice(0, 3).map((field) => (
            <div key={field.key}>
              <label className="product-field-label">
                {field.label} <span className="required-star">*</span>
              </label>
              <input
                type={field.type}
                className="product-modal-input"
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </div>
          ))}
          <label className="product-field-label">
            VIP Level <span className="required-star">*</span>
          </label>
          <select
            className="product-modal-input"
            value={form.vipLevel}
            onChange={(e) => onChange('vipLevel', e.target.value)}
          >
            <option value="">Please select VIP level</option>
            {levels.map((level) => (
              <option key={level._id} value={level.name}>
                {level.name}
              </option>
            ))}
          </select>
          {EDIT_FIELDS.slice(3).map((field) => (
            <div key={field.key}>
              <label className="product-field-label">
                {field.label} <span className="required-star">*</span>
              </label>
              <input
                type={field.type}
                className="product-modal-input"
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </>
      );
    }

    if (modal.mode === 'balance') {
      return (
        <>
          <label className="product-field-label">
            Amount <span className="required-star">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="product-modal-input"
            placeholder="Enter amount (0 or greater)"
            value={form.amount}
            onChange={(e) => onChange('amount', e.target.value)}
          />
          <div className="member-modal-hint">
            Current available fund: {modal.member.walletInfo.availableFunds}
          </div>
        </>
      );
    }

    if (modal.mode === 'commission') {
      return (
        <>
          <label className="product-field-label">
            Commission <span className="required-star">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="product-modal-input"
            placeholder="Enter commission"
            value={form.totalCommissions}
            onChange={(e) => onChange('totalCommissions', e.target.value)}
          />
          <div className="member-modal-hint">
            Old commission: {modal.member.walletInfo.totalCommissions}
          </div>
        </>
      );
    }

    if (modal.mode === 'password') {
      return (
        <>
          <label className="product-field-label">Login Password</label>
          <input
            type="password"
            className="product-modal-input"
            placeholder="Leave blank to keep old password"
            value={form.loginPassword}
            onChange={(e) => onChange('loginPassword', e.target.value)}
          />
          <label className="product-field-label">Withdraw Password</label>
          <input
            type="password"
            className="product-modal-input"
            placeholder="Leave blank to keep old password"
            value={form.withdrawPassword}
            onChange={(e) => onChange('withdrawPassword', e.target.value)}
          />
          <div className="member-modal-hint">
            Passwords you leave blank stay unchanged.
          </div>
        </>
      );
    }

    if (modal.mode === 'confirm') {
      return <p className="member-modal-confirm-text">{modal.confirmMessage}</p>;
    }

    return null;
  };

  const renderFooter = () => {
    if (!modal) return null;
    const cancel = (
      <button className="product-modal-btn cancel" onClick={closeModal}>
        {modal.mode === 'confirm' ? 'No' : 'Cancel'}
      </button>
    );

    if (modal.mode === 'confirm') {
      return (
        <>
          {cancel}
          <button
            className="product-modal-btn add"
            onClick={submitConfirm}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Yes'}
          </button>
        </>
      );
    }

    if (modal.mode === 'balance') {
      return (
        <>
          {cancel}
          <button
            className="product-modal-btn add"
            onClick={() => submitBalance('add')}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Additional Payment'}
          </button>
          <button
            className="product-modal-btn delete"
            onClick={() => submitBalance('deduct')}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Deduction'}
          </button>
        </>
      );
    }

    return (
      <>
        {cancel}
        <button
          className="product-modal-btn add"
          onClick={
            modal.mode === 'edit'
              ? submitEdit
              : modal.mode === 'commission'
              ? submitCommission
              : submitPassword
          }
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </>
    );
  };

  const setPickerMultiplier = (productId, value) => {
    setPickerMultipliers((current) => ({ ...current, [productId]: value }));
    setPickerReturns((current) => {
      if (!(productId in current)) return current;
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const setPickerReturn = (productId, value) => {
    setPickerReturns((current) => ({ ...current, [productId]: value }));
  };

  const getPickerMultiplier = (product) => {
    const value = Number(pickerMultipliers[product._id]);
    return Number.isFinite(value) && value >= 0 ? value : 1;
  };

  const commissionRateForMember = (member) => {
    const level = levels.find((item) => item.name === member?.basicInfo?.level);
    let rate = Number(level?.orderCommissionRate) || 0;
    if (rate > 1) rate = rate / 100;
    return rate;
  };

  const returnAmountForProduct = (product, member) => {
    const price = Number(product.price) || 0;
    const multiplier = getPickerMultiplier(product);
    const baseProfit = price * commissionRateForMember(member);
    return Math.round(baseProfit * multiplier * 100) / 100;
  };

  const pickerReturnAmountFor = (product) => {
    if (Object.prototype.hasOwnProperty.call(pickerReturns, product._id)) {
      return Number(pickerReturns[product._id]) || 0;
    }
    return returnAmountForProduct(product, orderSettingMember);
  };

  return (
    <div className="member-container">
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
          value={filters.userType}
          onChange={(e) => setFilters((f) => ({ ...f, userType: e.target.value }))}
        >
          <option value="">Please select user type</option>
          <option value="Test User">Test User</option>
          <option value="Official User">Official User</option>
          <option value="Agent User">Agent User</option>
        </select>
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Please select status</option>
          <option value="Enabled">Enabled</option>
          <option value="Disabled">Disabled</option>
        </select>
        <input
          type="date"
          placeholder="Start time"
          className="filter-input"
          value={filters.date}
          onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
        />
        <button className="search-btn" onClick={onSearch}>
          <i className="layui-icon layui-icon-search"></i>
        </button>
      </div>

      {/* Action Buttons & Total Count */}
      <div className="action-bar">
        <div className="left-actions">
          <button className="btn-batch-disable">Batch disable</button>
          <button className="btn-add-member" onClick={() => openModal('add', null)}>
            + Add Member
          </button>
        </div>
        <div className="total-records">Total data: {membersData.length} records</div>
      </div>

      {/* Data Table with Grid Lines */}
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
            ) : membersData.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>
                  No members found
                </td>
              </tr>
            ) : (
              membersData.map((item) => (
                <tr key={item.docId}>
                  <td className="checkbox-col">
                    <input type="checkbox" />
                  </td>
                  <td>{item.id}</td>
                  <td>
                    Account: {item.basicInfo.account}<br/>
                    Nickname: {item.basicInfo.nickname}<br/>
                    Level: {item.basicInfo.level}<br/>
                    Superior: {item.basicInfo.superior}<br/>
                    Agent: {item.basicInfo.agent}
                  </td>
                  <td>
                    Type: {item.accountInfo.type}<br/>
                    Status: {item.accountInfo.status}<br/>
                    Transactions: {item.accountInfo.transactions}<br/>
                    Credit: {item.accountInfo.credit}
                  </td>
                  <td>
                    Available Funds: {item.walletInfo.availableFunds}<br/>
                    Frozen Funds: {item.walletInfo.frozenFunds}<br/>
                    Total Deposits: {item.walletInfo.totalDeposits}<br/>
                    Total Withdrawals: {item.walletInfo.totalWithdrawals}<br/>
                    Total Commissions: {item.walletInfo.totalCommissions}
                  </td>
                  <td>{item.taskStatus}</td>
                  <td>{item.invitationCode}</td>
                  <td>
                    Login time: {item.loginInfo.loginTime}<br/>
                    Login IP: {item.loginInfo.loginIp}
                  </td>
                  <td>{item.registrationTime}</td>
                  <td className="operate-cell">
                    <div className="op-group-1">
                      <button
                        className="op-btn btn-teal"
                        onClick={() => openModal('edit', item)}
                      >
                        ✏️ Editing materials
                      </button>
                      <button
                        className="op-btn btn-blue"
                        onClick={() => openModal('balance', item)}
                      >
                        ¥ Balance Adjustment
                      </button>
                      <button
                        className="op-btn btn-yellow"
                        onClick={() => openOrderSetting(item)}
                      >
                        ⚙️ Order settings
                      </button>
                      <button
                        className="op-btn btn-amber"
                        onClick={() =>
                          openModal('confirm', item, {
                            confirmTitle: 'Reset Order',
                            confirmMessage: `Reset the order setting for "${item.basicInfo.nickname}"? It will return to random selection.`,
                            confirmAction: 'resetOrder',
                          })
                        }
                      >
                        🔄 Reset Order
                      </button>
                      <button
                        className="op-btn btn-light-blue"
                        onClick={() => openModal('commission', item)}
                      >
                        ⚙️ Commission settings
                      </button>
                    </div>
                    <div className="op-group-2">
                      <button
                        className="op-btn btn-blue"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('open-admin-tab', {
                              detail: {
                                title: `View Team - ${item.basicInfo.nickname}`,
                                props: {
                                  invitationCode: item.invitationCodeRaw,
                                  nickname: item.basicInfo.nickname,
                                },
                              },
                            })
                          )
                        }
                      >
                        👥 View Team
                      </button>
                      <button
                        className="op-btn btn-sky"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('open-admin-tab', {
                              detail: {
                                title: `Account to Data - ${item.basicInfo.nickname}`,
                                props: {
                                  username: item.basicInfo.nickname,
                                  nickname: item.basicInfo.nickname,
                                },
                              },
                            })
                          )
                        }
                      >
                        Account to Data
                      </button>
                    </div>
                    <div className="op-group-3">
                      <button
                        className="op-btn btn-yellow"
                        onClick={() => openModal('password', item)}
                      >
                        🔒 Password change
                      </button>
                      <button
                        className="op-btn btn-orange"
                        onClick={() =>
                          openModal('confirm', item, {
                            confirmTitle: 'Account ban',
                            confirmMessage:
                              item.accountInfo.status === 'Enabled'
                                ? `Are you sure you want to disable "${item.basicInfo.nickname}"?`
                                : `Are you sure you want to enable "${item.basicInfo.nickname}"?`,
                            confirmUpdates: {
                              status:
                                item.accountInfo.status === 'Enabled'
                                  ? 'Disabled'
                                  : 'Enabled',
                            },
                          })
                        }
                      >
                        {item.accountInfo.status === 'Enabled'
                          ? '⏸ Account ban'
                          : 'Enable Account'}
                      </button>
                      <button
                        className="op-btn btn-orange"
                        onClick={() =>
                          openModal('confirm', item, {
                            confirmTitle: 'Transaction disabled',
                            confirmMessage:
                              item.accountInfo.transactions === 'Enabled'
                                ? `Are you sure you want to disable transactions for "${item.basicInfo.nickname}"?`
                                : `Are you sure you want to enable transactions for "${item.basicInfo.nickname}"?`,
                            confirmUpdates: {
                              transactions:
                                item.accountInfo.transactions === 'Enabled'
                                  ? 'Disabled'
                                  : 'Enabled',
                            },
                          })
                        }
                      >
                        {item.accountInfo.transactions === 'Enabled'
                          ? '⏸ Transaction disabled'
                          : 'Enable Transaction'}
                      </button>
                    </div>
                    <div className="op-group-4">
                      <button
                        className="op-btn btn-deep-orange"
                        onClick={() =>
                          toggleUserType(
                            item,
                            item.accountInfo.type === 'Test User'
                              ? 'Regular User'
                              : 'Test User'
                          )
                        }
                      >
                        {item.accountInfo.type === 'Test User'
                          ? '👤 Set as Official'
                          : '👤 Set as a proxy'}
                      </button>
                      <button
                        className="op-btn btn-deep-orange"
                        onClick={() =>
                          toggleUserType(
                            item,
                            item.accountInfo.type === 'Proxy User'
                              ? 'Regular User'
                              : 'Proxy User'
                          )
                        }
                      >
                        {item.accountInfo.type === 'Proxy User'
                          ? '👤 Set as Official'
                          : '👤 Set as a proxy'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit / Balance / Commission / Password / Confirm Modal */}
      {modal && modal.mode === 'add' ? (
        <div className="product-modal-overlay" onClick={closeModal}>
          <div className="product-modal member-modal" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h3>Add Member</h3>
              <button className="product-modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="product-modal-body">
              {error && <div className="product-modal-error">{error}</div>}
              <label className="product-field-label">
                Phone Number <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="product-modal-input"
                placeholder="Enter phone number"
                value={form.phoneNumber}
                onChange={(e) => onChange('phoneNumber', e.target.value)}
              />
              <label className="product-field-label">
                Nickname <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="product-modal-input"
                placeholder="Enter nickname"
                value={form.nickname}
                onChange={(e) => onChange('nickname', e.target.value)}
              />
              <label className="product-field-label">
                Credit Score <span className="required-star">*</span>
              </label>
              <input
                type="number"
                className="product-modal-input"
                placeholder="100"
                value={form.creditScore}
                onChange={(e) => onChange('creditScore', e.target.value)}
              />
              <label className="product-field-label">
                Login Password <span className="required-star">*</span>
              </label>
              <input
                type="password"
                className="product-modal-input"
                placeholder="Enter login password"
                value={form.loginPassword}
                onChange={(e) => onChange('loginPassword', e.target.value)}
              />
              <label className="product-field-label">
                Withdraw Password <span className="required-star">*</span>
              </label>
              <input
                type="password"
                className="product-modal-input"
                placeholder="Enter withdraw password"
                value={form.withdrawPassword}
                onChange={(e) => onChange('withdrawPassword', e.target.value)}
              />
              <label className="product-field-label">
                VIP Level <span className="required-star">*</span>
              </label>
              <select
                className="product-modal-input"
                value={form.vipLevel}
                onChange={(e) => onChange('vipLevel', e.target.value)}
              >
                <option value="">Please select VIP level</option>
                {levels.map((level) => (
                  <option key={level._id} value={level.name}>
                    {level.name}
                  </option>
                ))}
              </select>
              {levels.length === 0 && (
                <div className="member-modal-hint">
                  No membership levels found. Please add a membership level first.
                </div>
              )}
              <label className="product-field-label">
                Superior Id <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="product-modal-input"
                placeholder="5983"
                value={form.superiorId}
                onChange={(e) => onChange('superiorId', e.target.value)}
              />
              <label className="product-field-label">
                Today Salary Pending Payment <span className="required-star">*</span>
              </label>
              <input
                type="number"
                className="product-modal-input"
                placeholder="0"
                value={form.todaySalaryPendingPayment}
                onChange={(e) => onChange('todaySalaryPendingPayment', e.target.value)}
              />
            </div>
            <div className="product-modal-footer">
              <button className="product-modal-btn cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="product-modal-btn add"
                onClick={submitAdd}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : modal ? (
        <div className="product-modal-overlay" onClick={closeModal}>
          <div className="product-modal member-modal" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h3>{modalTitle()}</h3>
              <button className="product-modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="product-modal-body">
              {error && <div className="product-modal-error">{error}</div>}
              {renderBody()}
            </div>
            <div className="product-modal-footer">{renderFooter()}</div>
          </div>
        </div>
      ) : null}

      {/* Order Setting Modal */}
      {orderSettingMember && (
        <div className="product-modal-overlay os-overlay" onClick={closeOrderSetting}>
          <div className="product-modal member-modal os-modal" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header os-modal-header">
              <div>
                <h3>Order Settings</h3>
                <span className="os-subtitle">{orderSettingMember.basicInfo.nickname}</span>
              </div>
              <button className="product-modal-close" onClick={closeOrderSetting}>
                &times;
              </button>
            </div>
            <div className="product-modal-body os-body">
              <div className="os-topbar">
                <div className="os-chip">
                  <span className="os-chip-label">Daily Limit</span>
                  <span className="os-chip-value">{dailyVolumeOf(orderSettingMember.basicInfo.level)}</span>
                </div>
                <div className="os-chip">
                  <span className="os-chip-label">Pinned orders</span>
                  <span className="os-chip-value">{orderSettingProducts.length}</span>
                </div>
              </div>
              <div className="os-hint">
                Only rows with a saved pin use that product. All other orders remain random.
              </div>
              {settingsMsg && <div className="product-modal-ok">{settingsMsg}</div>}
              {settingsError && <div className="product-modal-error">{settingsError}</div>}

              <div className="os-list-wrap">
                <div className="os-list-title">Daily Orders</div>
                {!orderSettingLoaded ? (
                  <div className="os-empty">Loading orders...</div>
                ) : (
                  <div className="os-orders-table-wrap">
                    <table className="os-orders-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Status</th>
                          <th>Product</th>
                          <th>Return (Amount)</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(
                          { length: dailyVolumeOf(orderSettingMember.basicInfo.level) },
                          (_, index) => {
                            const orderNumber = index + 1;
                            const pin = orderSettingProducts.find(
                              (product) => Number(product.orderNumber) === orderNumber
                            );
                            return (
                              <tr key={orderNumber}>
                                <td>#{orderNumber}</td>
                                <td className={pin ? 'os-order-manual' : 'os-order-random'}>
                                  {pin ? 'MANUAL PIN' : 'RANDOM'}
                                </td>
                                <td>
                                  {pin
                                    ? `ID: ${pin.displayId || pin.productId} (${pin.name || 'Product'}, Pinned x${pin.multiplier ?? 1})`
                                    : '-- Automatic Selection --'}
                                </td>
                                <td>
                                  {pin
                                    ? Number(pin.returnAmount || 0).toFixed(2)
                                    : 'Calculated from level'}
                                </td>
                                <td className="os-order-actions">
                                  <button
                                    className="os-order-setpin"
                                    onClick={() => openPicker(orderNumber)}
                                  >
                                    {pin ? 'Change Pin' : 'Set Pin'}
                                  </button>
                                  {pin && (
                                    <button
                                      className="os-order-clear"
                                      onClick={() => removeOrderPin(orderNumber)}
                                    >
                                      Clear
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="product-modal-footer">
              <button className="product-modal-btn cancel" onClick={closeOrderSetting}>
                Close
              </button>
              <button
                className="product-modal-btn add"
                onClick={saveOrderSetting}
                disabled={settingsSaving}
              >
                {settingsSaving ? 'Saving...' : '📌 Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Picker Modal */}
      {pickerOpen && (
        <div className="product-modal-overlay os-overlay" onClick={() => setPickerOpen(false)}>
          <div className="product-modal member-modal os-modal os-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header os-modal-header">
              <div>
                <h3>{`Set Manual Pin for Order #${pickerIndex}`}</h3>
              </div>
              <button className="product-modal-close" onClick={() => setPickerOpen(false)}>
                &times;
              </button>
            </div>
            <div className="product-modal-body os-body">
              <div className="os-filter-bar">
                <span className="os-filter-label">Price Range</span>
                <div className="os-price-range">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`os-price-input${pickerRangeInvalid ? ' invalid' : ''}`}
                    placeholder="Min"
                    value={pickerPriceStart}
                    onChange={(e) => setPickerPriceStart(e.target.value)}
                  />
                  <span className="os-price-separator">—</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`os-price-input${pickerRangeInvalid ? ' invalid' : ''}`}
                    placeholder="Max"
                    value={pickerPriceEnd}
                    onChange={(e) => setPickerPriceEnd(e.target.value)}
                  />
                </div>
                <button
                  className="os-apply-range"
                  disabled={pickerRangeInvalid || pickerPriceStart === '' || pickerPriceEnd === ''}
                  onClick={() => setAppliedPickerRange([pickerRangeStart, pickerRangeEnd])}
                >
                  Search
                </button>
              </div>
              {pickerRangeInvalid && (
                <div className="os-range-error">Starting range must not be greater than ending range</div>
              )}
              {filteredPickerProducts.length === 0 ? (
                <div className="os-empty">No products found in this price range.</div>
              ) : (
                <div className="os-picker-table-wrap">
                  <table className="os-picker-table">
                    <colgroup>
                      <col className="os-col-id" />
                      <col className="os-col-name" />
                      <col className="os-col-price" />
                      <col className="os-col-multiplier" />
                      <col className="os-col-return" />
                      <col className="os-col-action" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Multiplier</th>
                        <th>Return Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPickerProducts.map((product, index) => {
                        const multiplier = getPickerMultiplier(product);
                        const price = Number(product.price) || 0;
                        const returnAmount = pickerReturnAmountFor(product);
                        const hasCustomReturn = Object.prototype.hasOwnProperty.call(
                          pickerReturns,
                          product._id
                        );
                        const returnValue = hasCustomReturn
                          ? pickerReturns[product._id]
                          : returnAmount.toFixed(2);
                        const isSelected = pickerIndex === null
                          ? orderSettingProducts.some((p) => p.productId === product._id)
                          : false;
                        const isOverPrice = returnAmount > price;
                        return (
                          <tr key={product._id} className={isSelected ? 'os-picker-row-selected' : ''}>
                            <td>{product.pId ?? index + 1}</td>
                            <td>{product.name}</td>
                            <td>{price.toFixed(2)}</td>
                            <td>
                              <input
                                className="os-picker-multiplier"
                                type="number"
                                min="0"
                                step="0.01"
                                value={pickerMultipliers[product._id] ?? 1}
                                onChange={(event) => setPickerMultiplier(product._id, event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="os-picker-return"
                                type="number"
                                min="0"
                                step="0.01"
                                value={returnValue}
                                onChange={(event) =>
                                  setPickerReturn(product._id, event.target.value)
                                }
                              />
                            </td>
                            <td>
                              <button
                                className={`os-picker-select${isSelected ? ' selected' : ''}`}
                                onClick={() => togglePickerSelection(product)}
                                disabled={isOverPrice}
                              >
                                {isSelected ? 'SELECTED' : 'SELECT'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;
