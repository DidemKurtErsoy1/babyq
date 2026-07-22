-- BabyQ FAQ seed — toddler behaviour & development
-- The questions-table retrospective (2026-07) showed real, typed demand beyond
-- medical symptoms: tantrums, defiance ("says no to everything"), "naughtiness"
-- and not sharing — all from toddlers, all previously ungrounded. These entries
-- extend BabyQ's scope to behaviour/development while keeping the same safety
-- framing (a calm reassurance + practical steps + a "when to seek help" line).
-- Real authoritative sources (NHS / AAP). Run after 0005, in Supabase SQL Editor.

insert into public.faqs (age_min, age_max, category, question, answer, source) values
(12, 48, 'behavior',
 'Çocuğum öfke nöbetleri geçiriyor, her şeye ağlıyor, ne yapmalıyım?',
 E'• Öfke nöbetleri genellikle 18 ay civarında başlar ve çok yaygındır; çocuk kendini ifade etmekte zorlandığı için hayal kırıklığı bu şekilde dışa vurur.\n• Nöbet sırasında sakin kalın, bağırmayın ve "hayır" dediyseniz sözünüzden dönmeyin; dikkatini başka yöne çekmeyi, sonrasında sarılıp duygusunu adlandırmayı deneyin.\n• Yorgunluk ve açlık nöbetleri tetikler; düzenli uyku ve yemek düzeni yardımcı olur. Nöbetler çok şiddetliyse, çocuk kendine zarar veriyorsa veya endişeliyseniz sağlık danışmanına ya da doktora danışın.',
 'NHS — https://www.nhs.uk/baby/babys-development/behaviour/temper-tantrums/'),

(12, 48, 'behavior',
 'Çocuğum söz dinlemiyor, çok yaramazlık yapıyor, nasıl sınır koyarım?',
 E'• Net, tutarlı ve sakin sınırlar en iyi sonucu verir; kuralları çocuğun anlayacağı basit bir dille açıklayın. 3 yaşına kadar çocuklar genelde "ceza" kavramını anlamaz, sınır koymak cezadan daha etkilidir.\n• İstenmeyen davranışı başka bir şeye yönlendirin; en güçlü araç, iyi davranışı fark edip övmektir.\n• Bağırmak, utandırmak veya fiziksel ceza etkisizdir ve zararlıdır. Davranış aşırı saldırgansa ya da baş edemediğinizi hissediyorsanız sağlık danışmanına veya doktora danışın.',
 'AAP HealthyChildren — https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/Disciplining-Your-Child.aspx'),

(12, 48, 'development',
 'Çocuğum oyuncaklarını paylaşmıyor, normal mi?',
 E'• Küçük çocukların paylaşmakta zorlanması normaldir; paylaşma ve sıra alma becerisi genellikle 3 yaş civarında gelişmeye başlar.\n• Sıra almayı oyunla öğretin, kendiniz model olun ve paylaştığında övün; zorlamak yerine sabırla teşvik edin.\n• 3 yaştan sonra çocuk yavaşça daha az bencilleşir ve iş birliği artar. Sosyal gelişimde belirgin bir gerileme veya iletişim/etkileşim eksikliği fark ederseniz doktora danışın.',
 'AAP HealthyChildren — https://www.healthychildren.org/English/ages-stages/preschool/Pages/Social-Development-in-Preschoolers.aspx');
