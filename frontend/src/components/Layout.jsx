import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./Layout.css";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  function handleSearchSubmit() {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/transcripts?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  }

  const userRole = localStorage.getItem("role");
  const userName = localStorage.getItem("name") || "";
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const showTabNav = location.pathname === "/dashboard" || location.pathname === "/transcripts";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🎙️</span>
          <span>Call<b>Mind</b></span>
        </div>
        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
          >
            Dashboard
          </Link>
          <Link
            to="/transcripts"
            className={`nav-item ${location.pathname === "/transcripts" ? "active" : ""}`}
          >
            Transkriptler
          </Link>
          {userRole === "admin" && (
            <Link
              to="/users"
              className={`nav-item ${location.pathname === "/users" ? "active" : ""}`}
            >
              Kullanıcı Yönetimi
            </Link>
          )}
        </nav>
        <button className="logout-button" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-search">
            <span
              className="search-icon"
              role="button"
              tabIndex={0}
              onClick={handleSearchSubmit}
              aria-label="Ara"
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Çağrı, müşteri veya temsilci ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <div className="topbar-actions">
            <div className="notification-bell" aria-label="Bildirimler">
              🔔
              <span className="notification-dot"></span>
            </div>
            <div className="user-avatar">{userInitials}</div>
          </div>
        </header>

        {showTabNav && (
          <nav className="tab-nav">
            <Link
              to="/dashboard"
              className={`tab-item ${location.pathname === "/dashboard" ? "active" : ""}`}
            >
              Yönetici Dashboard
            </Link>
            <Link
              to="/transcripts"
              className={`tab-item ${location.pathname === "/transcripts" ? "active" : ""}`}
            >
              Transkript Yükle
            </Link>
          </nav>
        )}

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;