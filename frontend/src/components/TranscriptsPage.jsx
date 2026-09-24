import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import "./TranscriptsPage.css";
import { useNavigate, useSearchParams } from "react-router-dom";

const MASK_LABELS = ["[TCKN_GİZLENDİ]", "[TELEFON_GİZLENDİ]", "[IBAN_GİZLENDİ]"];
const MASK_LABEL_PATTERN = /(\[(?:TCKN|TELEFON|IBAN)_GİZLENDİ\])/g;

function renderMaskedContent(text) {
  return text.split(MASK_LABEL_PATTERN).map((part, index) =>
    MASK_LABELS.includes(part) ? (
      <span key={index} className="mask-badge">{part}</span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function TranscriptsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [transcripts, setTranscripts] = useState([]);
  const [error, setError] = useState("");

  const [audioFile, setAudioFile] = useState(null);
  const [audioCallDate, setAudioCallDate] = useState("");
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [lastUploaded, setLastUploaded] = useState(null);

  async function fetchTranscripts() {
    try {
      const response = searchQuery
        ? await api.get("/transcripts/search", { params: { q: searchQuery } })
        : await api.get("/transcripts");
      setTranscripts(response.data);
    } catch (err) {
      setError("Transkriptler yüklenemedi.");
    }
  }

  useEffect(() => {
    fetchTranscripts();
  }, [searchQuery]);

  async function handleAudioUpload(e) {
    e.preventDefault();
    setAudioError("");
    setAudioUploading(true);
    setLastUploaded(null);

    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("call_date", audioCallDate);

    try {
      const response = await api.post("/transcripts/upload-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLastUploaded(response.data);
      setAudioFile(null);
      setAudioCallDate("");
      await fetchTranscripts();
    } catch (err) {
      setAudioError("Ses dosyası yüklenemedi.");
    } finally {
      setAudioUploading(false);
    }
  }

  async function handleExportExcel() {
    try {
      const response = await api.get("/transcripts/export/excel", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transkriptler.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Excel dosyası indirilemedi.");
    }
  }

  return (
    <div className="transcripts-page">
      <div className="upload-form">
        <h2>Ses Kaydından Transkript Oluştur</h2>
        {audioError && <p className="error-message">{audioError}</p>}
        <form onSubmit={handleAudioUpload}>
          <div className="form-group">
            <label htmlFor="audio">Ses Dosyası</label>
            <input
              id="audio"
              type="file"
              accept="audio/*,video/mp4"
              onChange={(e) => setAudioFile(e.target.files[0])}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="audioCallDate">Çağrı Tarihi</label>
            <input
              id="audioCallDate"
              type="date"
              value={audioCallDate}
              onChange={(e) => setAudioCallDate(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={audioUploading}>
            {audioUploading ? "İşleniyor..." : "Yükle ve Metne Çevir"}
          </button>
        </form>

        {lastUploaded && (
          <div className="last-uploaded-box">
            <h3>Oluşturulan Transkript</h3>
            <p>{renderMaskedContent(lastUploaded.masked_content)}</p>
          </div>
        )}
      </div>

      <div className="transcript-list">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>{searchQuery ? `"${searchQuery}" için arama sonuçları` : "Geçmiş Transkriptler"}</h2>
          <button className="export-button" onClick={handleExportExcel}>Excel'e Aktar</button>
        </div>
        {error && <p className="error-message">{error}</p>}
        {transcripts.length === 0 && (
          <p className="empty-state">
            {searchQuery ? "Arama sonucu bulunamadı." : "Henüz transkript yok."}
          </p>
        )}
        {transcripts.map((t) => (
          <div
            key={t.id}
            className="transcript-item"
            onClick={() => navigate(`/transcripts/${t.id}`, { state: { transcript: t } })}
            style={{ cursor: "pointer" }}
          >
            <span className="transcript-date">{t.call_date}</span>
            <p>{renderMaskedContent(t.masked_content)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TranscriptsPage;