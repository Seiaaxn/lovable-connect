# ShinKanimeID

Platform streaming anime, donghua, dan komik Indonesia.

## Fitur Utama

- 🎬 Streaming Anime & Donghua
- 📚 Baca Komik
- 💬 Diskusi Grup Real-time
- 🤖 Chat AI Arima Kana
- 👥 Sistem Pertemanan & Chat Pribadi
- 🏆 Leaderboard, Level & Achievement
- ⭐ Premium & Share Premium
- 🔔 Push Notification (OneSignal)
- 🌙 Dark/Light Theme

## Setup Push Notification (OneSignal)

### 1. Buat Akun OneSignal
1. Daftar di [onesignal.com](https://onesignal.com)
2. Buat App baru → pilih platform **Web**
3. Masukkan domain/URL website kamu

### 2. Dapatkan App ID
1. Buka **Settings > Keys & IDs**
2. Salin **OneSignal App ID**

### 3. Konfigurasi di Project
File: `src/lib/onesignal.ts`
```ts
const ONESIGNAL_APP_ID = 'YOUR_APP_ID_HERE';
```

### 4. Service Worker (Opsional)
Untuk push notification yang lebih reliable, tambahkan file berikut di folder `public/`:

**public/OneSignalSDKWorker.js**
```js
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
```

### 5. Pengaturan Notifikasi
- Notifikasi akan muncul untuk: pesan baru, gift premium, friend request, dll
- User bisa mengizinkan/menolak notifikasi dari browser

## Setup Firebase

### 1. Buat Project Firebase
1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Buat project baru

### 2. Aktifkan Layanan
- **Authentication** → aktifkan Google Sign-In
- **Realtime Database** → buat database
- **Storage** → aktifkan untuk upload gambar

### 3. Konfigurasi
Edit `src/integrations/firebase/config.ts` dengan config dari Firebase Console.

### 4. Rules Database
```json
{
  "rules": {
    "profiles": { ".read": true, ".write": "auth != null" },
    "friendships": { ".read": true, ".write": "auth != null" },
    "discussions": { ".read": true, ".write": "auth != null" },
    "chats": { ".read": "auth != null", ".write": "auth != null" },
    "notifications": { ".read": "auth != null", ".write": "auth != null" }
  }
}
```

### 5. Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /discussions/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
    match /chats/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- Firebase (Auth, Realtime DB, Storage)
- OneSignal (Push Notifications)
- Framer Motion (Animations)

## Development

```bash
npm install
npm run dev
```

## API

Menggunakan API dari:
- **Anime**: samehadaku (via proxy)
- **Donghua**: donghuaindo (via proxy)
- **Komik**: komikindo (via proxy)
