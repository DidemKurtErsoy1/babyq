-- BabyQ FAQ seed — toddler demand gaps
-- Driven by a retrospective of the `questions` + `feedback` tables (2026-07):
-- real (typed, non-example) questions skew toward TODDLER sleep and appetite,
-- and both 👎 feedback rows sat on toddler feeding — which the 0-24mo baby-
-- symptom FAQs did not cover. These two entries close that gap.
-- Real authoritative sources (NHS). Run after 0004, in Supabase SQL Editor.

insert into public.faqs (age_min, age_max, category, question, answer, source) values
(12, 48, 'feeding',
 'Çocuğum çok az yiyor veya seçici yiyor, ne yapmalıyım?',
 E'• 2 yaş civarı çocukların yaklaşık üçte biri seçici yiyebilir ve çoğu zamanla bunu aşar; çocuk aktifse ve kilo alıyorsa genelde yeterli besleniyordur.\n• Günlük değil haftalık dengeye bakın; 4 ana besin grubundan (sebze-meyve, tahıl, süt ürünü, protein) bir şeyler yiyorsa endişelenmeyin. Zorla yedirmeyin ve telaşınızı çocuğa yansıtmayın.\n• Sevmediği besinleri küçük porsiyonlarla tekrar tekrar sunun; tatlar zamanla değişir. Uzun süre düzelmezse, kilo kaybı veya büyümede belirgin yavaşlama varsa doktora ya da sağlık danışmanına başvurun.',
 'NHS — https://www.nhs.uk/baby/weaning-and-feeding/fussy-eaters/'),

(12, 48, 'sleep',
 'Çocuğum gece sık uyanıyor, uyku düzenini nasıl kurarım?',
 E'• Aynı saatte ve aynı adımlarla (banyo, kitap, loş ışık) sakin bir yatma rutini kurun; yatmadan 30–60 dakika önce ekranları kaldırın.\n• Gece uyandığında olabildiğince sessiz ve sıkıcı olun, ışıkları açmayın; yataktan kalkarsa telaşsızca tekrar yatağına götürün ve birkaç gece tutarlı olun.\n• Gündüz uzun uykulardan kaçının. Horlama veya uykuda nefes durması, gündüz aşırı uyku hali ya da ani davranış değişikliği varsa doktora danışın.',
 'NHS — https://www.nhs.uk/baby/health/sleep-and-young-children/');
