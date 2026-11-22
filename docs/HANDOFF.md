# Devir notu — bilgisayarda devam etmek için

Bu klasör, bulut oturumunda yapılan son çalışmanın tam kopyasıdır (son commit: "Sync cloud cover with eased camera progress; cap scrub speed").
Önce `CLAUDE.md`'yi, sonra bu dosyayı okuyun.

## Kurulum
```bash
npm install
npm run lint:assets   # varlık kontrolü
npm run build         # üretim derlemesi
npm run dev           # http://localhost:3000
npm run preview:single  # tek dosyalık önizleme → preview-dist/index.html
```
Node.js >= 20.9 gerekir.

## Tamamlananlar
- ScrollTrigger ölçüm hatası düzeltildi (ilerleme %0'da takılıyordu); tek ilerleme kaynağı, yumuşatılmış ve hız sınırlı (0,5/sn) görsel ilerleme.
- Tek, sürekli kamera yolu (`Scene.tsx` → `CAMERA` anahtar kareleri); dikey ekranlarda geri çekilme.
- Kozmik ağ filamanları (`CosmicWeb.tsx`), galaksi + kalıcı uzak yıldızlar (`GalaxyField.tsx`), ortak nokta shader'ı (`Points.tsx`, `pointShader.ts`).
- Dünya → mimari geçişinde bulut örtüsü, kamerayla aynı yumuşatılmış ilerlemeden her karede yazılır (`cloudCover`).
- Mobil: WebGL/MAX_TEXTURE_SIZE yoklaması, düşük DPR, az parçacık, 2048 px Dünya ve 1600 px fotoğraf; WebGL yoksa yedek görünüm; hareket azaltma modu.
- Proje fotoğrafı her en-boy oranında "cover" ölçekleniyor; onay etiketi ve karartma katmanı.
- 07. bölümde orijinal logo (dosya değiştirilmeden) ile kapanış.
- Ortak başlık + mobil menü (`SiteHeader.tsx`), içerik sayfaları (`PageShell.tsx`), sayfa başlıkları.
- Projeler: Rüya Şehir bildirilen değerleri (3 blok × 18 kat …) "onay bekliyor" etiketiyle.

## Kurallar (değiştirmeyin)
- Logo: `public/assets/brand/bym-logo-original.png` — SHA256 `db8028f0c87497c3…`, hiçbir şekilde değiştirilmez.
- `IMG_4358` ve `IMG_3345` (Burak Manzara Evleri) kullanılmaz.
- Rüya Şehir = 3 blok × 18 kat; ayrı iki blok / on katlı BYM konseptiyle karıştırılmaz.
- Doğrulanmamış bina geometrisi, konum veya iletişim bilgisi uydurulmaz.

## Bekleyen dış girdiler
- Doğrulanmış Rüya Şehir GLB/glTF (katları adlandırılmış) veya müşteri onaylı render dizisi.
- Kesin proje koordinatları.
- Proje fotoğrafları için müşteri onayı; NASA Dünya dokusu lisans/atıf kontrolü.
- Gerçek iletişim bilgileri ve kurumsal metinler.

## Bilinen sınırlamalar / sonraki işler
- Kare hızı yalnızca yazılım GPU'su ile test edildi; gerçek telefonda ölçülmeli.
- Büyük atlamalarda bölüm yazısı 3D sahneden en fazla ~2,6 sn önde gidebilir (hız sınırının bedeli).
- Sıradaki önerilen işler: 04. bölüm için gerçek 3D bulut/atmosfer geçişi; FPS'e göre otomatik kalite düşürme ve ekran dışındayken çizimi durdurma; SEO/erişilebilirlik ince ayarı (indeksleme onaya kadar kapalı kalmalı).

## Birleştirme notu (bulut oturumu)
- Bilgisayardaki sürüm (kozmik giriş, şehre iniş, portföy sayfaları, kürasyonlu görseller) bulut dalına alındı.
- Üzerine eklenenler: GitHub Pages yayını (`npm run build:pages`, `.github/workflows/pages.yml`, `src/lib/asset.ts` ile alt yol), `PerformanceMonitor` için 3 sn ısınma ve 45/57 fps eşikleri, sahne ekrandan tamamen çıkınca çizimi durdurma.
- Canlı adres: https://destro006.github.io/bym-sonsuz-perspektif/ (bu dala her gönderimde otomatik güncellenir).
- Bilgisayarda devam ederken önce bu dalı çekin (`git pull`), aksi halde iki sürüm yeniden ayrışır.

## Concept 03 UI (post-intro) — local, not deployed
- Source: `BYM_Konsept03_UI_Gorsel_ve_Claude_Paketi.zip` (prompt `CLAUDE_CODE_TAM_UYGULAMA_PROMPTU.md`).
- Data: `data/ui03-media-manifest.json` → `src/data/ui03.ts` (single source; images `public/assets/bym-ui03/`). All images: source photos/renders, **publication approval pending**.
- Components: `src/components/ui03/{ProjectCarousel,Sections}.tsx`, styles `src/styles/ui03.css` (navy glass tokens, scoped `.u3` / `.exnav`).
- `HomeChapters.tsx` now renders Hero → Fikirden Yapıya (4 phases) → Projeler (3D carousel + per-project gallery, `?proje=<id>` deep link) → Hakkımızda → İletişim. Section ids/data-chapter unchanged.
- `ExhibitNav.tsx`: navy restyle + real collapsed menu ≤760px. Nav also shown via `html[data-u3post="1"]` when chapters are on screen (jump/deep-link case; intro untouched).
- 8 projects without media are listed as "Görseller hazırlanıyor" placeholders, never filled with other photos.
- Intro files (Scene, three/*, Experience) not modified.
