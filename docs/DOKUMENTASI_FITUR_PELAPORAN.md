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
- Jika lokasi dekat area aktif, laporan ditambahkan ke area tersebut. Jika tidak, dibuat area baru.
- Data laporan dan area disimpan di `localStorage` browser.
- Struktur data utama: `Report` dan `ReportArea` (lihat file `src/lib/types.ts`).
- Setiap laporan memiliki id, gambar (base64), deskripsi, koordinat, level kerusakan, waktu, alamat, dan peran pelapor.

## Kode Terkait
- Formulir: `src/components/ReportForm.tsx`
- Context: `src/contexts/AppContext.tsx` (fungsi `addReport`)
- Tipe data: `src/lib/types.ts` 