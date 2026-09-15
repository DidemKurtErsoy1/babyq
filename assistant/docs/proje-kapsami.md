# Kişisel Asistan — Proje Kapsamı ve Durum

> Bu doküman, projenin şu ana kadarki tasarım tartışmasının özetidir. Amacı:
> kapsamı başka bir yerde netleştirirken bağlamı sıfırdan anlatmak zorunda
> kalmamak. Karara bağlananlar ve **hâlâ açık olanlar** ayrı ayrı işaretli.
>
> Son güncelleme: 15 Eylül 2026

---

## 1. Problem

Sabah güne başlamadan önce dört ayrı uygulama açılıyor: takvim, yapılacaklar,
notlar, mesajlar. Henüz gün başlamamışken "takip etmeyi takip etmek" başlı
başına bir mesaiye dönüşüyor.

Eksik olan bilgi ya da araç değil. Eksik olan: **bilginin tek bir noktada,
doğru anda buluşması.**

Bu ihtiyaç kişisel değil, yaygın:

- **Esnaf** — her sabah kritik stok uyarısı
- **Freelancer** — müşteri takibi ve fatura hatırlatmaları
- **Danışman** — danışanlarına seans hatırlatmaları

## 2. Ürün, tek cümlede

Kullanıcının kendi diliyle yazdığı/söylediği şeyleri anlayıp kaydeden ve her
sabah tek bir "Günaydın ve Özet" mesajıyla günü önüne getiren kişisel ajan.

Ürün ilkesi: **panel açmak yok, uygulama gezmek yok.** Bilgi filtrelenmiş
şekilde kullanıcının ayağına gider.

## 3. Referans nokta: Muse

Muse (ABD), benzer bir kişisel ajan: connector'larla bağlanıyor (mail, takvim,
finans, sağlık), uygulama kapalıyken de çalışıyor, dikkat gerektiren bir şey
olunca bildirim atıyor, her aksiyon öncesi onay istiyor, tam aktivite logu
tutuyor.

Birebir klonlamak solo mümkün değil. Ama iki açık kapısı var:

1. **Coğrafya** — sadece ABD. TR/EU tarafında ne mail-takvim ne de yerel
   entegrasyonlar (Türk bankaları, e-Devlet, MHRS, kargo, fatura) kapsanıyor.
2. **Dikey odak** — Muse yatay/genel bir asistan. Tek bir nişe derinleşmiş bir
   ajan, genel asistanın veremeyeceği bağlamı verir.

Muse'tan alınan ve korunması gereken iki ilke: **her aksiyon öncesi onay** ve
**tam aktivite logu.**

---

## 4. Karara bağlanan tasarım ilkeleri

### 4.1. AI cevap üretmiyor — anlıyor ve yapılandırıyor

Bu, projenin en kritik kararı ve BabyQ'dan en büyük farkı.

BabyQ'da akış: kullanıcı sorar → AI cevabı **üretir** → ekrana basılır. AI'ın
çıktısı = ürünün çıktısı.

Kişisel asistanda:

```
kullanıcı: "salı 15:00 psikolog, her hafta"
      ↓  ← AI burada devrede (doğal dil → yapı)
{ başlık: "Psikolog seansı", tarih: 2026-09-15T15:00+03:00,
  tekrar: "weekly", tür: "appointment", önem: 1 }
      ↓  ← AI burada DEVREDE DEĞİL
kayıt → zamanlayıcı → bildirim
```

AI'ın işi sadece **girişte**: doğal dili yapısal kayda çevirmek. Sonrasına hiç
dokunmuyor.

**Neden sabah mesajını AI yazmıyor:** Bir gün seansın saatini "15:00" yerine
"öğleden sonra" diye yazarsa, ya da bir maddeyi "önemsiz" bulup atlarsa,
kullanıcı o mesaja bir daha güvenmez ve dört uygulamaya geri döner. Brief'i
deterministik kod üretir: aynı girdi → hep aynı mesaj. Bir model ileride
**sadece üslubu** yeniden yazabilir, listenin içeriğine asla karar veremez.

### 4.2. Araya onay giriyor

AI yanlış anlayabilir. "Salı" hangi salı? "3 hafta sonra" tam olarak ne zaman?

```
kullanıcı yazar → AI ayrıştırır
   → "Şunu anladım: Psikolog seansı, 15 Eylül Salı 15:00, her hafta. Doğru mu?"
   → kullanıcı onaylar → kayıt
```

Muse'un "her aksiyon öncesi onay" ilkesi buraya doğal olarak oturuyor ve ek
maliyeti yok.

### 4.3. Ses ayrı bir özellik değil

Ses → transkript → **aynı** ayrıştırma hattı. Sonradan eklenir, mimariyi
değiştirmez. MVP'de olması şart değil.

### 4.4. Çıkışta iki ayrı mekanizma var

| | Ne zaman | Nasıl tetiklenir |
|---|---|---|
| **Günaydın ve Özet** | Her sabah (varsayılan 07:00, kullanıcı ayarlar) | Cron, günde 1, tüm kullanıcılar |
| **Nokta hatırlatma** | "Seansına 1 saat kaldı" | O kayda özel, tek seferlik |

İkisi farklı şekilde kurulur, karıştırılmamalı.

### 4.5. n8n prototip için doğru, ürün için değil

İlk kurgu n8n otomasyonuyla düşünülmüştü. Prototip için doğru araç. Ama üründe
kullanıcı başına OAuth token yönetimi, satır bazlı yetkilendirme (RLS), onay
kuyruğu ve denetim logu n8n'de kurulamaz. Aynı akış kod tarafında kuruluyor:
**Vercel Cron + Supabase**, n8n'in yaptığı işi üstleniyor.

---

## 5. WhatsApp'ın 24 saat kuralı — ürünü şekillendiren kısıt

Seçilen bildirim kanalı WhatsApp. Bilinmesi gereken kısıt:

WhatsApp Business API'de kullanıcıya **serbest metin** gönderebilmek için, o
kullanıcının sana **son 24 saat içinde mesaj atmış olması** gerekiyor. Pencere
kapalıysa sadece **Meta'nın önceden onayladığı şablon** gönderilebilir — sabit
metin, içine birkaç değişken, mesaj başına ücret.

Sabah 07:00'de yazan sensin, kullanıcı değil. Yani **günaydın mesajı her zaman
şablondur.** Uzun, çok satırlı, maddeli bir brief'i şablona sığdırmak zor.

Üç seçenek:

| | Nasıl | Artı | Eksi |
|---|---|---|---|
| **A** | Kısa şablon + link ("3 işin var, 1'i dikkat istiyor → link") | Politikaya %100 uygun, ucuz | "Panel açmak yok" ilkesini kısmen deler |
| **B** | Kullanıcı önce yazsın, pencere açılsın, tam brief serbest metin gitsin | Bedava, sınırsız, tam metin | Her sabah kullanıcıdan hareket beklemek — alışkanlık riski |
| **C** | İkisi birden: şablonla dürt, kullanıcı yazınca pencere açılır ve gerisi serbest sohbet | Hem uyumlu hem akıcı | Biraz daha iş |

**Öneri: C.** Kullanıcının girdi kanalı da WhatsApp olacaksa pencere zaten doğal
olarak açılıyor — kayıt ekleme, "bugün ne var", "seansı ertele" hepsi o
pencerede çalışır.

⚠️ **Zamanlama riski:** WhatsApp Business API onayı Meta tarafında
günler–haftalar sürebilir. Proje bu onaya bağımlı kurulmuyor: mesaj gönderimi
bir **kanal arayüzü** arkasına alınıyor, WhatsApp o arayüzün bir adaptörü
oluyor. Onay gelene kadar aynı akış konsol/DB adaptörüyle uçtan uca test
edilebilir; onay gelince tek env değişkeniyle WhatsApp'a döner.

---

## 6. MVP önerisi

> ⚠️ Bu bölüm **öneri**, henüz onaylanmadı. Netleştirilecek asıl kısım burası.

**Öneri: MVP'de hiç connector olmasın.**

Gerekçe: Döngünün kendisi —

```
kullanıcı yazar → AI anlar → onaylar → kaydolur → sabah özet gelir
```

— tek başına çalışıyorsa ürün var demektir. Google Calendar ve Notion sonra
takılır. Çünkü asıl sınav olan *"kullanıcı bu alışkanlığı sürdürüyor mu"*
sorusunu connector'lar değil, bu döngü belirliyor. Connector'lar döngü
tutmadan eklenirse, sadece çalışmayan bir şeyi büyütmüş oluruz.

### MVP kapsamı (öneri)

- [ ] Giriş: kullanıcı doğal dille yazar
- [ ] AI ayrıştırma: metin → yapısal kayıt (başlık, tarih, tekrar, tür, önem)
- [ ] Onay adımı: "şunu anladım, doğru mu?"
- [ ] Kayıt saklama (Supabase)
- [ ] Günlük brief üretimi (deterministik) ✅ *yazıldı*
- [ ] Zamanlama: her sabah cron
- [ ] Gönderim: kanal arayüzü + konsol adaptörü
- [ ] WhatsApp adaptörü (onay geldiğinde devreye girer)
- [ ] Aktivite logu (ne yapıldı, ne gönderildi)

### MVP dışı (bilinçli olarak)

- Google Calendar / Notion connector'ları
- Ses girişi
- Nokta hatırlatmalar (sadece günlük brief yeter)
- Başkasına mesaj gönderme (danışman → danışan senaryosu)
- Çoklu persona / sektör şablonları (esnaf, freelancer, danışman)

---

## 7. Sonraki adımlar (faz faz)

**Faz 0 — Çekirdek** ✅ *tamamlandı*
Zaman/yerel gün hesabı, tekrar kuralları, brief kurgusu, veritabanı şeması.

**Faz 1 — Döngü**
Auth, kayıt ekleme, AI ayrıştırma + onay, cron, konsol adaptörü.
*Çıktı: kendi kendine her sabah doğru özeti üretebilen bir sistem.*

**Faz 2 — Kanal**
WhatsApp gönderimi + gelen mesaj webhook'u + 24 saat penceresi yönetimi.
*Çıktı: gerçekten telefona düşen mesaj.*

**Faz 3 — Connector'lar**
Google Calendar (OAuth), ardından Notion.
*Çıktı: kullanıcının elle girmediği şeyler de brief'e girer.*

**Faz 4 — Genişleme**
Nokta hatırlatmalar, ses girişi, sektör şablonları, başkasına gönderim.

---

## 8. Açık kararlar

| # | Soru | Neden önemli | Durum |
|---|---|---|---|
| 1 | Kullanıcı asistana **nereden yazacak**? Sadece WhatsApp / sadece uygulama / ikisi | 24 saat penceresini ve gelen mesaj webhook'unu doğrudan belirliyor | **Açık** |
| 2 | Türkçe tarih ayrıştırmasını **hangi model** yapacak? | "Önümüzdeki salı", "ayın 15'i", "haftaya bu saatte" — ürünün en kırılgan yeri | **Açık** |
| 3 | MVP'de connector olacak mı? | Kapsamı ikiye katlıyor | **Açık** (öneri: hayır) |
| 4 | Hedef kullanıcı: önce kişisel mi, yoksa bir dikey mi (esnaf/freelancer/danışman)? | Konumlandırmayı ve ilk kullanıcıları belirler | **Açık** |
| 5 | Ürün adı | — | **Açık** |

Karara bağlananlar: bildirim kanalı **WhatsApp**; barındırma **Next.js +
Supabase + Vercel**; brief **deterministik**, AI sadece girişte; connector
hedefleri **Google Calendar + Notion**.

---

## 9. Teknik durum

**Nerede:** `assistant/` klasörü, `didemkurtersoy1/babyq` reposu,
`claude/kind-shannon-y7mbk0` branch'i. Mevcut BabyQ uygulamasına
dokunulmuyor — ayrı `package.json`, ayrı deploy.

**Stack:** Next.js 15 (App Router) · Supabase (auth + RLS) · Tailwind 4 ·
Vercel · vitest

### Yazılanlar

| Dosya | Ne yapıyor |
|---|---|
| `lib/time.ts` | Yerel gün sınırları (Intl ile). Brief, UTC gününü değil kullanıcının gününü baz alır. Yaz saati geçişinde gün 23 veya 25 saattir; testler ikisini de sabitliyor |
| `lib/recurrence.ts` | İnsanların gerçekten girdiği tekrar kuralları: haftalık seans, aylık kira, yıllık doğum günü. RRULE'dan bilinçli olarak küçük — tanımadığı kuralı tahmin etmek yerine reddediyor |
| `lib/brief.ts` | "Günaydın ve Özet" mesajını kuruyor. Model çağrısı yok. Sıralama, çakışma tespiti, önem ayrımı, TR/EN |
| `supabase/migrations/0001_init.sql` | Şema: profiles, connections, items, briefs, approvals, activity_log |

**Durum:** 40 test geçiyor, typecheck temiz.

### Şemadaki iki güvenlik kararı

- **`connections`** (OAuth token'ları): RLS açık, **hiç policy yok**. Hiçbir
  kural eşleşmediği için anon/authenticated anahtarlar bu tabloyu asla
  okuyamaz. Sadece sunucu tarafındaki service role erişir.
- **`activity_log`**: kullanıcı kendi geçmişini okuyabilir ama yazamaz,
  değiştiremez, silemez. *Öznesinin düzenleyebildiği denetim kaydı, denetim
  kaydı değildir.*

### Yol boyunca çıkan not

Kökteki `.gitignore`, kurallarını baştaki `/` ile yazmış (`/node_modules`) —
yani sadece kök dizini kapsıyor. Alt klasörde uygulama açınca 12.476 dosya
commit'e gidiyordu. `assistant/` için ayrı ignore eklendi; repoda ileride başka
alt klasör açılırsa aynı tuzak geçerli.
