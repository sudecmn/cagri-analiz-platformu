import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";
import "./TranscriptDetail.css";

function TranscriptDetail() {
  const { id } = useParams();
  const location = useLocation();
  const transcript = location.state?.transcript;

  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const role = localStorage.getItem("role");

  const [evaluation, setEvaluation] = useState(null);
  const [score, setScore] = useState(50);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [retrying, setRetrying] = useState(false);

  const timeoutRef = useRef(null);

  async function checkStatus() {
    try {
      const response = await api.get(`/transcripts/${id}/analysis`);
      setAnalysis(response.data);

      // Eğer backend "pending" dönüyorsa 2 saniye sonra tekrar sor
      if (response.data.status === "pending") {
        timeoutRef.current = setTimeout(checkStatus, 2000);
      }
      // Eğer "completed" veya "failed" gelirse setTimeout bir daha çağrılmaz, döngü kendiliğinden biter!

    } catch (err) {
      setError("Analiz alınamadı.");
    }
  }

  useEffect(() => {
    checkStatus(); // Sayfa açıldığında ilk kontrolü başlat

    // Kullanıcı analiz bitmeden başka sayfaya geçerse zamanlayıcıyı temizle
    return () => clearTimeout(timeoutRef.current);
  }, [id]);

  useEffect(() => {
  async function fetchEvaluation() {
    try {
      const response = await api.get(`/transcripts/${id}/evaluation`);
      setEvaluation(response.data);
    } catch (err) {
      // 404 normal — henüz değerlendirme yoksa hata değil, sessizce geç
    }
  }
  fetchEvaluation();
}, [id]);

async function handleEvaluationSubmit(e) {
  e.preventDefault();
  setEvalError("");
  setSubmitting(true);

  try {
    const response = await api.post(`/transcripts/${id}/evaluation`, {
      quality_score: score,
      notes: notes,
    });
    setEvaluation(response.data);
  } catch (err) {
    setEvalError("Değerlendirme kaydedilemedi.");
  } finally {
    setSubmitting(false);
  }
}

async function handleRetryAnalysis() {
  setError("");
  setRetrying(true);

  try {
    await api.post(`/transcripts/${id}/retry-analysis`);
    await checkStatus();
  } catch (err) {
    setError("Analiz yeniden denenemedi.");
  } finally {
    setRetrying(false);
  }
}

async function handleExportPdf() {
  try {
    const response = await api.get(`/transcripts/${id}/export/pdf`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cagri-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    setError("PDF indirilemedi.");
  }
}

  return (
    <div className="detail-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1>Çağrı Detayı</h1>
      <button className="export-button" onClick={handleExportPdf}>PDF İndir</button>
    </div>

      <div className="detail-content">
        {transcript && (
          <div className="detail-card transcript-card">
            <div className="transcript-card-header">
              <div>
                <h2>Çağrı Transkripti</h2>
                <p className="detail-date">{transcript.call_date}</p>
              </div>
              {analysis?.sentiment && (
                <span className={`sentiment-badge sentiment-${analysis.sentiment}`}>
                  {analysis.sentiment}
                </span>
              )}
            </div>

            <div className="transcript-bubble">
              <p>{transcript.masked_content}</p>
            </div>
          </div>
        )}

        <div className="detail-card ai-analysis-card">
          <h2>Yapay Zeka Analizi</h2>

          {error && <div className="error-message">{error}</div>}

          {!analysis && !error && <p className="empty-state">Yükleniyor...</p>}

          {analysis && analysis.status === "pending" && (
            <p className="status-pending">⏳ Analiz devam ediyor, lütfen bekleyin...</p>
          )}

          {analysis && analysis.status === "failed" && (
            <div className="status-failed-block">
              <p className="status-failed">❌ Analiz başarısız oldu.</p>
              <button
                type="button"
                className="retry-button"
                onClick={handleRetryAnalysis}
                disabled={retrying}
              >
                {retrying ? "Yeniden deneniyor..." : "Analizi Yeniden Dene"}
              </button>
            </div>
          )}

          {analysis && analysis.status === "completed" && (
            <div className="analysis-grid">
              <div className="analysis-box analysis-box-summary">
                <h3>📄 Özet</h3>
                <p>{analysis.summary}</p>
              </div>

              <div className="analysis-box">
                <h3>🙂 Duygu</h3>
                <span className={`sentiment-badge sentiment-${analysis.sentiment}`}>
                  {analysis.sentiment}
                </span>
                <p className="analysis-box-meta">Skor: {analysis.sentiment_score}</p>
              </div>

              <div className="analysis-box">
                <h3>🏷️ Konu</h3>
                <p>{analysis.topic}</p>
              </div>

              <div className="analysis-box analysis-box-keywords">
                <h3># Anahtar Kelimeler</h3>
                <div className="keyword-list">
                  {analysis.keywords?.map((k) => (
                    <span key={k} className="keyword-badge">{k}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {(role === "supervisor" || role === "admin") && (
          <div className="detail-card evaluation-card">
            <h2>Süpervizör Değerlendirmesi</h2>

            {evalError && <div className="error-message">{evalError}</div>}

            {evaluation ? (
              <div className="evaluation-result">
                <div className="evaluation-result-row">
                  <span className="evaluation-result-label">Performans Puanı</span>
                  <span className="evaluation-result-value">{evaluation.quality_score}</span>
                </div>
                <div className="evaluation-result-row">
                  <span className="evaluation-result-label">Notlar</span>
                  <p className="evaluation-result-value">{evaluation.notes}</p>
                </div>
              </div>
            ) : (
              <form className="evaluation-form" onSubmit={handleEvaluationSubmit}>
                <div className="form-field">
                  <label htmlFor="score">Performans Puanı</label>
                  <div className="score-slider-row">
                    <input
                      id="score"
                      type="range"
                      min="1"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                    />
                    <span className="score-value">{score}</span>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="notes">Notlar</label>
                  <textarea
                    id="notes"
                    placeholder="Temsilcinin performansına ilişkin notlarınızı yazın..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={submitting}>
                  {submitting ? "Kaydediliyor..." : "Değerlendirmeyi Kaydet"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TranscriptDetail;