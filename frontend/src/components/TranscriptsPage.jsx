import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import "./TranscriptsPage.css";

function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState([]);
  const [content, setContent] = useState("");
  const [callDate, setCallDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function fetchTranscripts() {
    try {
      const response = await api.get("/transcripts");
      setTranscripts(response.data);
    } catch (err) {
      setError("Transkriptler yüklenemedi.");
    }
  }

  useEffect(() => {
    fetchTranscripts();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setUploading(true);

    try {
      await api.post("/transcripts", { content, call_date: callDate });
      setContent("");
      setCallDate("");
      await fetchTranscripts(); // liste güncellensin diye tekrar çekiyoruz
    } catch (err) {
      setError("Transkript yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="transcripts-page">
      <h1>Transkriptler</h1>

      <form className="upload-form" onSubmit={handleUpload}>
        <h2>Yeni Transkript Yükle</h2>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Çağrı Tarihi</label>
          <input
            type="date"
            value={callDate}
            onChange={(e) => setCallDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Transkript Metni</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Çağrı transkriptini buraya yapıştırın..."
            required
          />
        </div>

        <button type="submit" disabled={uploading}>
          {uploading ? "Yükleniyor..." : "Yükle"}
        </button>
      </form>

      <div className="transcript-list">
        <h2>Geçmiş Transkriptler</h2>
        {transcripts.length === 0 && <p className="empty-state">Henüz transkript yok.</p>}
        {transcripts.map((t) => (
          <div key={t.id} className="transcript-item">
            <span className="transcript-date">{t.call_date}</span>
            <p>{t.masked_content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TranscriptsPage;