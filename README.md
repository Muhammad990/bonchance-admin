# 排单系统 Admin — Pure React (Step-by-Step Guide)

`app.tuihotelonline.site` (排单系统 admin login) ka **pixel-perfect recreation** —
pure **React 18 + Vite**, sirf frontend, koi backend nahi chahiye.

## Quick Start

```bash
npm install     # dependencies install
npm run dev     # dev server -> http://localhost:5173
```

Production build:

```bash
npm run build   # dist/ folder
npm run preview # build ko locally test
```

## Demo Login

| Field | Value |
|-------|-------|
| 用户名 (Username) | `admin` |
| 密码 (Password) | `admin123` |
| 验证码 (Captcha) | image mein jo likha hai (click = refresh) |

## File Structure (kaunsi file kya karti hai)

```
tui-admin-react/
├── index.html               # original jaisa <html class="x-admin-sm"> + title + viewport
├── package.json             # react + react-dom + vite
├── vite.config.js           # React plugin + port 5173
├── postcss.config.js        # khali (parent Tailwind config se bachne ke liye)
├── public/
│   ├── font/                # layui iconfont (woff/ttf)
│   └── images/              # bg.png (login bg), aiwrap.png (banner fold), layer_icon.png
└── src/
    ├── main.jsx             # ENTRY: ReactDOM.createRoot + CSS imports
    ├── App.jsx              # ROOT: login <-> admin switch (localStorage session)
    ├── lib/
    │   ├── captcha.js       # ThinkPHP-style SVG captcha generator (client-side)
    │   └── demoAuth.js      # login check (admin/admin123) + {status,msg} responses
    ├── components/
    │   ├── login/
    │   │   ├── LoginView.jsx    # login card — exact DOM/classes reference jaisi
    │   │   └── LayerMsg.jsx     # layui layer.msg toast (icon 1/2/5, shake)
    │   └── admin/
    │       └── AdminView.jsx    # x-admin shell: top bar, sidebar, tabs, logout
    └── styles/              # 1:1 faithful CSS copies (reference site se)
        ├── layui.css        # base: inputs, icons, animations
        ├── xadmin.css       # admin theme: layout, tables, sidebar
        ├── login.css        # login card: green banner, inputs, button
        └── layer.css        # toast popup styles
```

## Fidelity Notes (kya same hai)

- **Exact CSS** — reference ki hi 4 CSS files (paths adjust kiye)
- **Exact DOM** — div.login > .message + #darkbannerwrap + form.layui-form
- **Behaviors** — captcha click-refresh, khali field -> "必填项不能为空"
  shake (icon 5), ghalat captcha -> "验证码错误" (icon 2), ghalat password
  -> "用户名或密码错误!" (icon 2), success -> "登录成功" (icon 1) -> admin panel
- **Responsive** — original viewport meta (initial-scale 0.8) + mobile par
  60px icon-only sidebar (<=768px media query)

## Code Comments

Har file mein Roman Urdu + English comments hain taake aap line-by-line
samajh sakein ke kya ho raha hai.
