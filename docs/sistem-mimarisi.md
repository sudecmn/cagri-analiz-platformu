# Sistem Mimarisi
## AI Destekli Çağrı Analiz ve Kalite Kontrol Platformu

---
## 1. Mimari Yaklaşım: Katmanlı Mimari (Layered Architecture)

Sistem üç ana katmana ayrılır, her katmanın tek bir sorumluluğu vardır:

| Katman | Teknoloji | Sorumluluk |
|---|---|---|
| Sunum (Presentation) | React | Kullanıcı arayüzü, kullanıcı etkileşimi |
| İş Mantığı (Business Logic) | FastAPI (Python) | İstekleri işleme, kurallar, veritabanı ve AI servisiyle koordinasyon |
| Veri (Data) | PostgreSQL | Kalıcı veri saklama |

Harici bir bileşen olarak **AI Servisi** (OpenAI API veya yerel LLM) backend tarafından çağrılır; bu bir katman değil, backend'in kullandığı dış bir servistir.

> **Neden katmanlı mimari seçtik?** Küçük/orta ölçekli bir proje için mikroservis mimarisi gereksiz karmaşıklık getirir (her servisi ayrı deploy etmek, servisler arası iletişim, service discovery vb.). Katmanlı mimari + monolitik backend, hem öğrenmesi hem de geliştirmesi daha kolaydır. İleride ölçeklenmesi gerekirse (örn. AI analiz işini ayrı bir servise taşımak), katmanlar zaten net ayrıldığı için bu geçiş kolaylaşır.

---

## 2. Yüksek Seviye Mimari Diyagramı

```
┌─────────────┐      REST API       ┌─────────────┐
│  Frontend   │ ◄─────(JSON)──────► │   Backend   │
│   (React)   │                     │  (FastAPI)  │
└─────────────┘                     └──────┬──────┘
                                            │
                          ┌─────────────────┼──────────────────┐
                          │ SQL                                │ API isteği
                          ▼                                     ▼
                   ┌─────────────┐                      ┌──────────────┐
                   │ PostgreSQL  │                      │  AI Servisi  │
                   │ (Veritabanı)│                      │ (OpenAI/LLM) │
                   └─────────────┘                      └──────────────┘
```



---

## 3. Örnek Uçtan Uca Akış: Transkript Yükleme ve Analiz

1. Kullanıcı (agent), React arayüzünden transkript yükler
2. React, backend'e `POST /transcripts` isteği gönderir
3. Backend, gelen veriyi Pydantic şeması ile doğrular (bkz. Bölüm 4.1), geçersizse `422 Unprocessable Entity` döner
4. Backend, transkriptte KVKK kontrolü yapıp maskeler (bkz. gereksinim-analizi.md, FR-14 kararı), maskelenmiş halini PostgreSQL'e kaydeder
5. Backend, AI analiz işlemini **arka plan görevi (background task)** olarak başlatır ve React'e hemen `202 Accepted` yanıtı döner (LLM analizi 5-10 saniye sürebileceği için isteği bloklamamak gerekir)
6. React, analiz tamamlanana kadar `GET /transcripts/{id}/analysis` endpoint'ini belirli aralıklarla kontrol eder (polling)
7. Arka planda AI servisinden dönen sonuç, backend tarafından PostgreSQL'e kaydedilir
8. Polling isteği sonucu hazır bulduğunda, React sonucu ekranda gösterir

---

## 4. REST API Tasarım Prensibi

REST API'de her uç nokta (endpoint), bir **kaynak** (resource) ve bir **HTTP metodu**ndan oluşur:

| Metod | Endpoint | Anlamı |
|---|---|---|
| POST | `/auth/login` | Kullanıcı girişi (JWT token döner) |
| GET | `/auth/me` | Giriş yapmış kullanıcının bilgisi |
| POST | `/users` | Yeni kullanıcı ekleme (sadece admin) |
| GET | `/users` | Kullanıcı listesi (rol bazlı görünürlük) |
| POST | `/transcripts` | Yeni transkript yükleme → `202 Accepted` döner |
| GET | `/transcripts` | Transkript listesi (filtreleme destekli — bkz FR-13) |
| GET | `/transcripts/{id}` | Tek transkript detayı |
| GET | `/transcripts/{id}/analysis` | Transkriptin AI analiz sonucu (polling ile kontrol edilir) |
| POST | `/transcripts/{id}/evaluation` | Süpervizör kalite puanı girişi (bkz FR-15) |
| GET | `/dashboard/stats` | Dashboard istatistikleri |

### 4.1 Veri Doğrulama Katmanı (DTO / Pydantic Şemaları)

FastAPI'da gelen/giden veri, veritabanı modelinden **ayrı** şemalarla (Pydantic) tanımlanır:

- **Request Schema:** Frontend'den ne gelmesi gerektiğini tanımlar (örn. transkript metni boş olamaz)
- **Response Schema:** Frontend'e ne döneceğini tanımlar (örn. kullanıcı şifre hash'i asla response'a dahil edilmez)

Bu ayrım sayesinde, geçersiz veri (örn. boş transkript) veritabanına ulaşmadan `422 Unprocessable Entity` hatasıyla reddedilir.
