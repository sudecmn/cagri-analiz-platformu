import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axiosInstance";
import "./Dashboard.css";

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#9ca3af",
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data);
      } catch (err) {
        setError("İstatistikler yüklenemedi.");
      }
    }
    fetchStats();
  }, []);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!stats) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div className="dashboard-page">
      <h1>Çağrı Analiz Paneli</h1>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Toplam Çağrı</h3>
            <span className="stat-icon" aria-hidden="true">📞</span>
          </div>
          <p className="stat-value">{stats.total_calls}</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Ort. Duygu Skoru</h3>
            <span className="stat-icon" aria-hidden="true">🙂</span>
          </div>
          <p className="stat-value">
            {stats.avg_sentiment_score !== null
              ? stats.avg_sentiment_score.toFixed(2)
              : "—"}
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Maskelenen KVKK Verisi</h3>
            <span className="stat-icon" aria-hidden="true">🛡️</span>
          </div>
          <p className="stat-value">{stats.masked_data_count}</p>
        </div>
      </div>

      <div className="stats-sections">
        <div className="stats-section">
          <h3>Duygu Dağılımı</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={Object.entries(stats.sentiment_distribution).map(([sentiment, count]) => ({
                  name: sentiment,
                  value: count,
                }))}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {Object.keys(stats.sentiment_distribution).map((sentiment) => (
                  <Cell key={sentiment} fill={SENTIMENT_COLORS[sentiment] || "#9ca3af"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stats-section">
          <h3>En Sık Konular</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.top_topics} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="topic" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b6ff0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;