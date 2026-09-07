# Mova

![Mova — kendin için daha iyi bir yaşam alanı](src/assets/images/lifeos-hero-park.png)

Mova; görevlerini, hedeflerini, alışkanlıklarını, su ve uyku kayıtlarını tek bir kişisel yaşam alanında buluşturan bir React + Vite + Supabase uygulamasıdır.

## Uygulamada neler var?

- E-posta doğrulamalı kayıt, giriş, çıkış ve şifre yenileme
- Görevler, hedefler ve görev → hedef ilerleme bağlantısı
- Alışkanlık, su ve uyku takibi
- Ritim merkezi, odak sayacı, günlük check-in ve mini günlük
- Haftalık plan ve istatistikler
- Kişisel ayarlar, veri dışa aktarma ve hatırlatmalar
- Yetkili kullanıcılar için yönetim paneli
- Telefon, tablet ve masaüstüne uyumlu arayüz
- Telefona yüklenebilen temel PWA desteği

## Yerelde çalıştırma

1. Proje klasöründe bağımlılıkları kur:

   ```bash
   npm install
   ```

2. Kök klasörde `.env.local` adlı dosyayı oluştur:

   ```env
   VITE_SUPABASE_URL=https://PROJE_ID.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=SUPABASE_ANON_ANAHTARIN
   ```

3. Uygulamayı başlat:

   ```bash
   npm run dev
   ```

4. Yayın öncesi kontrol:

   ```bash
   npm run build
   npm run lint
   ```

## Supabase kurulumu

Supabase SQL Editor'da aşağıdaki dosyaları sırayla çalıştır:

1. `supabase/dashboard_step_1.sql`
2. `supabase/habits_step_2.sql`
3. `supabase/water_step_3.sql`
4. `supabase/sleep_step_4.sql`
5. `supabase/life_center_step_6.sql`
6. `supabase/experience_step_7.sql`
7. `supabase/release_step_8.sql`

İlk proje kurulumundan gelen `profiles`, `tasks` ve `goals` tabloları bu sıralamadan önce mevcut olmalıdır.

## Yönetim paneli

Yönetim ekranı için `supabase/functions/admin-user-manager/index.ts` fonksiyonunu Supabase'e dağıtın. Bu fonksiyon kullanıcı profilini düzenleme, şifre yenileme e-postası gönderme, yönetici yetkisi ve hesap erişimini yönetme işlerini güvenli şekilde sunucu tarafında yapar.

Bir kullanıcıyı ilk yönetici yapmak için `experience_step_7.sql` dosyasının sonundaki örnek `INSERT` komutunda kendi `auth.users` UUID değerini kullanın.

## Yayınlama kontrolü

- Supabase Authentication ayarlarında Site URL ve Redirect URL alanlarına yayın adresini ekleyin.
- Aynı yayın adresini şifre yenileme bağlantılarının döneceği adres olarak kullanın.
- Sunucu tarafındaki `SUPABASE_SERVICE_ROLE_KEY` değerini hiçbir zaman istemciye veya `.env` dosyasına koymayın.
- Her yayın öncesinde `npm run build` ve `npm run lint` komutlarını çalıştırın.
