import React, { useEffect, useState, useCallback } from 'react';
import './ProductList.css';
import { API_URL } from '../../lib/api.js';

const EMPTY_FORM = { name: '', price: '', picture: '', rating: '' };

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [date, setDate] = useState('');
  const [modal, setModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', product }
  const [deleteTarget, setDeleteTarget] = useState(null); // product to confirm-delete
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Backend se products lao (ID ascending). Search kiye hue filters ke saath.
  const loadProducts = useCallback(async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.name) qs.set('name', params.name);
    if (params.date) qs.set('date', params.date);
    const query = qs.toString();
    try {
      const res = await fetch(`${API_URL}/api/products${query ? `?${query}` : ''}`);
      const json = await res.json().catch(() => null);
      setProducts(json && json.success ? json.data : []);
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Search button click ke baad hi data filter ho kar dikhao
  const applySearch = () => {
    setLoading(true);
    loadProducts({ name: keyword.trim(), date });
  };

  const openAdd = () => {
    setError(null);
    setForm(EMPTY_FORM);
    setModal({ mode: 'add', product: null });
  };

  const openEdit = (product) => {
    setError(null);
    setForm({
      name: product.name,
      price: product.price,
      picture: product.picture || '',
      rating: product.rating === undefined || product.rating === null ? '' : String(product.rating),
    });
    setModal({ mode: 'edit', product });
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
    const name = form.name.trim();
    const price = form.price.trim();
    if (!name || !price) {
      setError('Product name and price are required');
      return;
    }

    setSaving(true);
    setError(null);
    const isEdit = modal && modal.mode === 'edit';
    const url = `${API_URL}/api/products${isEdit ? `/${modal.product._id}` : ''}`;

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price,
          picture: form.picture,
          rating: form.rating.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        setModal(null);
        setForm(EMPTY_FORM);
        loadProducts();
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
      const res = await fetch(`${API_URL}/api/products/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteTarget(null);
        loadProducts();
      }
    } catch (e) {
      /* network error — keep modal open */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="product-list-container">
      {/* Top Filter Bar */}
      <div className="filter-bar">
        <div className="filter-inputs">
          <input
            type="text"
            placeholder="Please enter keywords"
            className="search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <input
            type="date"
            placeholder="Start time"
            className="time-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="search-btn" onClick={applySearch}>
            <i className="layui-icon layui-icon-search"></i>
          </button>
        </div>
      </div>

      {/* Action Bar & Total Data Count */}
      <div className="action-bar">
        <button className="add-product-btn" onClick={openAdd}>
          Add product
        </button>
        <span className="total-records">Total data: {products.length} records</span>
      </div>

      {/* Data Table */}
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Picture</th>
              <th>Name</th>
              <th>Price</th>
              <th>Creation time</th>
              <th>Operate</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                  No products found
                </td>
              </tr>
            ) : (
              products.map((item) => (
                <tr key={item._id}>
                  <td>{item.pId}</td>
                  <td>
                    <img
                      src={item.picture}
                      alt={item.name}
                      className="product-thumbnail"
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.price}</td>
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
          <div
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="product-modal-header">
              <h3>{modal.mode === 'edit' ? 'Edit product' : 'Add product'}</h3>
              <button className="product-modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="product-modal-body">
              {error && <div className="product-modal-error">{error}</div>}
              <label className="product-field-label">Product name</label>
              <input
                type="text"
                className="product-modal-input"
                placeholder="Enter product name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <label className="product-field-label">Product image</label>
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
              <label className="product-field-label">Price</label>
              <input
                type="text"
                className="product-modal-input"
                placeholder="Enter price"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
              <label className="product-field-label">Rating</label>
              <input
                type="text"
                className="product-modal-input"
                placeholder="Enter rating"
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              />
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
                Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo; (ID:{' '}
                {deleteTarget.pId})?
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

export default ProductList;