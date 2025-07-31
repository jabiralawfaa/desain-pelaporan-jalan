# Dokumentasi Fitur ANP Kriteria

## Overview
Fitur ANP (Analytic Network Process) Kriteria memungkinkan admin untuk menentukan bobot kriteria yang akan digunakan dalam sistem rekomendasi perbaikan jalan menggunakan metode TOPSIS. ANP merupakan pengembangan dari AHP yang memungkinkan analisis interdependensi antar kriteria.

## Perbedaan ANP dengan AHP

### AHP (Analytic Hierarchy Process)
- Struktur hierarkis linear
- Tidak mempertimbangkan interdependensi antar kriteria
- Cocok untuk masalah dengan struktur yang jelas dan independen

### ANP (Analytic Network Process)
- Struktur jaringan yang memungkinkan feedback dan interdependensi
- Mempertimbangkan pengaruh timbal balik antar kriteria
- Lebih akurat untuk masalah kompleks dengan interdependensi
- Menggunakan supermatrix dan limit matrix untuk perhitungan final

## Fitur Utama

### 1. Input Kriteria
- Admin dapat menambahkan 2-5 kriteria
- Setiap kriteria memiliki nama dan deskripsi opsional
- Contoh kriteria: Volume Lalu Lintas, Tingkat Kerusakan, Jumlah Laporan
- Opsi untuk mengaktifkan analisis interdependensi

### 2. Perbandingan Berpasangan
- **Perbandingan Kriteria**: Menentukan kepentingan relatif antar kriteria
- **Analisis Interdependensi** (opsional): Mengevaluasi pengaruh timbal balik antar kriteria
- Skala penilaian 1-9 dan 1/1-1/9:
  - 1 = Sama penting/berpengaruh
  - 3 = Sedikit lebih penting/berpengaruh
  - 5 = Lebih penting/berpengaruh
  - 7 = Sangat lebih penting/berpengaruh
  - 9 = Ekstrem lebih penting/berpengaruh
  - 1/3, 1/5, 1/7, 1/9 = Kebalikan dari nilai di atas

### 3. Perhitungan Bobot ANP
- Menggunakan metode eigenvalue untuk menghitung bobot kriteria
- Jika interdependensi diaktifkan:
  - Membuat supermatrix dari bobot kriteria dan matriks interdependensi
  - Menghitung limit matrix untuk mendapatkan bobot final
  - Bobot final mempertimbangkan pengaruh timbal balik antar kriteria
- Uji konsistensi dengan Consistency Ratio (CR)
- CR < 10% dianggap konsisten

### 4. Integrasi TOPSIS
- Bobot ANP (limit weights jika ada interdependensi) digunakan dalam perhitungan TOPSIS
- Menghasilkan ranking prioritas perbaikan jalan yang lebih akurat
- Menampilkan skor dan peringkat untuk setiap area

## Struktur File

### Types (`src/lib/types.ts`)
```typescript
interface ANPCriteria {
  id: string;
  name: string;
  description?: string;
}

interface ANPPairwiseComparison {
  criteria1Id: string;
  criteria2Id: string;
  value: number;
  comparisonType: 'criteria' | 'interdependency';
}

interface ANPResult {
  criteria: ANPCriteria[];
  weights: ANPWeights[];
  consistencyRatio: number;
  isConsistent: boolean;
  hasInterdependencies: boolean;
  supermatrix?: number[][];
  limitMatrix?: number[][];
  createdAt: string;
  createdBy: string;
}
```

### Utility Functions (`src/lib/anp-utils.ts`)
- `createComparisonMatrix()` - Membuat matriks perbandingan (kriteria atau interdependensi)
- `calculateEigenVector()` - Menghitung eigenvalue dan eigenvector
- `calculateConsistencyRatio()` - Menghitung rasio konsistensi
- `createSupermatrix()` - Membuat supermatrix ANP
- `calculateLimitMatrix()` - Menghitung limit matrix
- `processANP()` - Proses lengkap perhitungan ANP
- `generateRequiredComparisons()` - Generate perbandingan yang diperlukan
- `validateComparisons()` - Validasi kelengkapan perbandingan

### Halaman Utama (`src/app/dashboard/kriteria-anp/page.tsx`)
- Interface 3 langkah: Kriteria → Perbandingan → Hasil
- Form input kriteria dengan validasi
- Toggle untuk mengaktifkan analisis interdependensi
- Form perbandingan berpasangan dengan dropdown
- Tampilan hasil dengan uji konsistensi dan bobot ANP
- Integrasi dengan komponen TOPSIS

### Komponen TOPSIS (`src/components/ANPTopsisIntegration.tsx`)
- Menggunakan bobot ANP (limit weights) untuk perhitungan TOPSIS
- Menampilkan ranking prioritas perbaikan jalan
- Skor dan peringkat untuk setiap area
- Indikator khusus untuk hasil dengan interdependensi

## Cara Penggunaan

### 1. Akses Menu ANP
- Login sebagai admin
- Klik menu profil (avatar) di dashboard
- Pilih "Kriteria ANP"

### 2. Langkah 1: Input Kriteria
- Masukkan nama kriteria (minimal 2, maksimal 5)
- Tambahkan deskripsi jika diperlukan
- **Aktifkan "Sertakan analisis interdependensi"** untuk analisis ANP penuh
- Contoh kriteria:
  - Volume Lalu Lintas
  - Tingkat Kerusakan Jalan
  - Jumlah Laporan Masyarakat

### 3. Langkah 2: Perbandingan Berpasangan
#### 2A. Perbandingan Kriteria
- Jawab pertanyaan perbandingan untuk setiap pasang kriteria
- Pilih tingkat kepentingan dari dropdown
- Contoh: "Apakah Volume Lalu Lintas lebih penting dari Tingkat Kerusakan?"

#### 2B. Analisis Interdependensi (jika diaktifkan)
- Evaluasi pengaruh timbal balik antar kriteria
- Contoh: "Seberapa besar Volume Lalu Lintas mempengaruhi Tingkat Kerusakan?"
- Pertanyaan ini membantu ANP memahami hubungan kompleks antar kriteria

### 4. Langkah 3: Hasil dan TOPSIS
- Lihat bobot yang dihitung untuk setiap kriteria
- Jika interdependensi diaktifkan, lihat bobot limit (final) dan bobot awal
- Periksa rasio konsistensi (harus < 10%)
- Gunakan bobot untuk perhitungan TOPSIS
- Lihat ranking prioritas perbaikan jalan

## Contoh Skenario Penggunaan

### Skenario 1: ANP Tanpa Interdependensi (seperti AHP)
**Kriteria:**
1. Volume Lalu Lintas (C1)
2. Tingkat Kerusakan (C2)
3. Jumlah Laporan (C3)

**Perbandingan Kriteria:**
- C1 vs C2: Volume lalu lintas sedikit lebih penting (3)
- C1 vs C3: Volume lalu lintas lebih penting (5)
- C2 vs C3: Tingkat kerusakan lebih penting (3)

**Hasil:** Sama seperti AHP tradisional

### Skenario 2: ANP Dengan Interdependensi
**Kriteria yang sama, plus analisis interdependensi:**

**Perbandingan Interdependensi:**
- C1 → C2: Volume lalu lintas sangat mempengaruhi tingkat kerusakan (7)
- C1 → C3: Volume lalu lintas mempengaruhi jumlah laporan (5)
- C2 → C3: Tingkat kerusakan mempengaruhi jumlah laporan (3)

**Hasil:**
- Bobot awal (dari perbandingan kriteria)
- Bobot limit (setelah mempertimbangkan interdependensi)
- Bobot limit biasanya lebih seimbang karena mempertimbangkan pengaruh timbal balik

## Keunggulan ANP

### 1. Akurasi Lebih Tinggi
- Mempertimbangkan hubungan kompleks antar kriteria
- Hasil lebih realistis untuk masalah dunia nyata

### 2. Fleksibilitas
- Dapat digunakan dengan atau tanpa interdependensi
- Backward compatibility dengan AHP

### 3. Transparansi
- Menampilkan bobot awal dan bobot final
- Pengguna dapat melihat dampak interdependensi

## Validasi dan Error Handling

### Validasi Input
- Minimal 2 kriteria harus diisi
- Maksimal 5 kriteria untuk efisiensi perhitungan
- Nama kriteria tidak boleh kosong

### Validasi Perbandingan
- Semua perbandingan kriteria harus diisi
- Jika interdependensi diaktifkan, semua perbandingan interdependensi harus diisi
- Nilai harus dalam rentang yang valid

### Uji Konsistensi
- CR < 10%: Konsisten (hijau)
- CR ≥ 10%: Kurang konsisten (kuning)
- Rekomendasi untuk meninjau ulang jika tidak konsisten

## Integrasi dengan Sistem Existing

### Dashboard Admin
- Menu "Kriteria ANP" menggantikan menu AHP
- Hanya dapat diakses oleh user dengan role 'admin'

### Sistem Rekomendasi
- Bobot ANP (limit weights) digunakan dalam perhitungan TOPSIS
- Menghasilkan ranking prioritas perbaikan jalan yang lebih akurat
- Terintegrasi dengan data laporan existing

## Technical Notes

### Algoritma ANP
- Menggunakan metode eigenvalue untuk menghitung bobot kriteria
- Supermatrix menggabungkan bobot kriteria dengan matriks interdependensi
- Limit matrix dihitung dengan memangkatkan supermatrix
- Implementasi power method untuk iterasi eigenvalue

### Algoritma TOPSIS dengan ANP
- Normalisasi matriks keputusan
- Penerapan bobot ANP (limit weights jika ada interdependensi)
- Perhitungan jarak ke solusi ideal positif dan negatif
- Ranking berdasarkan closeness coefficient

### Performance
- Optimized untuk maksimal 5 kriteria
- Iterasi eigenvalue dibatasi 100 iterasi
- Konvergensi threshold: 1e-10
- Limit matrix calculation: 20 iterasi pangkat

## Troubleshooting

### Masalah Umum
1. **Rasio konsistensi tinggi**
   - Solusi: Tinjau ulang perbandingan yang tidak logis
   - Pastikan konsistensi transitif (A>B, B>C, maka A>C)

2. **Interdependensi tidak masuk akal**
   - Periksa apakah benar ada pengaruh timbal balik antar kriteria
   - Pertimbangkan untuk tidak mengaktifkan interdependensi jika tidak diperlukan

3. **Bobot limit sangat berbeda dari bobot awal**
   - Normal jika interdependensi kuat
   - Periksa kembali nilai interdependensi

4. **Error perhitungan**
   - Periksa input kriteria tidak kosong
   - Pastikan semua perbandingan terisi

### Debug Mode
- Console log tersedia untuk debugging
- Error handling dengan toast notifications
- Validasi input real-time
- Tampilan bobot awal dan limit untuk transparansi

## Kesimpulan

ANP memberikan analisis yang lebih komprehensif dibandingkan AHP tradisional dengan mempertimbangkan interdependensi antar kriteria. Ini menghasilkan bobot yang lebih akurat untuk sistem rekomendasi perbaikan jalan, terutama ketika kriteria saling mempengaruhi satu sama lain.