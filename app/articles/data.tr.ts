// app/articles/data.tr.ts
//
// Turkish versions of the highest-search-volume articles, served at
// /tr/makaleler/<türkçe-slug>.
//
// These are adaptations, not literal translations. The medical substance is
// kept identical to the English original (that's what the sources back), but
// the phrasing, examples and emergency guidance are written for a parent in
// Turkey — 112 rather than a generic "emergency number", °C only, and the
// wording a Turkish parent would actually search for.
//
// Every entry carries `enSlug` so the two language versions can declare each
// other via hreflang. Starting with five rather than all twenty is deliberate:
// enough to find out whether Turkish organic traffic materialises at all
// before committing to translating the rest.

import type { Article } from './data';

export type TrArticle = Omit<Article, 'category'> & {
  /** Turkish category label (free text — the EN union doesn't apply here). */
  category: string;
  /** Slug of the English counterpart, used to emit hreflang alternates. */
  enSlug: string;
};

export const trArticles: TrArticle[] = [
  {
    slug: 'bebekte-ates',
    enSlug: 'fever-basics-0-12m',
    title: 'Bebekte Ateş (0–12 ay): Ne Zaman Doktora Gitmeli?',
    excerpt:
      'Bebekte ateş kaç derecede tehlikelidir, evde ne yapılır, hangi durumda vakit kaybetmeden hekime başvurulur.',
    category: 'Ateş',
    author: 'BabyQ Editör',
    updated: '2026-08-07',
    sections: [
      {
        heading: 'Ateş kaç derece sayılır?',
        paragraphs: [
          'Bebeklerde 38°C ve üzeri ölçüm ateş kabul edilir. Ölçüm yöntemi sonucu etkiler; süt çocuklarında en güvenilir yöntem rektal ölçümdür.',
          'Koltuk altı ölçümler genellikle gerçek vücut sıcaklığından biraz düşük çıkar. Hangi yöntemi kullanırsanız kullanın, hekiminize söylerken yöntemi de belirtin.',
        ],
      },
      {
        heading: 'Yaşa göre ne beklenir?',
        paragraphs: [
          '3 aydan küçük bebeklerde ölçülmüş 38°C ve üzeri ateş, bebek iyi görünse bile gecikmeden değerlendirilmelidir. Bu yaş grubunda ateş tek başına acil bir bulgudur.',
          '3–12 ay arasında hafif ateş sık görülen viral enfeksiyonlara eşlik edebilir. Bu dönemde termometredeki sayıdan çok bebeğin genel hâli önemlidir: uyanıklığı, beslenmesi, ıslattığı bez sayısı.',
        ],
      },
      {
        heading: 'Ateş neyin göstergesi?',
        paragraphs: [
          'Ateş bir hastalık değil, bir belirtidir. Vücudun enfeksiyonla mücadelesinin parçasıdır ve tek başına beyin hasarı gibi sonuçlara yol açmaz.',
          'Bu yüzden takip edilmesi gereken şey yalnızca derece değil; solunumun rahat olması, sıvı alımı ve bebeğin uyaranlara verdiği tepkidir.',
        ],
      },
      {
        heading: 'Evde ne yapabilirsiniz?',
        paragraphs: [
          'Bebeği ince giydirin; odayı serin ve havadar tutun. Kat kat sarmak ateşi yükseltebilir.',
          'Sık sık ve az az sıvı verin. Bez sayısını ve bebeğin uyanıklığını takip edin.',
          'Soğuk duş, buzlu su ya da alkollü/sirkeli ovma uygulamayın. Bunlar titremeye yol açarak durumu kötüleştirebilir ve bebek için zararlıdır.',
          'İlaç ve doz kararı hekime aittir. Doktorunuza danışmadan ateş düşürücü başlamayın; özellikle küçük bebeklerde doz vücut ağırlığına göre belirlenir.',
        ],
      },
      {
        heading: 'Hemen 112 aranması gereken durumlar',
        paragraphs: [
          'Nefes almakta zorlanma, hızlı veya hırıltılı solunum.',
          'Dudak, dil ya da yüzde morarma.',
          'Havale (nöbet) geçirmesi.',
          'Uyandırılamaması, tepkisizlik veya aşırı halsizlik.',
          'Bunların dışında: 3 aydan küçük her bebekte 38°C ve üzeri ateş, 40°C ve üzeri her ölçüm, ya da ateşin 3 günden uzun sürmesi durumunda hekime başvurun.',
        ],
      },
      {
        heading: 'Güvenlik notu',
        paragraphs: [
          'Bu yazı genel bilgilendirme amaçlıdır, tanı veya tedavi yerine geçmez. Bebeğinizle ilgili kararlarda kendi hekiminizin önerisi esastır.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Diş çıkarma ateş yapar mı?',
        a: 'Diş çıkarma hafif bir ısı artışına ve huzursuzluğa yol açabilir; ancak 38°C ve üzerinde süren ateş diş çıkarmayla açıklanmamalıdır, başka bir neden aranmalıdır.',
      },
      {
        q: 'Hangi termometre daha doğru sonuç verir?',
        a: 'Süt çocuklarında en güvenilir yöntem rektal ölçümdür. Hangi cihazı kullanırsanız kullanın, üreticinin kullanım talimatına birebir uyun.',
      },
      {
        q: 'Ateş kaç gün sürebilir?',
        a: 'Viral enfeksiyonlara bağlı ateş çoğu zaman 2–3 günde geriler. Süre uzarsa ya da bebeğin genel hâli bozulursa hekime başvurun.',
      },
      {
        q: 'Bebeğim hiç sıvı almak istemiyor, ne yapmalıyım?',
        a: 'Az miktarda ama sık aralıklarla vermeyi deneyin. Reddetme sürerse veya ağız kuruluğu, ıslak bez sayısında belirgin azalma, gözlerde çökme gibi sıvı kaybı bulguları varsa vakit kaybetmeden hekime başvurun.',
      },
      {
        q: 'Ateşi düşürmek için ılık duş aldırabilir miyim?',
        a: 'Ilık suyla silmek bazı durumlarda rahatlatabilir, ancak soğuk su kesinlikle kullanılmamalıdır. Bebek titremeye başlarsa uygulamayı durdurun.',
      },
    ],
    resources: [
      { label: 'T.C. Sağlık Bakanlığı', url: 'https://www.saglik.gov.tr/' },
      { label: 'WHO: Çocuk Sağlığı', url: 'https://www.who.int/' },
      { label: 'AAP: Fever in Children', url: 'https://www.aap.org/' },
    ],
  },

  {
    slug: 'bebek-uyku-duzeni-0-6-ay',
    enSlug: 'sleep-0-6m-guide',
    title: 'Bebek Uyku Düzeni (0–6 Ay): Neler Normal?',
    excerpt:
      'Yenidoğanın uyku düzeni nasıl oturur, gece gündüz karışıklığı neden olur, güvenli uyku için nelere dikkat edilir.',
    category: 'Uyku',
    author: 'BabyQ Editör',
    updated: '2026-08-07',
    sections: [
      {
        heading: 'Bu yaşta normal olan ne?',
        paragraphs: [
          'Yenidoğanlar kısa aralıklarla uyur ve sık uyanır. Biyolojik saat (sirkadiyen ritim) doğumda hazır değildir, ilk aylarda kademeli olarak olgunlaşır.',
          'İlk haftalarda gece–gündüz karışıklığı çok yaygındır ve kendiliğinden düzelir. Bu bir "uyku problemi" değil, gelişimin normal bir aşamasıdır.',
          'Bu dönemde toplam günlük uyku süresi bebekten bebeğe belirgin şekilde değişir. Tek bir uykunun ne kadar sürdüğünden çok, bebeğin gün içindeki genel hâli ve beslenmesi anlamlıdır.',
        ],
      },
      {
        heading: 'Sakinleştirmeye yardımcı olanlar',
        paragraphs: [
          'Beyaz gürültü, yaşa uygun kundak ve her gün tekrarlanan basit bir rutin bebeğin uykuya geçişini kolaylaştırabilir.',
          'Açlık işaretlerine (el emme, huzursuzlanma, ağza yönelme) ağlama başlamadan yanıt vermek, bebeğin sakin kalmasını ve daha rahat uyumasını sağlar.',
          'Rutin karmaşık olmak zorunda değil: beslenme, bez değişimi, ışıkların kısılması, sakin bir ses tonu genellikle yeterlidir. Önemli olan sıralamanın her gece aynı olması.',
        ],
      },
      {
        heading: 'Güvenli uyku kuralları',
        paragraphs: [
          'Bebek her uykuda sırtüstü yatırılmalıdır. Yüzüstü ve yan yatış güvenli değildir.',
          'Yatak yüzeyi sert ve düz olmalı; yatağın içinde yastık, yorgan, oyuncak, tampon gibi yumuşak eşyalar bulunmamalıdır.',
          'Aşırı ısınmadan kaçının; oda sıcaklığını rahat bir seviyede tutun ve bebeği kat kat giydirmeyin.',
          'Bebeğin bulunduğu ortam kesinlikle dumansız olmalıdır.',
          'Pek çok sağlık otoritesi, güvenlik açısından bebeğin aynı odada ama kendi yatağında uyumasını önerir.',
        ],
      },
      {
        heading: 'Ne zaman hekime başvurmalı?',
        paragraphs: [
          'Solunum güçlüğü, uykuda nefes duraklamaları veya ciltte renk değişikliği mutlaka değerlendirilmelidir — bu bulgularda 112’yi arayın.',
          'Süregelen uyku sorunları bebeğin kilo alımını veya beslenmesini etkiliyorsa hekiminize danışın.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Gündüz uykuları ne kadar sürmeli?',
        a: 'Bu yaşta süreler bebekten bebeğe çok değişir. Tek bir uykunun uzunluğundan çok, günlük toplam uyku ile bebeğin keyfi ve beslenmesi yol göstericidir.',
      },
      {
        q: 'Bebeğimle aynı yatakta uyumam sakıncalı mı?',
        a: 'Birçok sağlık otoritesi aynı odayı paylaşmayı önerirken aynı yatağı paylaşmamayı tavsiye eder. Kendi hekiminizin ve ulusal rehberlerin önerisini esas alın.',
      },
      {
        q: 'Kundak kullanabilir miyim?',
        a: 'Yaşa uygun kundak kullanılabilir; ancak bebek dönmeye başladığı anda kundak bırakılmalıdır.',
      },
      {
        q: 'Bebeğim sadece kucakta uyuyor, alışkanlık yapar mı?',
        a: 'İlk aylarda kucakta uyumak son derece olağandır ve kalıcı bir alışkanlık oluşturduğuna dair endişe gerektirmez. Yine de bebeği uykuya daldıktan sonra sırtüstü, kendi güvenli yatağına yatırmak önemlidir.',
      },
    ],
    resources: [
      { label: 'T.C. Sağlık Bakanlığı', url: 'https://www.saglik.gov.tr/' },
      { label: 'AAP: Safe Sleep', url: 'https://www.aap.org/' },
      { label: 'NHS: Baby Sleep', url: 'https://www.nhs.uk/' },
    ],
  },

  {
    slug: 'ek-gidaya-gecis',
    enSlug: 'starting-solids-6m',
    title: 'Ek Gıdaya Geçiş: 6. Ayda Nasıl Başlanır?',
    excerpt:
      'Bebeğin ek gıdaya hazır olduğunu nasıl anlarsınız, hangi kıvamla başlanır, alerjen gıdalar nasıl verilir.',
    category: 'Beslenme',
    author: 'BabyQ Editör',
    updated: '2026-08-07',
    sections: [
      {
        heading: 'Hazır olma işaretleri',
        paragraphs: [
          'Başını dik tutabilmesi, destekle oturabilmesi, yemeğe ilgi göstermesi ve lokmayı ağzının arkasına taşıyabilmesi hazır olduğuna işaret eder.',
          'Bu işaretler genellikle 6. ay civarında birlikte görülür. Takvimdeki tarihten çok bebeğin bu becerileri kazanmış olması önemlidir.',
        ],
      },
      {
        heading: 'Kıvam ve ilerleme',
        paragraphs: [
          'Pürüzsüz püreyle başlayın; bebeğin becerisi geliştikçe ezmeye ve yumuşak parmak yiyeceklerine geçin.',
          'Geçiş aceleye getirilmemeli, ama gereğinden fazla da geciktirilmemelidir; farklı kıvamlarla tanışmak çiğneme becerisinin gelişimine katkı sağlar.',
        ],
      },
      {
        heading: 'Alerjen gıdalar',
        paragraphs: [
          'Sık alerji yapan gıdaları teker teker tanıştırın ve tepki olup olmadığını izleyin.',
          'Ailede besin alerjisi öyküsü varsa ya da tereddüt ediyorsanız, başlamadan önce hekiminize danışın.',
        ],
      },
      {
        heading: 'Pratik öneriler',
        paragraphs: [
          'Her seferinde tek yeni gıda deneyin; porsiyonlar küçük olsun ve bebeği asla zorlamayın.',
          'Öğünleri sakin tutun. Bebek dik oturmalı ve yemek boyunca gözetim altında olmalıdır.',
          'Bu dönemde anne sütü veya uygun formül hâlâ temel besin kaynağıdır; ek gıda onun yerini almaz, yanına eklenir.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Ek gıdayla birlikte su verilir mi?',
        a: 'Ek gıda başladığında öğün yanında küçük yudumlar hâlinde su verilebilir. Ancak temel beslenme kaynağı hâlâ anne sütü veya uygun formüldür.',
      },
      {
        q: 'Öğürme ile boğulma arasındaki fark nedir?',
        a: 'Öğürme bu dönemde sık görülür ve beceri gelişirken normaldir; bebek ses çıkarır. Boğulma ise sessizdir ve tehlikelidir — temel ilk yardımı öğrenmeniz önerilir.',
      },
      {
        q: 'Demir açısından zengin neler verebilirim?',
        a: 'Yaşa uygun şekilde demir katkılı tahıllar, mercimek ve et grubu gıdalar verilebilir.',
      },
      {
        q: 'Günde kaç öğün olmalı?',
        a: 'Günde bir öğünle başlayıp bebeğin ilgisi ve toleransı arttıkça kademeli olarak artırın.',
      },
      {
        q: 'Bebeğim ek gıdayı reddediyor, endişelenmeli miyim?',
        a: 'İlk denemelerde reddetme çok yaygındır; bir gıdanın kabul edilmesi birden fazla deneme gerektirebilir. Zorlamadan, birkaç gün arayla yeniden deneyin. Reddetme uzun sürer ve kilo alımını etkilerse hekiminize danışın.',
      },
    ],
    resources: [
      { label: 'T.C. Sağlık Bakanlığı', url: 'https://www.saglik.gov.tr/' },
      { label: 'WHO: Complementary Feeding', url: 'https://www.who.int/' },
      { label: 'NHS: Weaning', url: 'https://www.nhs.uk/' },
    ],
  },

  {
    slug: 'yenidogan-sariligi',
    enSlug: 'jaundice-in-newborns',
    title: 'Yenidoğan Sarılığı: Normal Olan Ne, Ne Zaman Tedavi Gerekir?',
    excerpt:
      'Yenidoğan sarılığı neden olur, hangi seyir normaldir, hangi durumda vakit kaybetmeden hekime başvurulmalıdır.',
    category: 'Yenidoğan Bakımı',
    author: 'BabyQ Editör',
    updated: '2026-08-07',
    sections: [
      {
        heading: 'Neden olur?',
        paragraphs: [
          'Sarılık, kanda bilirubin birikmesine bağlı olarak ciltte ve göz aklarında görülen sararmadır.',
          'Yenidoğanın karaciğeri henüz olgunlaşmakta olduğu için yaşamın ilk haftasında oldukça sık görülür.',
        ],
      },
      {
        heading: 'Genellikle normal kabul edilen seyir',
        paragraphs: [
          '2–3. günden sonra başlayan ve 1–2 hafta içinde gerileyen hafif sarılık yaygındır; anne sütüyle beslenen bebeklerde daha sık görülür.',
          'Hekimler rutin yenidoğan kontrollerinde bilirubin düzeyini ölçerek seyri takip eder. Bu kontrollerin aksatılmaması önemlidir.',
        ],
      },
      {
        heading: 'Vakit kaybetmeden başvurulması gereken durumlar',
        paragraphs: [
          'Sarılığın yaşamın ilk 24 saati içinde ortaya çıkması.',
          'Sararmanın kollara ve bacaklara yayılması.',
          'Bebeğin aşırı uykulu olması, uyandırılmakta zorlanması veya beslenmesinin belirgin şekilde azalması.',
          'Yüksek bilirubin düzeyi tedavi edilebilir bir durumdur; en sık kullanılan yöntem hekim gözetiminde uygulanan ışık tedavisidir (fototerapi).',
        ],
      },
      {
        heading: 'Güvenlik notu',
        paragraphs: [
          'Bu yazı genel bilgilendirme amaçlıdır, tanı yerine geçmez. Yenidoğan sarılığı mutlaka hekiminizin planladığı kontrollerle takip edilmelidir.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Anne sütü sarılık yapar mı?',
        a: 'Beslenmeyle ilgili güçlükler sarılığa katkıda bulunabilir, ancak anne sütünün yararları açıktır. Hekiminiz beslenmenin daha iyi gitmesi için size yol gösterebilir.',
      },
      {
        q: 'Sarılık nasıl ölçülür?',
        a: 'Ciltten ya da kandan yapılan bir ölçümle bilirubin düzeyi belirlenir; bu genellikle gözle muayeneyle birlikte değerlendirilir.',
      },
      {
        q: 'Sarılık kendiliğinden geçer mi?',
        a: 'Hafif olgular, beslenme ve dışkılama düzene girdikçe çoğu zaman kendiliğinden geriler.',
      },
      {
        q: 'Bebeği güneşe tutmak tedavi yerine geçer mi?',
        a: 'Hayır. Standart tedavi hekim gözetiminde uygulanan fototerapidir. Bebeği doğrudan güneşe maruz bırakmak cilt yanığı ve aşırı ısınma riski taşır; evde herhangi bir yöntem denemeden önce mutlaka hekiminize danışın.',
      },
    ],
    resources: [
      { label: 'T.C. Sağlık Bakanlığı', url: 'https://www.saglik.gov.tr/' },
      { label: 'AAP: Newborn Jaundice', url: 'https://www.aap.org/' },
      { label: 'WHO: Newborn Health', url: 'https://www.who.int/' },
    ],
  },

  {
    slug: 'bebekte-pisik-ve-egzama',
    enSlug: 'baby-eczema-diaper-rash',
    title: 'Bebekte Pişik ve Egzama: Nasıl Ayırt Edilir?',
    excerpt:
      'Bebek egzaması ile pişiği ayırt etmenin yolları, evde rahatlatma önerileri ve hekime başvurma zamanı.',
    category: 'Cilt ve Banyo',
    author: 'BabyQ Editör',
    updated: '2026-08-07',
    sections: [
      {
        heading: 'Bebek egzaması',
        paragraphs: [
          'Genellikle yanaklarda, saçlı deride ya da dirsek ve diz gibi eklem bölgelerinde kuru, kızarık ve kaşıntılı yamalar hâlinde görülür.',
          'Kuru hava ve tahriş edici maddeler alevlenmeyi tetikleyebilir.',
          'İlk ve en önemli rahatlatma yöntemi, banyodan hemen sonra uygulanan kokusuz nemlendiricinin düzenli kullanımıdır.',
        ],
      },
      {
        heading: 'Pişik',
        paragraphs: [
          'Genellikle ıslak veya kirli bezle uzun süreli temas sonucu oluşur; bez bölgesinde kızarıklık şeklinde görülür.',
          'Sık bez değişimi, bölgenin nazikçe temizlenmesi ve bariyer krem kullanımı hafif olguların çoğunda yeterli olur.',
        ],
      },
      {
        heading: 'Aradaki farkı anlamak',
        paragraphs: [
          'Egzama kuru ve kaşıntılıdır, vücudun birden fazla bölgesinde görülür. Pişik ise bez bölgesiyle sınırlıdır ve nemle temasla ilişkilidir.',
          'Sivilce benzeri kabarcıklar ya da bez sınırlarının dışına taşan uydu lekeler mantar (maya) bileşenine işaret ediyor olabilir; bu durumda hekime başvurun.',
        ],
      },
      {
        heading: 'Ne zaman hekime gitmeli?',
        paragraphs: [
          'Evde bakıma rağmen kötüleşen, yayılan ya da içi su dolu kabarcıklara dönüşen döküntüler değerlendirilmelidir.',
          'Döküntüye ateş eşlik ediyorsa gecikmeden hekime başvurun.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Egzamanın nedeni besin alerjisi mi?',
        a: 'Bazen ilişkili olabilir, ancak her zaman değil. Alerji testinin gerekli olup olmadığına hekiminiz karar verir.',
      },
      {
        q: 'Pişiği önlemek için bezi ne sıklıkla değiştirmeliyim?',
        a: 'Her 2–3 saatte bir kontrol etmek ve her dışkılamadan sonra değiştirmek, nemle uzun süreli teması azaltır.',
      },
      {
        q: 'Islak mendil tahriş olmuş ciltte kullanılabilir mi?',
        a: 'Alevlenme döneminde kokusuz ve alkolsüz mendiller — ya da sade su ve yumuşak bir bez — çok daha az tahriş edicidir.',
      },
      {
        q: 'Bebeğime kortizonlu krem sürebilir miyim?',
        a: 'Yalnızca hekim önerisiyle. Bebek cildinde kremin gücü ve kullanım süresi kritik önemdedir; kendi kararınızla başlamayın.',
      },
      {
        q: 'Pişik için pudra kullanmalı mıyım?',
        a: 'Pudra önerilmez; havada asılı kalan partiküller bebek tarafından solunabilir. Bunun yerine bölgeyi kuru tutmak ve bariyer krem kullanmak tercih edilir.',
      },
    ],
    resources: [
      { label: 'T.C. Sağlık Bakanlığı', url: 'https://www.saglik.gov.tr/' },
      { label: 'AAP: Skin Care for Babies', url: 'https://www.aap.org/' },
      { label: 'NHS: Nappy Rash', url: 'https://www.nhs.uk/' },
    ],
  },
];

/** Look up a Turkish article by its Turkish slug. */
export function getTrArticle(slug: string): TrArticle | undefined {
  return trArticles.find((a) => a.slug === slug);
}

/** Turkish slug for an English article, when a translation exists. */
export function trSlugForEn(enSlug: string): string | undefined {
  return trArticles.find((a) => a.enSlug === enSlug)?.slug;
}
