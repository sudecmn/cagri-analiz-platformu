import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LoginPage.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("name", response.data.name);
      navigate("/dashboard");
    } catch (err) {
      setError("E-posta veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <h1 className="login-title">
        Call<span>Mind</span>
      </h1>
      <p className="login-subtitle">Yapay Zeka Destekli Çağrı Analiz Platformu</p>

      <div className="login-card">
        <h2>Giriş Yap</h2>
        <p className="hint">Hesabınıza erişmek için bilgilerinizi girin.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-posta Adresi</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ayse.kaya@callmind.com"
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
              placeholder="••••••••"
              required
            />
          </div>

          <a href="#" className="forgot-link">Şifremi Unuttum</a>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap →"}
          </button>
        </form>
      </div>

      <p className="login-footer"> KVKK uyumlu, uçtan uca şifreli altyapı</p>
    </div>
  );
}

export default LoginPage;