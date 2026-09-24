import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import "./UserManagement.css";

const ROLE_LABELS = {
  agent: "Temsilci",
  supervisor: "Süpervizör",
  admin: "Admin",
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("agent");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchUsers() {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err) {
      setError("Kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleToggleActive(user) {
    setError("");
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
      await fetchUsers();
    } catch (err) {
      setError("Kullanıcı durumu güncellenemedi.");
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await api.post("/users", { name, email, password, role, department });
      setName("");
      setEmail("");
      setPassword("");
      setRole("agent");
      setDepartment("");
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      setFormError("Kullanıcı oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentUserRole = localStorage.getItem("role");
  if (currentUserRole !== "admin") {
    return <p>Bu sayfaya erişim yetkiniz yok.</p>;
  }

  if (loading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div>
          <h1>Kullanıcı Yönetimi</h1>
          <p className="page-subtitle">Sistemdeki kullanıcıları görüntüleyin ve yönetin.</p>
        </div>
        <button className="add-user-button" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "İptal" : "+ Yeni Kullanıcı Ekle"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <div className="user-form-card">
          <h2>Yeni Kullanıcı</h2>
          {formError && <p className="error-message">{formError}</p>}
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label htmlFor="name">Ad Soyad</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">E-posta</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Rol</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="agent">Temsilci</option>
                <option value="supervisor">Süpervizör</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="department">Departman</label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
            </button>
          </form>
        </div>
      )}

      <div className="user-list">
        {users.length === 0 && <p className="empty-state">Henüz kullanıcı yok.</p>}
        {users.map((u) => (
          <div key={u.id} className="user-card">
            <div className="user-card-info">
              <p className="user-name">{u.name}</p>
              <p className="user-email">{u.email}</p>
            </div>

            <span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role] || u.role}</span>

            <span className="user-department">{u.department}</span>

            <span className={`status-badge ${u.is_active ? "status-active" : "status-inactive"}`}>
              {u.is_active ? "Aktif" : "Pasif"}
            </span>

            <button
              className={`toggle-status-button ${u.is_active ? "deactivate" : "activate"}`}
              onClick={() => handleToggleActive(u)}
            >
              {u.is_active ? "Pasife Al" : "Aktif Et"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserManagement;