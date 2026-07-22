-- BabyQ FAQ seed expansion
-- Fills the biggest coverage gaps in 0002 (which only had fever/feeding/sleep/
-- respiratory): digestion (constipation, diarrhoea, reflux), colic, teething,
-- skin (nappy rash), safe sleep, allergen introduction, post-vaccine reactions.
-- Every entry carries a REAL authoritative source (NHS / AAP HealthyChildren),
-- replacing the placeholder 'Özet kaynak' used in the original seed — the FAQ
-- context is what grounds the AI answers, so richer + sourced content directly
-- raises answer quality and trust.
-- Run after 0002_seed_faqs.sql, in Supabase Dashboard -> SQL Editor.

insert into public.faqs (age_min, age_max, category, question, answer, source) values
(3, 12, 'digestion',
 'Bebeğim kabız, ne yapabilirim?',
 E'• Sırtüstü yatırıp bacaklarını bisiklet çevirir gibi hareket ettirin ve karnına saat yönünde nazik masaj yapın.\n• Ek gıdaya başladıysa lifli sebze ve meyve püreleri (armut, erik, kayısı) verin; öğün aralarında az miktarda su sunun.\n• Birkaç günde düzelmezse, dışkıda kan görürseniz veya bebek çok huzursuzsa sağlık kuruluşuna başvurun.',
 'NHS — https://www.nhs.uk/baby/health/constipation-in-children/'),

(12, 36, 'digestion',
 '1 yaş üstü çocukta kabızlık için ne yapmalı?',
 E'• Günlük lif (sebze, meyve, tam tahıl) ve yeterli su alımını artırın.\n• Düzenli ve baskısız tuvalet zamanı ile gün içi hareket bağırsakları çalıştırır.\n• Ağrılı veya kanlı dışkı, karın şişliği ya da 2 haftadan uzun süren kabızlıkta doktora danışın.',
 'NHS — https://www.nhs.uk/baby/health/constipation-in-children/'),

(6, 36, 'digestion',
 'Bebeğimde ishal ve kusma var, ne yapmalı?',
 E'• En önemlisi sıvı kaybını önlemek: anne sütü veya formüle devam edin, öğünleri küçük ve sık verin.\n• Su tek başına yeterli değildir; eczaneden oral rehidrasyon solüsyonu (ORS) tercih edin.\n• Susuz kalma belirtileri (çökük göz veya bıngıldak, 12 saat idrar yapmama, halsizlik), dışkı ya da kusmukta kan veya şiddetli karın ağrısında hemen başvurun.',
 'NHS — https://www.nhs.uk/symptoms/diarrhoea-and-vomiting/'),

(0, 6, 'digestion',
 'Bebeğim her beslenmeden sonra süt çıkarıyor, normal mi?',
 E'• Bebeklerin yaklaşık yarısında görülen normal reflü genelde zararsızdır; kilo alıyor ve rahatsa endişelenmeyin.\n• Beslenmeyi bebek çok acıkmadan verin, sık sık gaz çıkarın ve beslenme sonrası en az 20 dakika dik tutun.\n• Fışkırır tarzda kusma, yeşil veya kanlı kusmuk, kilo alamama ya da beslenirken sürekli huzursuzlukta doktora danışın.',
 'AAP HealthyChildren — https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Why-Babies-Spit-Up.aspx'),

(0, 4, 'colic',
 'Bebeğim akşamları sürekli ağlıyor, kolik mi?',
 E'• Kolik, sağlıklı bebeklerde sık görülür; birkaç haftalıkken başlar ve çoğunlukla 4, en geç 6 ayda kendiliğinden geçer.\n• Dik tutup göğse yaslama, hafif sallama, ortam değişikliği veya ılık banyo yatıştırabilir; beslenirken dik tutmak hava yutmayı azaltır.\n• Ateş, fışkırır kusma, sulu veya kanlı dışkı ya da ağlama düzeninin ani değişiminde doktora başvurun.',
 'NHS — https://www.nhs.uk/conditions/colic/'),

(4, 12, 'teething',
 'Diş çıkarırken ateş olur mu?',
 E'• Diş çıkarma huzursuzluk, salya artışı ve diş etinde hassasiyet yapabilir; vücut ısısını normal sınırda hafifçe artırabilir.\n• Temiz ve soğuk bir diş kaşıyıcı veya temiz parmakla diş eti masajı rahatlatır.\n• Diş çıkarma 38°C ve üzeri gerçek ateş yapmaz; böyle bir ateşte nedeni başka yerde aramak ve doktora danışmak gerekir.',
 'AAP HealthyChildren — https://www.healthychildren.org/English/ages-stages/baby/teething-tooth-care/Pages/Teething-Pain.aspx'),

(0, 24, 'skin',
 'Bebeğimde pişik var, nasıl geçer?',
 E'• Bezi sık değiştirin, bölgeyi suyla nazikçe temizleyip iyice kurulayın ve mümkün oldukça açık (bezsiz) bırakın.\n• İnce bir tabaka bariyer krem (çinko oksit) cildi korur; sabun, kokulu ıslak mendil ve pudradan kaçının.\n• Bir haftada geçmezse, kabarcık veya yaygın kızarıklık, ateş ya da belirgin rahatsızlık varsa doktora veya eczacıya danışın.',
 'NHS — https://www.nhs.uk/baby/caring-for-a-newborn/nappy-rash/'),

(0, 12, 'sleep',
 'Bebeğimi nasıl güvenle uyutmalıyım?',
 E'• Her uykuda sırtüstü yatırın ve sert, düz bir yüzey kullanın.\n• Yatakta yastık, yorgan, oyuncak veya yumuşak nesne bulundurmayın; ilk 6 ay aynı odada ama ayrı yatakta uyutun.\n• Sigara dumanından uzak tutun ve aşılarını zamanında yaptırın; bunlar ani bebek ölümü riskini azaltır.',
 'AAP HealthyChildren — https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/a-parents-guide-to-safe-sleep.aspx'),

(6, 12, 'feeding',
 'Alerji yapabilen gıdaları ne zaman ve nasıl vermeliyim?',
 E'• Ek gıdaya yaklaşık 6. ayda başlanır; yumurta, yer fıstığı, buğday ve balık gibi alerjenler de bu dönemde verilebilir.\n• Her alerjeni tek tek ve az miktarda deneyin ki olası bir tepkiyi fark edebilesiniz; geciktirmek alerji riskini artırabilir.\n• Yüzde veya dudakta şişme, yaygın döküntü ya da nefes darlığı ciddi alerji işaretidir; acil yardım alın. Ailede alerji veya egzama varsa önce doktora danışın.',
 'NHS — https://www.nhs.uk/start-for-life/baby/weaning/safe-weaning/food-allergies/'),

(0, 24, 'vaccine',
 'Aşıdan sonra ateş ve huzursuzluk normal mi?',
 E'• Aşı sonrası hafif ateş, huzursuzluk ve enjeksiyon yerinde kızarıklık veya şişlik 1–2 gün sürebilir ve genelde normaldir.\n• Bebeği ince giydirin, sık sık sıvı sunun ve dinlenmesini sağlayın.\n• 3 günden uzun süren yüksek ateş, alışılmadık sürekli ağlama, döküntü veya nefes güçlüğünde vakit kaybetmeden doktora başvurun.',
 'NHS — https://www.nhs.uk/conditions/vaccinations/6-in-1-vaccine-side-effects/');
