# Source Review and Asset Policy

## Identity
Original file: `public/assets/brand/bym-logo-original.png` supplied from BYM sources. Do not reinterpret with image generation; it is displayed as an unmodified image asset.

## Historical and on-disk sources
- Main Drive directory: https://drive.google.com/drive/folders/1d4w9Z5LauyFYbtI6T5PRZjFlTf257LWn
- Reported project facts: https://drive.google.com/file/d/1P8jI0zuNKbBsjVNoLh2wDngHKVo8pEFU/view
- Rüya Şehir photo folder: https://drive.google.com/drive/folders/1YQZREwyGq3iCdcQt-dcJAoUEJlceSXZ2
- Original architectural plan: `public/assets/source-plans/ruya-sehir-3-daire-kat-plani.jpg`, whose direct link was https://drive.google.com/file/d/1DCph3s3WLIIImvXSxQUltM3RtL1zoKx7/view
- Earth texture: `public/assets/earth/nasa-blue-marble-5400.jpg` — use and verify NASA Blue Marble imagery attribution, source and license when publishing; if provenance cannot be established replace with an appropriately licensed and cited source.

## Critical Rüya Şehir image audit
- `IMG_4358.JPG` located in a Rüya Şehir-labeled collection displays the text **BURAK MANZARA EVLERİ** and must not be used as Rüya Şehir.
- `IMG_3345.JPG` visually matches the incompatible Burak Manzara facade; do not use for Rüya Şehir until independently resolved.
- Every photograph in `public/assets/project/review-required/` is **unapproved** even if its folder name implies Rüya Şehir. Do not promote to an officially verified media set without client review.
- Exclude the `Yapay Zeka Görseller` folder from factual project portfolio and model reconstruction.

## Required architectural confirmations
- Approved building elevation images (all faces)
- Exact location/georeference
- Verified floor counts and block configuration
- Licensed GLB/glTF/FBX/SketchUp/Revit/IFC or underlying architectural CAD
- Client permission for photo/video publication
- High-quality original 360° or interior geometry if free-roam is required

Do not publish invented specifications, false geography, fake construction footage or AI-created people representing the company.

## Derived delivery files (resized only, same provenance as originals)
- `public/assets/earth/nasa-blue-marble-2048.jpg` — 2048×1024 Lanczos downscale of `nasa-blue-marble-5400.jpg`. Used on phones and GPUs whose `MAX_TEXTURE_SIZE` is below 8192 (a 5400px texture fails to upload on 4096-limit devices). Same attribution/licence requirement as the original.
- `public/assets/project/review-required/IMG_0810_peyzaj-1600.jpg` — 1600×900 downscale of `IMG_0810_peyzaj.jpg` for mobile bandwidth. Still **review required / unapproved**, exactly like its source.
- The BYM logo has no derived copy and is never re-encoded.
- `public/assets/bym-portfolio-curated/**` — curated delivery set derived from `public/assets/bym-portfolio/**` by `scripts/grade-portfolio.mjs`: light crops (e.g. cars trimmed from `ruya-hero`), a restrained warm grade (≈+3.5% red / −5% blue, −7% saturation, +5% contrast), WebP q86. `bilal-hero` is a 2× Lanczos upscale of a 1024px source (soft at full width; replace with the Drive original when available). Same provenance and **review-pending** status as the sources. Not used anywhere on the site: `ruya-construction` (rubble), `burak-landscape` (low-res, car in frame), `nisa-spa` (weak crop).
- 2026-11-19: high-resolution images embedded in `BYM KURUMSAL KATALOG.pdf` were inspected but not used — their CMYK colour could not be recovered faithfully, and per-project attribution inside the catalog is unconfirmed.
