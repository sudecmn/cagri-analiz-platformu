Gereksinim Analizi
AI Destekli Çağrı Analiz ve Kalite Kontrol Platformu
Tarih: 06.07.2026 
________________________________________
1. Projenin Amacı
Çağrı merkezi süreçlerinde kullanılan çağrı transkriptlerini yapay zeka ile analiz ederek:
•	Otomatik özet çıkarma
•	Duygu analizi
•	Konu sınıflandırması
•	Anahtar kelime tespiti
•	KVKK kapsamındaki hassas veri tespiti
yapan ve bu analizleri dashboard üzerinden raporlayan bir web uygulaması geliştirmek.
________________________________________
2. Kapsam (Scope)
Kapsam İçi
•	Metin formatında yüklenen çağrı transkriptlerinin analizi
•	Örnek/test verisi ile geliştirme ve test 
•	Web tabanlı kullanıcı arayüzü
•	Rol bazlı yetkilendirme (agent, süpervizör, admin)
Kapsam Dışı
•	Ses dosyasından metne çevirme (speech-to-text) — transkriptler zaten metin olarak sisteme girecek
•	Gerçek zamanlı (canlı) çağrı dinleme/analiz
•	Mobil uygulama
________________________________________
3. Aktörler (Kullanıcı Rolleri) ve Yetkileri
Rol	Açıklama	Yetkiler
Müşteri Temsilcisi (Agent)	Çağrıları gerçekleştiren personel	Kendi çağrılarını görüntüleme, kendi çağrı analiz sonuçlarını görme
Süpervizör / Takım Lideri	Ekibi yöneten kişi	Ekibindeki tüm agent'ların çağrılarını ve analizlerini görme, ekip dashboard'unu görüntüleme
Yönetici (Admin)	Sistem yöneticisi	Tüm kullanıcıları/çağrıları yönetme, kullanıcı ekleme-silme, tüm dashboard'lara erişim, sistem ayarları
________________________________________
4. Fonksiyonel Gereksinimler
Sistem ne yapmalı?
4.1 Kimlik Doğrulama ve Kullanıcı Yönetimi
•	FR-01: Kullanıcılar e-posta/şifre ile giriş yapabilmeli
•	FR-02: Admin, yeni kullanıcı ekleyip rol atayabilmeli
•	FR-03: Sistem, kullanıcının rolüne göre farklı yetkiler sunmalı

4.2 Çağrı Transkript Yönetimi
•	FR-04: Kullanıcı, metin formatında (.txt / .json) çağrı transkripti yükleyebilmeli
•	FR-05: Yüklenen transkriptler, ilgili agent ve tarih bilgisiyle veritabanına kaydedilmeli
•	FR-13: Kullanıcılar; tarih, agent, duygu tonu ve konuya göre gelişmiş filtreleme/arama yapabilmeli

4.3 Yapay Zeka Analiz Modülü
•	FR-06: Sistem, yüklenen transkript için otomatik özet oluşturmalı
•	FR-07: Sistem, çağrının duygu tonunu (pozitif/negatif/nötr) tespit etmeli
•	FR-08: Sistem, çağrının konusunu sınıflandırmalı (örn: "fatura sorunu", "teknik destek")
•	FR-09: Sistem, çağrıdaki önemli anahtar kelimeleri tespit etmeli
•	FR-10: Sistem, transkriptte KVKK kapsamına giren hassas verileri (TC kimlik no, kart no vb.) tespit etmeli
•	FR-14: Tespit edilen hassas veriler, arayüzde ve veritabanında maskelenerek gösterilmeli/saklanmalı

4.4 Dashboard ve Raporlama
•	FR-11: Süpervizör/admin, ekip bazlı istatistikleri dashboard'da görebilmeli
•	FR-12: Kullanıcı, analiz sonuçlarını PDF/Excel olarak dışa aktarabilmeli
•	FR-15: Süpervizör, analiz edilen bir çağrıya manuel değerlendirme notu ve kalite puanı girebilmeli (kalite kontrol modülü)
________________________________________
5. Fonksiyonel Olmayan Gereksinimler
•	NFR-01: Güvenlik — Kullanıcı şifreleri hash'lenerek saklanmalı, KVKK'ya uygun veri işleme yapılmalı
•	NFR-02: Performans — Bir transkriptin analiz süresi [henüz belirlenmedi — 2. hafta AI entegrasyonunda netleşecek]
•	NFR-03: Taşınabilirlik — Sistem Docker ile paketlenmeli, farklı ortamlarda kolayca ayağa kaldırılabilmeli
•	NFR-04: Kullanılabilirlik — Arayüz, teknik olmayan kullanıcılar (agent, süpervizör) için sade ve anlaşılır olmalı
________________________________________
6. Varsayımlar ve Kısıtlar
•	Transkriptler proje boyunca örnek/test verisi ile sağlanacak, gerçek müşteri verisi kullanılmayacak
•	Ses-metin dönüşümü kapsam dışı, transkriptler hazır metin olarak sisteme girecek
•	AI analiz modülü için OpenAI API veya yerel LLM kullanılacak 
________________________________________
7. Kullanım Senaryosu (Use Case) Örneği
Senaryo: Agent transkript yükler ve analiz sonucunu görür
1.	Agent sisteme giriş yapar
2.	"Yeni Transkript Yükle" ekranına gider
3.	Metin dosyasını/içeriğini yükler
4.	Sistem, transkripti AI modülüne gönderir
5.	Sistem özet, duygu analizi, konu, anahtar kelime ve KVKK tespiti sonuçlarını üretir
6.	Agent, sonuçları ekranda görüntüler

