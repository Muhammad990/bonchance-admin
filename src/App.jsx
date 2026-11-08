/*
 * App.jsx — Root component: login <-> admin view ka switch.
 *
 * Original website ka behavior:
 *   - Login nahi -> /public/admin/Index/index.html login page dikhata hai
 *   - Login hua  -> wahi URL admin panel par le jata hai
 * Hum yeh switch React state se karte hain + localStorage session se persist.
 */
import { useEffect, useState } from 'react';
import LoginView from './components/login/LoginView.jsx';
import AdminView from './components/admin/AdminView.jsx';
import { readSession, clearSession } from './lib/demoAuth.js';

export default function App() {
  // 'loading' | 'login' | 'admin'
  const [view, setView] = useState('loading');
  const [username, setUsername] = useState('');

  // App load par session check karo (refresh ke baad bhi login rehna chahiye)
  useEffect(() => {
    const session = readSession();
    if (session) {
      setUsername(session.username);
      setView('admin');
    } else {
      setView('login');
    }
  }, []);

  // LoginView success ke baad yeh call hota hai
  const handleLogin = (name) => {
    setUsername(name);
    setView('admin');
  };

  // AdminView logout ke baad yeh call hota hai
  const handleLogout = () => {
    clearSession();
    setUsername('');
    setView('login');
  };

  useEffect(() => {
    const handleUsernameChanged = (event) => {
      setUsername(String(event.detail || '').trim());
    };
    window.addEventListener('admin-username-changed', handleUsernameChanged);
    return () => window.removeEventListener('admin-username-changed', handleUsernameChanged);
  }, []);

  // Session check ke waqt original jaisa grey background
  if (view === 'loading') {
    return <div style={{ minHeight: '100vh', background: '#f1f1f1' }} />;
  }
  if (view === 'admin') return <AdminView username={username} onLogout={handleLogout} />;
  return <LoginView onLogin={handleLogin} />;
}
