# Backlog

Küçük, tek oturumda bitebilecek işler. Her madde kendi başına anlamlı bir commit
çıkarır — boş commit atmaya gerek kalmasın diye böyle bölündü.

Sıra bağlayıcı değil, ama her bölümün başındakiler en çok değer üretenler.

---

## ~15 dakika

### 1. Bekleyen gönderiyi iptal etme
Veritabanında politika **var** (`"Senders can cancel a pending share"`, Milestone 14)
ama arayüzde karşılığı yok. Yanlış kişiye program gönderirsen geri alamıyorsun.

- `src/lib/workout-share.ts` → `cancelShare(shareId)` ekle (`.delete().eq("id",…).eq("status","pending")`)
- Gönderdiklerini listeleyecek bir yer lazım — en basiti Sosyal sekmesinde
  "Gönderdiklerin" bölümü (`list_incoming_shares`'in aynadaki hâli için yeni bir RPC gerekir)

### 2. `describeSets` için testler — ✅ YAPILDI
`describeSets` ve `rangeLabel` için 13 test yazıldı (madde 7 ile birlikte).

### 3. README'yi gerçek hâle getir — ✅ YAPILDI
Expo şablonu ne yaptığını anlatan bir README ile değiştirildi: özellikler, yığın,
kurulum (Expo Go'nun neden çalışmadığı dahil), dizin yapısı ve koda dokunmadan
önce bilinmesi gereken iki kural.

Kalan: **ekran görüntüsü yok.** Birkaç tane eklemek README'yi belirgin şekilde
güçlendirir — simülatörden 3-4 kare yeter.

### 4. Sınırsız sorguları gözden geçir
PostgREST, `limit`/`range` verilmeyen bir sorguyu **1000 satırda** sessizce kesiyor.
Egzersiz kataloğu bu yüzden 1380 satırın sadece 1000'ini getiriyordu (düzeltildi,
`listExercises` artık sayfalıyor). Şu an kırık başka bir yer yok ama zamanla
büyüyecek olanlar var — kullanıcı 1000'i geçtiğinde sessizce eksik veri gösterirler:

- `getActivityHeatmap` — tüm tamamlanmış antrenmanlar (≈5 yıl sonra)
- `getExerciseHistory` — tek hareketin tüm setleri
- `weight.ts` geçmiş sorguları — günde bir kayıtla ≈3 yıl

### 5. Bildirim izni reddedilince ne oluyor
`src/lib/notifications.ts` izin reddedilirse sessizce başarısız oluyor.
Hatırlatıcı ekranında kullanıcıya "sistem ayarlarından aç" bağlantısı göster.

---

## ~30–45 dakika

### 6. Dinlenme geri sayımı
Şu an dinlenme süresi sadece **yazıyor** (`120sn`), sayaç değil. Bir seti
tamamlayınca otomatik başlayan geri sayım, bitince titreşim.

- `src/app/(tabs)/antrenman/session/[sessionId].tsx` → `handleToggleComplete`
  içinde başlat
- Süre `planByExercise.get(exerciseId).restSeconds`'ta hazır duruyor
- Ekranın üstündeki mevcut süre kartının yanına ya da altına koy

### 7. Test koşucusu kur — ✅ YAPILDI
`jest-expo` kuruldu, `npm test` çalışıyor. 3 saf modülde **39 test**:
`workout-calculations` (hacim + PR kuralı), `nutrition-targets` (Mifflin-St Jeor),
`workout-plan` (`describeSets`). `jest.setup.js` AsyncStorage'ı mock'luyor —
`lib/supabase`'i dolaylı import eden her test onsuz import anında patlıyor.

Sıradaki adaylar (hepsi saf, kolay):
- `workout-schema.ts` / `profile-schema.ts` — zod doğrulama kuralları
- `nutrition.ts` → `totalsFor`, `mondayOfWeek`
- `workouts.ts` → `buildActivityHeatmap` (seri/hafta hesabı, kurnaz)
- Bileşen testleri için `@testing-library/react-native` eklenmeli

### 8. Hesap silme
App Store'a çıkacaksan **zorunlu** — hesap açtıran uygulamalarda Apple şart koşuyor.

- Profil ekranına "Hesabımı sil" satırı, çift onaylı
- Supabase'de kullanıcıyı silmek `service_role` ister → bir Edge Function gerekir
  (istemciden `auth.admin.deleteUser` çağrılamaz)
- Tüm tablolarda `on delete cascade` zaten var, veri kendiliğinden temizlenir

### 9. Hata takibi
Şu an bir şey patlarsa haberin olmuyor. `sentry-expo` ya da benzeri.
Kullanıcı sayısı azken kurmak, sonra kurmaktan çok daha kolay.

### 10. Kullanılmayan i18n anahtarlarını temizle
Bu arc boyunca çok anahtar eklendi/çıkarıldı. `en` ve `tr` dosyalarında
kod tarafından hiç çağrılmayanları ve iki dilde eşleşmeyenleri bulan
küçük bir script yaz, sonucu temizle.

---

## Yarım gün+

### 11. Egzersiz görselleri
1.380 hareketin hiçbirinde görsel yok. Yeni başlayan biri "Archer Push Up"
yazısından hareketi çıkaramaz — PT'nin yazdığı programın değerini doğrudan kesiyor.

`exercises` tablosunda `image_path` / `gif_path` kolonları **duruyor ama hiç
kullanılmıyor**. Sıra:
1. Lisansı temiz bir kaynak bul (bu, işin en uzun kısmı — teknik değil hukuki)
2. Supabase Storage'a yükle
3. `ExerciseImagePlaceholder`'ı gerçek görselle değiştir, görsel yoksa
   placeholder'a düş

### 12. Hareket bazlı ilerleme grafiği
Veri zaten var (`workout_sets` + `getExerciseHistory`), `LineChart` bileşeni de
hazır. Hareket detay ekranına "zamanla ağırlık" grafiği.

### 13. Sosyal yığının uçtan uca testi
Milestone 10–15 (kullanıcı adı, arama, engelleme, takip, program gönderme)
**hiç çalıştırılmadı**. İki hesapla: ara → takip → program yaz → gönder →
kabul et → reçetesiyle geldi mi.

⚠️ Engelleme testini sona bırak: birini engellemek aradaki takip bağlantılarını
iki yönde de siliyor (bilerek).

---

## Yapılmayacaklar (bilerek)

Karar verilip elenen şeyler — tekrar tartışmaya girmemek için burada duruyor:

- **Reps/Time geçişi** (süre bazlı hareketler) — plan ekranını da, antrenman
  sırasındaki kayıt ekranını da değiştirmeyi gerektiriyor
- **Alternatif hareket önerileri** — ayrı ilişki tablosu + ayrı seçim ekranı
- **Push bildirimleri** — gerçek sunucu altyapısı gerektiriyor (Expo push token +
  edge function). Sosyal özellikler bunsuz yarım kalıyor, ama ayrı bir iş kalemi.
- **Egzersiz GIF'leri (Gym Visual)** — lisansı görünür atıf + 180×180 sınırı
  istiyor, kendi içeriğimiz olana kadar değmez
