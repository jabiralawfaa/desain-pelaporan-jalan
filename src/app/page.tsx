"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header section with login/register buttons */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">PELAJAR</h1>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Masuk
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main landing page content */}
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h1 className="font-sans font-bold text-4xl md:text-5xl lg:text-6xl text-center leading-snug text-gray-800">
            Laporkan Jalan Rusak dengan Mudah dan Efektif!
          </h1>
          <div className="max-w-xl mx-auto">
            <p className="mt-10 text-gray-500 text-center text-xl lg:text-2xl">
              Gunakan PELAJAR untuk melaporkan kerusakan jalan dengan foto dan lokasi anda.
            </p>
          </div>
          <div className="mt-10 flex justify-center items-center w-full mx-auto">
            <Link 
              href="/login" 
              className="px-6 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Lapor Sekarang
            </Link>
            <span className="mx-4 text-gray-500">atau</span>
            <button 
              className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                // Scroll to features section
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Pelajari fitur kami
            </button>
          </div>
        </div>

        <div className="flex justify-center w-full mt-16">
          <div className="w-full">
            <p className="font-mono uppercase text-center font-medium text-sm text-gray-600">Berkolaborasi Bersama</p>
            <div className="flex items-center justify-center mx-auto flex-wrap">
              <img 
                src="/images/pupr.png" 
                alt="PUPR" 
                className="m-8" 
                width={120} 
                height={120}
                style={{ objectFit: 'contain' }}
              />
              <img 
                src="/images/Yolo.png" 
                alt="Yolo" 
                className="m-8" 
                width={250} 
                height={120}
                style={{ objectFit: 'contain' }}
              />
              <img 
                src="/images/KOMINFO.png" 
                alt="KOMINFO" 
                className="m-8" 
                width={120} 
                height={120}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>

        {/* Features section */}
        <div id="features" className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Fitur Utama PELAJAR
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Platform lengkap untuk pelaporan dan pemantauan kondisi jalan
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Pelaporan Mudah</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Laporkan kerusakan jalan dengan foto dan lokasi secara real-time menggunakan smartphone Anda.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Pemetaan Akurat</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Sistem pemetaan berbasis GPS untuk menampilkan lokasi kerusakan jalan secara akurat.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Analisis Data</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Analisis data kerusakan jalan untuk membantu pengambilan keputusan dalam perencanaan perbaikan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-white text-lg font-bold">PELAJAR</h3>
              <p className="mt-4 text-base text-gray-300">
                Platform pelaporan kerusakan jalan yang efektif dan efisien.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Solusi</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Pelaporan</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Pemetaan</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Analisis</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Perusahaan</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Tentang Kami</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Karir</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Kontak</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-300 text-center">
              &copy; 2023 PELAJAR. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
