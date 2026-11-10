# LogiScan - Outbound Staging & Bagseal Barcode Scanner

Aplikasi web pemindai barcode logistik untuk manajemen Outbound Staging dan Trips (Trip 1–4) dengan deteksi kuantitas otomatis, penandaan kategori opsional (Document, HV, VIP, BP, Reguler), penyimpanan draf lokal anti-hilang lintas hari, dan sinkronisasi ke Google Sheets.

---

## Cara Menjalankan di Komputer / Laptop (Lokal)

Jika Anda meng-clone atau mengunduh repository ini dari GitHub:

### 1. Prasyarat
- Pastikan sudah menginstal **Node.js** (versi 18 atau 20+ disarankan). Cek dengan:
  ```bash
  node -v
  npm -v
  ```

### 2. Instalasi Dependencies
Jalankan perintah ini di folder project:
```bash
npm install
```

### 3. Jalankan Server Development
```bash
npm run dev
```
Setelah itu, buka browser dan akses:
```
http://localhost:3000
```

### 4. Build untuk Production
```bash
npm run build
```
File hasil build akan berada di folder `dist/` dan siap di-hosting di server mana pun.

---

## Cara Deploy ke GitHub Pages (Otomatis)

Project ini sudah dilengkapi dengan konfigurasi otomatis GitHub Actions (`.github/workflows/deploy.yml`):

1. Masuk ke repository GitHub Anda.
2. Buka tab **Settings** $\rightarrow$ **Pages** (di menu sebelah kiri).
3. Pada bagian **Build and deployment** $\rightarrow$ **Source**, pilih **GitHub Actions**.
4. Lakukan `git push` ke branch `main` atau `master`.
5. GitHub Actions akan otomatis meng-compile (`npm run build`) dan mempublikasikan website Anda ke:
   `https://<username>.github.io/<nama-repo>/`

---

## Cara Deploy ke Vercel / Netlify (Sangat Cepat & Gratis)

### Vercel:
1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik **Add New Project** $\rightarrow$ pilih repository GitHub ini.
3. Konfigurasi default:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Klik **Deploy**. Aplikasi langsung online dengan HTTPS aktif (kamera langsung berfungsi)!

---

## File Penting yang Wajib Terikut ke GitHub
Pastikan file berikut ikut ter-upload ke repository:
- `package.json`
- `firebase-applet-config.json` (konfigurasi Google OAuth & Sheets)
- `index.html`
- `vite.config.ts`
- Folder `src/` lengkap

---

## Troubleshooting Jika "Tidak Jalan" di GitHub

1. **Layar Putih (Blank Screen) di GitHub Pages**:
   - Penyebab: Anda belum menjalankan build (`vite build`), melainkan langsung meng-host source code mentah (`main.tsx`). Browser tidak bisa membaca TypeScript/JSX tanpa di-build.
   - Solusi: Gunakan workflow GitHub Actions yang sudah disediakan di `.github/workflows/deploy.yml` (pilih *Source: GitHub Actions* di pengaturan repo).

2. **Error `vite: not found` saat dijalankan lokal**:
   - Penyebab: Belum menjalankan `npm install`.
   - Solusi: Jalankan `npm install` terlebih dahulu.

3. **Kamera Tidak Menyala di Hosting**:
   - Penyebab: Browser memerlukan protokol **HTTPS** agar fitur kamera (`getUserMedia`) diizinkan. Jika diakses via HTTP biasa, browser akan memblokir kamera.
   - Solusi: Gunakan HTTPS (GitHub Pages dan Vercel otomatis HTTPS).
