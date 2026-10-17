/*
 * LoginView.jsx — reference login page ki pixel-perfect recreation.
 *
 * Original DOM (bilkul same structure/classes):
 *   <body class="login-bg">
 *     <div class="login layui-anim layui-anim-up">
 *       <div class="message">排单系统-管理登录</div>
 *       <div id="darkbannerwrap"></div>
 *       <form class="layui-form"> ... inputs ... </form>
 *     </div>
 *
 * Behaviors jo same hain:
 *   1. Captcha par click -> nayi captcha (original: src += '?' + Math.random())
 *   2. lay-verify="required" -> khali field par "必填项不能为空" shake toast
 *   3. Ghalat captcha  -> "验证码错误" (icon 2) + captcha refresh
 *   4. Ghalat password -> "用户名或密码错误!" (icon 2) + captcha refresh
 *   5. Success         -> "登录成功" (icon 1) -> admin panel
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import LayerMsg, { MsgStateFactory } from './LayerMsg.jsx';
import { makeCaptcha } from '../../lib/captcha.js';
import { checkLogin, saveSession } from '../../lib/demoAuth.js';
import EyeToggle from '../EyeToggle.jsx';

export default function LoginView({ onLogin }) {
  const formRef = useRef(null); // form ka reference (validation ke liye)
  const [msg, setMsg] = useState(null); // active toast ki state
  const [captcha, setCaptcha] = useState(() => makeCaptcha()); // pehli captcha
  const [showPwd, setShowPwd] = useState(false); // password reveal toggle
  // hamesha current captcha code ka fresh reference rakho
  const captchaCodeRef = useRef(captcha.code);
  captchaCodeRef.current = captcha.code;

  // body class exactly original <body class="login-bg"> jaisi
  useEffect(() => {
    document.body.className = 'login-bg';
    return () => {
      document.body.className = '';
    };
  }, []);

  // Captcha click -> nayi captcha generate (original jaisa UX)
  const refreshCaptcha = useCallback(() => {
    setCaptcha(makeCaptcha());
  }, []);

  // Toast dikhane ka helper
  const showMsg = useCallback((content, icon, shift) => {
    setMsg(MsgStateFactory(content, icon, shift));
  }, []);

  // Form submit — original form.on('submit(login)') jaisa
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return false;

    // layui verify: lay-verify="required" => /[\S]+/ , error msg same
    const fields = Array.from(form.querySelectorAll('input[lay-verify]'));
    let invalid = null;
    for (const field of fields) {
      field.classList.remove('layui-form-danger');
      if (!/\S+/.test(field.value)) {
        invalid = field;
        break;
      }
    }
    if (invalid) {
      invalid.classList.add('layui-form-danger'); // red border
      showMsg('Required fields cannot be empty', 5, 6); // sad-face + shake
      invalid.focus();
      return false;
    }

    // Form data nikaalo (username, password, code)
    const data = {};
    new FormData(form).forEach((v, k) => {
      data[k] = v;
    });

    // Backend se check (username/password database se verify hote hain)
    const res = await checkLogin({
      username: data.username,
      password: data.password,
      code: data.code,
      expectedCaptcha: captchaCodeRef.current,
    });

    // Chhota delay taake original network-call jaisa feel ho
    window.setTimeout(() => {
      if (res.status === 200) {
        showMsg(res.msg, 1); // green tick "登录成功"
        saveSession((data.username || '').trim() || 'admin', res.token);
        // original location.href = res.url karta tha; hum view switch karte hain
        window.setTimeout(() => onLogin((data.username || '').trim() || 'admin'), 600);
      } else {
        refreshCaptcha(); // original bhi fail par captcha refresh karta hai
        showMsg(res.msg, 2); // red cross
      }
    }, 150);
    return false;
  };

  return (
    <>
      <div className="login layui-anim layui-anim-up">
        {/* Green banner (card se 18px bahar nikalta hai — CSS margin se) */}
        <div className="message">Order System - Admin Login</div>
        {/* Banner ke neeche ka black fold (aiwrap.png) */}
        <div id="darkbannerwrap"></div>
        <form method="post" className="layui-form" ref={formRef} onSubmit={handleSubmit}>
          {/* 用户名 */}
          <input
            name="username"
            placeholder="Username"
            type="text"
            lay-verify="required"
            className="layui-input"
            autoComplete="off"
          />
          <hr className="hr15" />
          {/* 密码 */}
          <div className="pwd-field">
            <input
              name="password"
              lay-verify="required"
              placeholder="Password"
              type={showPwd ? 'text' : 'password'}
              className="layui-input"
            />
            <EyeToggle show={showPwd} onClick={() => setShowPwd((v) => !v)} />
          </div>
          <hr className="hr15" />
          {/* 验证码 input (50%) + captcha image (49%) — inline layout original jaisa */}
          <input
            type="text"
            name="code"
            placeholder="Captcha"
            className="layui-input"
            lay-verify="required"
            autoComplete="off"
            style={{ width: '50%', display: 'inline-block' }}
          />{' '}
          <div style={{ display: 'inline-block', width: '49%' }}>
            <img
              src={captcha.dataUrl}
              alt="captcha"
              width="100%"
              id="captcha"
              onClick={refreshCaptcha}
            />
          </div>
          <hr className="hr15" />
          {/* 登录 button */}
          <input
            value="Login"
            lay-submit="lay-submit"
            lay-filter="login"
            style={{ width: '100%' }}
            type="submit"
          />
          <hr className="hr20" />
        </form>
      </div>
      {/* Toast popup (screen center) */}
      {msg && <LayerMsg state={msg} onClose={() => setMsg(null)} />}
    </>
  );
}
