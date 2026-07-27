import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./Layout.css";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

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
        </nav>
        <button className="logout-button" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;