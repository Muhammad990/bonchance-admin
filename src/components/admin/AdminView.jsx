/*
 * AdminView.jsx — x-admin 2.x admin shell (login ke baad ka view).
 *
 * Original site ka admin panel login ke peeche tha (publicly accessible nahi),
 * is liye yeh shell xadmin.css + layui.css ke ap hi structure/classes se
 * rebuild kiya gaya hai:
 *   - Top bar (.x-container): dark #222, 45px height, logo + collapse button
 *   - Left nav (.left-nav): #EEEEEE, 220px, expandable sub-menus
 *   - Content (.page-content): tab bar + welcome page
 *   - Tabs: submenu click se khulte hain, close button + right-click menu
 *   - Mobile (<=768px): left nav sirf 60px icons (original CSS media query)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { resolvePage } from "../pages/index.js";
import { API_URL } from "../../lib/api.js";
import "./MyDesktop.css"
// Side menu data — accordion dropdown structure (icon + children)
const MENUS = [
  {
    title: "Product Management",
    icon: "layui-icon-cart",
    children: [{ title: "Product List", icon: "layui-icon-circle-dot" }],
  },
  {
    title: "Member Management",
    icon: "layui-icon-username",
    children: [
      { title: "Membership Level List", icon: "layui-icon-circle-dot" },
      { title: "Member List", icon: "layui-icon-circle-dot" },
      { title: "Points Records", icon: "layui-icon-circle-dot" },
      { title: "Bank Card List", icon: "layui-icon-circle-dot" },
    ],
  },
  {
    title: "Financial Management",
    icon: "layui-icon-rmb",
    children: [
      { title: "Withdrawal Orders", icon: "layui-icon-circle-dot" },
      { title: "Recharge Orders", icon: "layui-icon-circle-dot" },
      { title: "Wallet Details", icon: "layui-icon-circle-dot" },
    ],
  },
  {
    title: "Order Management",
    icon: "layui-icon-list",
    children: [{ title: "Order List", icon: "layui-icon-circle-dot" }],
  },
  {
    title: "System Management",
    icon: "layui-icon-set",
    children: [
      { title: "Basic Setting", icon: "layui-icon-circle-dot" },
      { title: "System Settings", icon: "layui-icon-circle-dot" },
    ],
  },
];

export default function AdminView({ username, onLogout }) {
  const [tabs, setTabs] = useState([]); // khuli tabs [{key, title}]
  const [active, setActive] = useState("home"); // active tab key
  const [navOpen, setNavOpen] = useState(true); // sidebar collapse state
  const [openMenus, setOpenMenus] = useState({}); // kaunse submenu khule hain
  const [tabMenu, setTabMenu] = useState(null); // tab right-click menu position
  const contentRef = useRef(null);
  const [refreshKeys, setRefreshKeys] = useState({}); // "刷新当前" ke liye re-render keys
  const [nowTime, setNowTime] = useState(""); // live clock (welcome page par)
  const [stats, setStats] = useState(null); // desktop dashboard stats
  const [userMenuOpen, setUserMenuOpen] = useState(false); // top-right admin dropdown
  const userMenuRef = useRef(null);

  const [displayUsername, setDisplayUsername] = useState(username || 'admin');

  const todayStr = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const [statStart, setStatStart] = useState(todayStr); // range start (left box)
  const [statEnd, setStatEnd] = useState(todayStr); // range end (right box)
  const [appliedStart, setAppliedStart] = useState(todayStr); // applied (OK)
  const [appliedEnd, setAppliedEnd] = useState(todayStr); // applied (OK)

  const loadStats = useCallback(async (start, end) => {
    try {
      const qs = start ? `?start=${start}&end=${end}` : "";
      const res = await fetch(`${API_URL}/api/dashboard${qs}`);
      const json = await res.json().catch(() => null);
      if (json && json.success) setStats(json.data);
    } catch (e) {
      /* ignore */
    }
  }, []);

  // Home tab active ho ya applied range badle to stats reload
  useEffect(() => {
    if (active === "home") loadStats(appliedStart, appliedEnd);
  }, [active, appliedStart, appliedEnd, loadStats]);

  const fmt = (v) => Number(v || 0).toLocaleString();

  // Live clock — har second update (welcome page ki 当前时间 row)
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = (n) => String(n).padStart(2, "0");
      setNowTime(
        `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
      );
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Admin view mein body par login-bg nahi hona chahiye
  useEffect(() => {
    document.body.className = "";
    return () => {
      document.body.className = "";
    };
  }, []);

  // Admin dropdown — kahin bahar click ho to band ho jaye
  useEffect(() => {
    const onDocClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Kahin bhi click -> tab right-click menu band
  useEffect(() => {
    const hideMenu = () => setTabMenu(null);
    document.addEventListener("click", hideMenu);
    return () => document.removeEventListener("click", hideMenu);
  }, []);

  // Small screens: expanded sidebar ke bahar click karne par menu collapse
  useEffect(() => {
    const onDocClick = (e) => {
      if (window.innerWidth > 768) return;
      if (Object.keys(openMenus).length === 0) return;
      if (e.target && e.target.closest && !e.target.closest(".left-nav")) {
        setOpenMenus({});
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openMenus]);

  // Tab kholo (pehle se khula ho to sirf activate + props update)
  const openTab = useCallback((title, props = {}) => {
    const key = "tab-" + title;
    setTabs((prev) =>
      prev.some((t) => t.key === key)
        ? prev.map((t) => (t.key === key ? { ...t, props } : t))
        : [...prev, { key, title, props }],
    );
    setActive(key);
    // Small screens: tab khulte hi expanded sidebar band ho jaye
    if (window.innerWidth <= 768) setOpenMenus({});
  }, []);

  // Pages (jaise MemberList ka View Team) event bhej kar tab khol sakti hain
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      if (detail.title) openTab(detail.title, detail.props || {});
    };
    window.addEventListener("open-admin-tab", handler);
    return () => window.removeEventListener("open-admin-tab", handler);
  }, [openTab]);

  // Tab close — agar active thi to home par wapis
  const closeTab = useCallback((key) => {
    setTabs((prev) => prev.filter((t) => t.key !== key));
    setActive((cur) => (cur === key ? "home" : cur));
  }, []);

  const closeOthers = (key) => {
    setTabs((prev) => prev.filter((t) => t.key === key));
    setActive(key);
  };

  const closeAll = () => {
    setTabs([]);
    setActive("home");
  };

  // Right-click "刷新当前" — component ko fresh mount karwane ke liye key badlo
  const refreshTab = (key) => {
    setRefreshKeys((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  // Har tab par laga refresh icon — sirf us tab ka data dubara fetch karta hai
  // (poora page reload nahi hota). Click karte hi icon ghum bhi jata hai.
  const [spinKey, setSpinKey] = useState(null);
  const spinTimer = useRef(null);

  const handleRefresh = (key) => {
    if (key === "home") {
      // Desktop refresh = date inputs reset karo (aaj ki date) aur stats reload
      const t = todayStr();
      setStatStart(t);
      setStatEnd(t);
      setAppliedStart(t);
      setAppliedEnd(t);
      loadStats(t, t);
    } else {
      setActive(key);
      refreshTab(key);
    }
    setSpinKey(key);
    if (spinTimer.current) window.clearTimeout(spinTimer.current);
    spinTimer.current = window.setTimeout(() => setSpinKey(null), 700);
  };

  // "OK" dabane par range apply karo (start > end ho to swap kar do)
  const applyRange = () => {
    let s = statStart || todayStr();
    let e = statEnd || todayStr();
    if (e < s) {
      const t = e;
      e = s;
      s = t;
    }
    setAppliedStart(s);
    setAppliedEnd(e);
  };

  const onTabContext = (e, key) => {
    e.preventDefault();
    const rect = contentRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    setTabMenu({ x, y, key });
  };

  // Logout — session clear -> login view (original login page par redirect)
  const doLogout = () => {
    if (onLogout) onLogout();
  };

  // Accordion toggle — opening one section closes all others
  const toggleMenu = (title) => {
    setOpenMenus((prev) => {
      const next = {};
      if (!prev[title]) next[title] = true;
      return next;
    });
  };

  const tabMenuForHome = tabMenu && tabMenu.key === "home";

  return (
    <div
      className={`x-admin-shell${navOpen ? "" : " nav-closed"}${
        Object.keys(openMenus).length > 0 ? " menu-expanded" : ""
      }`}
    >
      {/* ============ TOP BAR ============ */}
      <div className="x-container">
        <div className="logo">
          <a href="javascript:;">Order System</a>
        </div>
        {/* Sidebar collapse/expand button */}
        <div className="left_open" onClick={() => setNavOpen((v) => !v)}>
          <i
            className="layui-icon layui-icon-shrink-right"
            title="Expand sidebar"
          />
        </div>
        <ul
          className="layui-nav left fast-add"
          style={{ float: "left", marginLeft: "10px" }}
        >
          <li className="layui-nav-item"></li>
        </ul>
        <ul
          className="layui-nav right"
          style={{ float: "right", background: "transparent" }}
        >
          <li className="layui-nav-item to-index">
            <a href="javascript:;" onClick={() => openTab("Withdrawal Orders")}>
              View Withdrawal
            </a>
          </li>
          {/* User dropdown — click par khulta hai, bahar click par band */}
          <li
            ref={userMenuRef}
            className={`layui-nav-item admin-user-item${userMenuOpen ? " open" : ""}`}
          >
            <a
              href="javascript:;"
              onClick={(e) => {
                e.preventDefault();
                setUserMenuOpen((v) => !v);
              }}
            >
              {displayUsername}
              <i className="layui-nav-more" />
            </a>
            <dl className="admin-user-menu">
              <dd>
                <a
                  href="javascript:;"
                  onClick={() => {
                    setUserMenuOpen(false);
                    openTab("Change Username");
                  }}
                >
                  <i className="layui-icon layui-icon-username" />
                  &nbsp;Change Username
                </a>
              </dd>
              <dd>
                <a
                  href="javascript:;"
                  onClick={() => {
                    setUserMenuOpen(false);
                    openTab("Change Password");
                  }}
                >
                  <i className="layui-icon layui-icon-password" />
                  &nbsp;Change Password
                </a>
              </dd>
              <dd>
                <a
                  href="javascript:;"
                  onClick={() => {
                    setUserMenuOpen(false);
                    doLogout();
                  }}
                >
                  <i className="layui-icon layui-icon-logout" />
                  &nbsp;Logout
                </a>
              </dd>
            </dl>
          </li>
        </ul>
      </div>

      {/* ============ LEFT SIDEBAR ============ */}
      <div className="left-nav">
        <div id="side-nav">
          <ul id="nav">
            {/* 首页 — hamesha sabse upar */}
            <li>
              <a
                href="javascript:;"
                className={active === "home" ? "active" : ""}
                onClick={() => setActive("home")}
              >
                <i className="layui-icon layui-icon-home" />
                <cite>My Desktop</cite>
              </a>
            </li>
            {/* Menu items with expandable sub-menus */}
            {MENUS.map((menu) => (
              <li
                key={menu.title}
                className={openMenus[menu.title] ? "menu-open" : ""}
              >
                <a href="javascript:;" onClick={() => toggleMenu(menu.title)}>
                  <i className={`layui-icon ${menu.icon}`} />
                  <cite>{menu.title}</cite>
                  {/* Right arrow — khulne par 90° rotate */}
                  <span className="nav_right">
                    <i
                      className="layui-icon layui-icon-right"
                      style={{
                        display: "inline-block",
                        transition: "all .3s",
                        transform: openMenus[menu.title]
                          ? "rotate(90deg)"
                          : "none",
                      }}
                    />
                  </span>
                </a>
                {/* Sub-menu (CSS .opened se show/hide) */}
                <ul
                  className={`sub-menu${openMenus[menu.title] ? " opened" : ""}`}
                >
                  {menu.children?.map((child) => (
                    <li key={child.title}>
                      <a
                        href="javascript:;"
                        className={
                          active === `tab-${child.title}` ? "active" : ""
                        }
                        onClick={() => openTab(child.title)}
                      >
                        <i className={`layui-icon ${child.icon}`} />
                        <cite>{child.title}</cite>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ============ RIGHT CONTENT AREA ============ */}
      <div className="page-content" ref={contentRef}>
        <div
          className="layui-tab tab"
          lay-filter="xbs_tab"
          lay-allowclose="false"
        >
          {/* Tab bar — 首页 + khuli tabs */}
          <ul className="layui-tab-title">
            <li
              className={`home${active === "home" ? " layui-this" : ""}`}
              onContextMenu={(e) => onTabContext(e, "home")}
              onClick={() => setActive("home")}
            >
              <i className="layui-icon layui-icon-home" />
              My Desktop
              <i
                className={`layui-icon layui-icon-refresh tab-refresh${
                  spinKey === "home" ? " tab-refresh-spin" : ""
                }`}
                title="Refresh this tab"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh("home");
                }}
              />
            </li>
            {tabs.map((tab) => (
              <li
                key={tab.key}
                className={active === tab.key ? "layui-this" : ""}
                onClick={() => setActive(tab.key)}
                onContextMenu={(e) => onTabContext(e, tab.key)}
              >
                {tab.title}
                {/* Refresh (⟳) button — sirf is tab ka data dobara load */}
                <i
                  className={`layui-icon layui-icon-refresh tab-refresh${
                    spinKey === tab.key ? " tab-refresh-spin" : ""
                  }`}
                  title="Refresh this tab"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh(tab.key);
                  }}
                />
                {/* Close (×) button */}
                <i
                  className="layui-icon layui-icon-close layui-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.key);
                  }}
                />
              </li>
            ))}
          </ul>

          {/* Tab content panels */}
          <div className="layui-tab-content">
            {/* Home / welcome panel */}
            <div
              className={`stats-container layui-tab-item${active === "home" ? " layui-show" : ""}`}
            >
              {/* Top Header & Date Range Picker Bar */}
              <div className="stats-header">
                <h2>Data statistics</h2>
                <div className="stats-range-group">
                  <span className="stats-range-label">Start</span>
                  <input
                    type="date"
                    className="date-picker-input range"
                    value={statStart}
                    onChange={(e) => setStatStart(e.target.value)}
                  />
                  <span className="stats-range-sep">-</span>
                  <span className="stats-range-label">End</span>
                  <input
                    type="date"
                    className="date-picker-input range"
                    value={statEnd}
                    onChange={(e) => setStatEnd(e.target.value)}
                  />
                  <button className="stats-range-btn" onClick={applyRange}>
                    OK
                  </button>
                </div>
              </div>

              {/* Grid Layout for Statistic Cards */}
              <div className="stats-grid">
                {/* Card 1 */}
                <div className="stat-card">
                  <div className="card-title">Total number of users</div>
                  <div className="card-value">{fmt(stats?.totalUsers)}</div>
                  <div className="card-desc">
                    Total number of current users - official users
                  </div>
                </div>

                {/* Card 2 */}
                <div className="stat-card">
                  <div className="card-title">Total amount of goods</div>
                  <div className="card-value">{fmt(stats?.totalProducts)}</div>
                  <div className="card-desc">Total amount of goods</div>
                </div>

                {/* Card 3 */}
                <div className="stat-card">
                  <div className="card-title">Total orders</div>
                  <div className="card-value">{fmt(stats?.totalOfficialOrders)}</div>
                  <div className="card-desc">Order volume - official</div>
                </div>

                {/* Card 4 */}
                <div className="stat-card">
                  <div className="card-title">Completed order amount</div>
                  <div className="card-value">{fmt(stats?.completedOrderAmount)}</div>
                  <div className="card-desc">
                    Total amount of orders submitted - Formal
                  </div>
                </div>

                {/* Card 5 */}
                <div className="stat-card">
                  <div className="card-title">Number of people</div>
                  <div className="card-value">{fmt(stats?.todayTestUsers)}</div>
                  <div className="card-desc">
                    Number of users on the day of order placement - test users
                  </div>
                </div>

                {/* Card 6 */}
                <div className="stat-card">
                  <div className="card-title">First-time recharge number</div>
                  <div className="card-value-inline">
                    <span>
                      Number of people: <strong>{fmt(stats?.firstTimeRechargeCount)}</strong>
                    </span>
                    <span>
                      Amount: <strong className="highlight-amount">{fmt(stats?.firstTimeRechargeAmount)}</strong>
                    </span>
                  </div>
                  <div className="card-desc">
                    Number of users and amount recharged on the same day -
                    Official users
                  </div>
                </div>

                {/* Card 7 */}
                <div className="stat-card">
                  <div className="card-title">Number of registered users</div>
                  <div className="card-value">{fmt(stats?.todayOfficialRegistered)}</div>
                  <div className="card-desc">
                    Number of registered users on the same day - official users
                  </div>
                </div>

                {/* Card 8 */}
                <div className="stat-card">
                  <div className="card-title">Recharge amount</div>
                  <div className="card-value">{fmt(stats?.todayOfficialRechargeAmount)}</div>
                  <div className="card-desc">
                    Total recharge amount for the day - official
                  </div>
                </div>

                {/* Card 9 */}
                <div className="stat-card">
                  <div className="card-title">Withdrawal amount</div>
                  <div className="card-value">{fmt(stats?.todayWithdrawAmount)}</div>
                  <div className="card-desc">
                    Total withdrawal amount for the day - official
                  </div>
                </div>

                {/* Card 10 */}
                <div className="stat-card">
                  <div className="card-title">Total Balance</div>
                  <div className="card-value">{fmt(stats?.depositWithdrawDiff)}</div>
                  <div className="card-desc">
                    Daily deposit and withdrawal balance difference - official
                  </div>
                </div>
              </div>
            </div>

            {/* Business tabs — resolve sub-item page or fall back to placeholder */}
            {tabs.map((tab) => {
              const Page = resolvePage(tab.title);
              return (
                <div
                  key={tab.key + "-" + (refreshKeys[tab.key] || 0)}
                  className={`layui-tab-item${active === tab.key ? " layui-show" : ""}`}
                >
                  {Page ? (
                    <Page
                      {...(tab.props || {})}
                      onClose={() => closeTab(tab.key)}
                    />
                  ) : (
                    <div className="layui-fluid">
                      <div className="fly-panel fly-none">
                        <i className="layui-icon layui-icon-404" />
                        <p>
                          The「{tab.title}」page does not exist or is not yet
                          available
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab right-click menu (刷新/关闭 options) */}
        {tabMenu && (
          <div
            id="tab_right"
            style={{
              display: "block",
              left: tabMenu.x,
              top: tabMenu.y + 10,
              background: "#fff",
              boxShadow: "1px 1px 20px rgba(0,0,0,.3)",
              zIndex: 200,
            }}
          >
            <dl className="layui-nav-child">
              {!tabMenuForHome && (
                <dd onClick={() => refreshTab(tabMenu.key)}>Refresh Current</dd>
              )}
              {!tabMenuForHome && (
                <dd onClick={() => closeTab(tabMenu.key)}>Close Current Tab</dd>
              )}
              <dd onClick={() => closeOthers(tabMenu.key)}>Close Other Tabs</dd>
              <dd onClick={closeAll}>Close All Tabs</dd>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
