# Dokumentasi Fitur Peta Interaktif & Penandaan Laporan

## Deskripsi Fitur
Fitur ini menampilkan semua area laporan kerusakan jalan pada peta interaktif (Leaflet + OpenStreetMap). Setiap area dan laporan ditandai dengan marker berbeda sesuai status dan progres.

## Cara Penggunaan
1. Login ke dashboard (user/admin).
2. Peta akan menampilkan marker area kerusakan.
3. Klik marker untuk melihat detail area/laporan.
4. Admin dapat melihat heatmap dan progres perbaikan.

## Alur Pengolahan Data
- Data area dan laporan diambil dari context (`reportAreas`).
- Marker area: warna dan ikon menyesuaikan status (aktif, progres, selesai).
- Marker laporan: titik kecil di sekitar area.
- Admin dapat melihat heatmap distribusi laporan.
- Klik marker memicu detail area (`AreaDetail`).

## Kode Terkait
- Komponen peta: `src/components/Map.tsx`
- Dashboard: `src/components/AdminDashboard.tsx`, `src/components/UserDashboard.tsx`
- Context: `src/contexts/AppContext.tsx` 