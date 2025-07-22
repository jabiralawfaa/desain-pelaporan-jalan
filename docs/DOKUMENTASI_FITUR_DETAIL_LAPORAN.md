# Dokumentasi Fitur Detail Laporan & Feedback

## Deskripsi Fitur
Fitur ini menampilkan detail area kerusakan, daftar laporan, histori, dan feedback pengguna. Pengguna dapat memberi komentar dan rating setelah area diperbaiki.

## Cara Penggunaan
1. Klik marker area di peta/dashboard.
2. Panel detail akan muncul (kanan/bawah layar).
3. Lihat daftar laporan, histori, dan komentar.
4. Setelah area diperbaiki, user bisa memberi rating & komentar.

## Alur Pengolahan Data
- Data area diambil dari context (`getAreaById`).
- Daftar laporan diurutkan, laporan surveyor diutamakan.
- Feedback disimpan di array `feedback` pada area.
- Komentar & rating dikirim via fungsi `addFeedback`.
- Semua data disimpan di `localStorage`.

## Kode Terkait
- Komponen detail: `src/components/AreaDetail.tsx`
- Context: `src/contexts/AppContext.tsx` (fungsi `addFeedback`)
- Tipe data: `src/lib/types.ts` 