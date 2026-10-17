/*
 * LayerMsg.jsx — layui ka layer.msg toast popup ki faithful recreation.
 *
 * Original site layer.msg() use karti thi:
 *   icon 1 = green tick (success)      -> layer.msg(res.msg, {icon: 1})
 *   icon 2 = red cross (error)         -> layer.msg(res.msg, {icon: 2})
 *   icon 5 = sad face + shake (verify) -> layer.msg('必填项不能为空', {icon:5, shift:6})
 *
 * Yeh component:
 *   - screen ke exact center mein fix karta hai (layer.js ke hisaab se px position)
 *   - time (default 3000ms) ke baad fade-out (300ms) phir unmount
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// MsgState banane ka helper — LoginView isi se toast state banata hai
export function MsgStateFactory(content, icon, shift) {
  return { content, icon, shift, time: 3000, key: Date.now() };
}

// Har naye toast ko thora bara z-index (layer.js ka 19891016 base)
let zIncrement = 0;

export default function LayerMsg({ state, onClose }) {
  const boxRef = useRef(null);
  const [closing, setClosing] = useState(false);
  const time = state.time ?? 3000;

  // Position: window size naap kar exact center (layer.js jaisa)
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const area = [el.offsetWidth, el.offsetHeight];
    const top = Math.max(0, (window.innerHeight - area[1]) / 2);
    const left = Math.max(0, (window.innerWidth - area[0]) / 2);
    el.style.top = `${Math.round(top)}px`;
    el.style.left = `${Math.round(left)}px`;
    return undefined;
  }, []);

  // Auto-dismiss: `time` baad fade shuru, +300ms baad component hatao
  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setClosing(true), time);
    const closeTimer = window.setTimeout(() => onClose(), time + 300);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(closeTimer);
    };
  }, [time, onClose]);

  // shift===6 -> shake animation (validation errors), warna bounce-in
  const animClass =
    state.shift === 6 ? 'layui-layer-anim-06' : 'layui-layer-anim-00';
  const icon =
    typeof state.icon === 'number' && state.icon > 0 ? state.icon : 0;
  const zIndex = 19891016 + (zIncrement++ % 1000);

  // createPortal se seedha document.body mein render (app tree se bahar, overlay)
  return createPortal(
    <div
      ref={boxRef}
      key={state.key}
      className={[
        'layui-layer',
        'layui-layer-dialog',
        'layui-layer-msg',
        'layui-layer-anim',
        animClass,
        closing ? 'layui-layer-fadeout' : '',
      ].join(' ')}
      style={{ zIndex, display: 'block', visibility: 'visible' }}
    >
      <div
        className={
          icon > 0
            ? 'layui-layer-content layui-layer-padding'
            : 'layui-layer-content'
        }
      >
        {/* Icon sprite se (1=tick, 2=cross, 5=sad face) */}
        {icon > 0 && <i className={`layui-layer-ico layui-layer-ico${icon}`} />}
        {state.content}
      </div>
      <span className="layui-layer-setwin" style={{ display: 'none' }} />
    </div>,
    document.body
  );
}
