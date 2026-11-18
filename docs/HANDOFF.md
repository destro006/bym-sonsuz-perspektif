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
