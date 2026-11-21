import {BASE_PATH} from '@/lib/asset';
export type ProjectCategory = 'Konut' | 'Villa' | 'Ticari Yapı';
export interface BYMProject {
  slug: string;
  name: string;
  kicker: string;
  category: ProjectCategory;
  location: string;
  intro: string;
  description: string;
  hero: string;
  /** CSS object-position for cover crops of the hero (default centre). */
  heroPos?: string;
  images: { src: string; alt: string; pos?: string; kind?: 'photograph' | 'visualization-status-unconfirmed' }[];
  notes: string[];
}

// Curated, colour-graded delivery set (see scripts/grade-portfolio.mjs); originals stay in /assets/bym-portfolio.
const asset = (slug: string, key: string) => `${BASE_PATH}/assets/bym-portfolio-curated/${slug}/${key}.webp`;

// Publication gate: all project media need final client confirmation.
// Do not silently reinterpret renderings as completed-building photographs.
export const BYM_PROJECTS: BYMProject[] = [
  {
    slug: 'ruya-sehir', name: 'Rüya Şehir', kicker: 'Yaşamın merkezinde', category: 'Konut', location: 'Ankara',
    intro: 'Birlikte yaşamanın mimari karşılığı.',
    description: 'Rüya Şehir, konut ve peyzajın bir araya geldiği bir yaşam alanı olarak BYM İnşaat proje arşivinde yer alır. Seçki, yapının fotoğraflarını ve peyzaj görselleştirmesini bir arada sunar.',
    hero: asset('ruya-sehir','ruya-garden'),
    images: [
      {src:asset('ruya-sehir','ruya-garden'),alt:'Rüya Şehir blokları ve peyzaj alanı, gün batımında'},
      {src:asset('ruya-sehir','ruya-hero'),alt:'Rüya Şehir konut bloklarının cephesi',pos:'center 30%'},
      {src:asset('ruya-sehir','ruya-entrance'),alt:'Rüya Şehir tanıtım ofisi girişi ve isim tabelası'},
      {src:asset('ruya-sehir','ruya-landscape'),alt:'Rüya Şehir peyzaj görselleştirmesi',kind:'visualization-status-unconfirmed'},
    ],
    notes: ['Konut yaşamı', 'Peyzaj alanları', 'Mimari planlama'],
  },
  {
    slug: 'gaziantep-villalari', name: 'Gaziantep Villaları', kicker: 'Müstakil yaşam', category: 'Villa', location: 'Gaziantep',
    intro: 'Mimari, kişisel yaşam alanına dönüştüğünde.',
    description: 'Gaziantep villaları, BYM İnşaat proje portföyünde yer alan müstakil konut çalışmalarındandır. Buradaki seçkiler farklı villa etaplarını temsil edebilir; tek bir yapının tüm aşamalarıymış gibi sunulmaz.',
    hero: asset('gaziantep-villalari','villa-hero'), heroPos:'center 38%',
    images: [
      {src:asset('gaziantep-villalari','villa-hero'),alt:'Villa projesinin dış mimari görünümü',kind:'visualization-status-unconfirmed'},
      {src:asset('gaziantep-villalari','villa-facade'),alt:'Villa projesinin cephe ve çevre görünümü',kind:'visualization-status-unconfirmed'},
      {src:asset('gaziantep-villalari','villa-pool'),alt:'Villa projesi havuz ve teras alanı',kind:'visualization-status-unconfirmed'},
    ],
    notes: ['Müstakil yaşam', 'Mimari tasarım', 'Dış mekân'],
  },
  {
    slug: 'nisa-apartmani', name: 'Nisa Apartmanı', kicker: 'Mekânın içinde', category: 'Konut', location: 'Türkiye',
    intro: 'İç mekânda günlük yaşamın ayrıntıları.',
    description: 'Nisa Apartmanı, BYM İnşaat’ın tamamlanan konut projeleri arasında yer almaktadır. Seçili fotoğraflar, yaşam alanlarının iç mekân detaylarını gösterir.',
    hero: asset('nisa-apartmani','nisa-hero'),
    images: [
      {src:asset('nisa-apartmani','nisa-hero'),alt:'Nisa Apartmanı konut iç mekânı'},
      {src:asset('nisa-apartmani','nisa-kitchen'),alt:'Nisa Apartmanı mutfak uygulaması'},
    ],
    notes: ['Konut', 'İç mekân', 'Detay tasarımı'],
  },
  {
    slug: 'burak-manzara-evleri', name: 'Burak Manzara Evleri', kicker: 'Kentle kurulan ilişki', category: 'Konut', location: 'Türkiye',
    intro: 'Kent yaşamına açılan yeni bir perspektif.',
    description: 'Burak Manzara Evleri, BYM İnşaat’ın konut projeleri arasında bulunur. Cephe, giriş ve akşam peyzajından oluşan seçki, yapının mimari kimliğini farklı açılardan anlatır.',
    hero: asset('burak-manzara-evleri','burak-hero'), heroPos:'center 32%',
    images: [
      {src:asset('burak-manzara-evleri','burak-hero'),alt:'Burak Manzara Evleri dış cephe görünümü',pos:'center 32%'},
      {src:asset('burak-manzara-evleri','burak-signage'),alt:'Burak Manzara Evleri giriş cephesi ve isim tabelası',pos:'center 60%'},
      {src:asset('burak-manzara-evleri','burak-night'),alt:'Burak Manzara Evleri peyzajının akşam görünümü',pos:'center 55%'},
    ],
    notes: ['Konut', 'Kentsel doku', 'Peyzaj'],
  },
  {
    slug: 'bilal-kafe', name: 'Bilal Kafe', kicker: 'Sosyal mekân', category: 'Ticari Yapı', location: 'Türkiye',
    intro: 'İnsanların bir araya geldiği mekânlar.',
    description: 'Bilal Kafe, BYM İnşaat’ın portföyünde yer alan sosyal ve ticari mekân çalışmalarından biridir. İç ve dış mekânların farklı zamanlardaki görünüşleriyle projeyi keşfedin.',
    hero: asset('bilal-kafe','bilal-hero'),
    images: [
      {src:asset('bilal-kafe','bilal-hero'),alt:'Bilal Kafe ve peyzajının gece havadan görünümü'},
      {src:asset('bilal-kafe','bilal-interior'),alt:'Bilal Kafe iç mekânı ve oturma alanları'},
      {src:asset('bilal-kafe','bilal-bar'),alt:'Bilal Kafe iç mekân servis alanı'},
    ],
    notes: ['Sosyal yaşam', 'Ticari mekân', 'İç-dış mekân deneyimi'],
  },
];

export const BYM_CATEGORIES = ['Tümü','Konut','Villa','Ticari Yapı'] as const;
export const COMPANY = {
  name: 'BYM İnşaat',
  email: 'info@byminsaat.com.tr',
  // Source: upgrade kit (cites BYM KURUMSAL KATALOG.pdf, not in this repo). byminsaat.com.tr/hakkimizda
  // only says '20 yıldır' — confirm with the client before publishing.
  founded: '2003',
  tagline: 'Güven, Tutarlılıkla İnşa Edilir.',
  originalWebsite: 'https://byminsaat.com.tr/',
  about: '2003 yılında temelleri atılan BYM İnşaat; taahhüt, danışmanlık ve yapı projelendirme alanlarında faaliyet göstermektedir. Kurumsal yaklaşımında güven, yenilik, kalite ve çevreye duyarlılık öne çıkmaktadır.',
  values: [
    {title:'Güven', text:'Her projenin temelinde sürdürülebilir iş ilişkileri ve sorumluluk anlayışı.'},
    {title:'Tutarlılık', text:'Planlamadan uygulamaya uzanan disiplinli ve bütüncül yaklaşım.'},
    {title:'Yaşam', text:'İnsanı, estetiği ve çevresini birlikte ele alan mekânlar.'},
  ],
};
export const SERVICES = [
  {num:'01',title:'İnşaat',desc:'Konut, villa, apartman ve farklı işlevlere sahip yapıların anahtar teslim yapım süreçleri.'},
  {num:'02',title:'Mimari Hizmetler',desc:'Kavramsal tasarım, iç mekân, yapı projelendirme ve uygulama çözümleri.'},
  {num:'03',title:'Peyzaj',desc:'Arazi koşullarına, kullanım amaçlarına ve çevresel ihtiyaçlara yönelik dış mekân düzenlemeleri.'},
  {num:'04',title:'Danışmanlık',desc:'Gayrimenkul, maliyet, zaman yönetimi ve yatırım süreçlerinde proje odaklı destek.'},
  {num:'05',title:'Kentsel Dönüşüm',desc:'Güvenli, planlı ve yaşanabilir yapı çevreleri oluşturmayı hedefleyen dönüşüm uygulamaları.'},
];
export const PRESS = [
  {title:'Keçiören’de “rüya” proje', href:'https://byminsaat.com.tr/keciorende-ruya-proje/',category:'Proje Haberleri'},
  {title:'Yükseltepe Kentsel Dönüşüm Projesi başladı',href:'https://byminsaat.com.tr/yukseltepe-kentsel-donusum-projesi-basladi/',category:'Kentsel Dönüşüm'},
  {title:'Ankara Yükseltepe Kentsel Dönüşüm Projesi’nin temeli atıldı!',href:'https://byminsaat.com.tr/ankara-yukseltepe-kentsel-donusum-projesinin-temeli-atildi/',category:'Şantiye ve Haberler'},
];
