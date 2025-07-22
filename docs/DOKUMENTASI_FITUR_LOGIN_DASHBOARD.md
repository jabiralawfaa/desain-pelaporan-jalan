# Dokumentasi Fitur Login, Register & Dashboard

## Deskripsi Fitur
Fitur ini mengatur autentikasi user/admin/surveyor, pendaftaran akun, dan tampilan dashboard sesuai peran.

## Cara Penggunaan
1. Login dengan username & password (default admin: admin/admin).
2. Register untuk membuat akun baru (user/surveyor).
3. Setelah login, dashboard menyesuaikan peran:
   - User: lihat peta, buat laporan, feedback.
   - Admin: kelola laporan, progres, tambah surveyor, rekomendasi prioritas.

## Alur Pengolahan Data
- Data user disimpan di `localStorage` (`users`, `user`).
- Login: validasi username & password, set session di localStorage.
- Register: tambah user baru ke array users.
- Logout: hapus session user.
- Dashboard menampilkan komponen sesuai peran (`AdminDashboard`/`UserDashboard`).

## Kode Terkait
- Form login: `src/components/LoginForm.tsx`
- Form register: `src/components/RegisterForm.tsx`
- Context: `src/contexts/AppContext.tsx` (fungsi `login`, `register`, `logout`)
- Dashboard: `src/app/dashboard/page.tsx` 