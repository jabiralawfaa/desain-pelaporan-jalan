# Dokumentasi Fitur Pelaporan Kerusakan Jalan

## Deskripsi Fitur
Fitur ini memungkinkan pengguna (user/surveyor) untuk melaporkan kerusakan jalan dengan mengambil foto, menulis deskripsi, dan mengirimkan lokasi secara otomatis.

## Cara Penggunaan
1. Login sebagai user/surveyor.
2. Pilih menu "New Report".
3. Aktifkan kamera, ambil foto kerusakan jalan.
4. Tambahkan deskripsi (opsional).
5. Lokasi akan terdeteksi otomatis, bisa di-refresh.
6. Klik "Submit Report" untuk mengirim laporan.

## Alur Pengolahan Data
- Data laporan (foto, deskripsi, koordinat) dikirim ke fungsi `addReport` di context.
- Sistem akan mengambil nama jalan terdekat dari koordinat menggunakan Overpass API (OpenStreetMap).
- Jika sudah ada area dengan nama jalan tersebut, laporan dimasukkan ke area itu. Jika belum ada, dibuat area baru.
- Data laporan dan area disimpan di `localStorage` browser.
- Struktur data utama: `Report` dan `ReportArea` (lihat file `src/lib/types.ts`).
- Setiap area sekarang memiliki properti `streetName` dan `streetCoords` (koordinat jalan dari OSM).
- Setiap laporan memiliki id, gambar (base64), deskripsi, koordinat, level kerusakan, waktu, alamat (nama jalan), dan peran pelapor.

## Integrasi Overpass API
- Sistem melakukan HTTP request ke Overpass API untuk mendapatkan nama jalan terdekat dari koordinat laporan.
- Contoh query:
  ```xml
  [out:json];
  way(around:30, LAT, LNG)[highway];
  out tags center 1;
  ```
  Ganti `LAT` dan `LNG` dengan koordinat laporan.

## Kode Terkait
- Formulir: `src/components/ReportForm.tsx`
- Context: `src/contexts/AppContext.tsx` (fungsi `addReport`)
- Utilitas Overpass: `src/lib/utils.ts`
- Tipe data: `src/lib/types.ts` 