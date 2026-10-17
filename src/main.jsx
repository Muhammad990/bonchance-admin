/*
 * main.jsx — React app ka entry point.
 * ReactDOM.createRoot se App ko #root div mein render karte hain.
 * CSS import order important hai: pehle layui (base), phir overrides.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/layui.css'; // layui 2.4.5 base styles (inputs, icons, anims)
import './styles/xadmin.css'; // x-admin theme (layout, tables, admin shell)
import './styles/login.css'; // login page ke exact styles
import './styles/layer.css'; // layer.msg toast ke exact styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
