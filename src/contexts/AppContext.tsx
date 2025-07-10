"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Report, UserRole, RepairStatus } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AppContextType {
  user: User | null;
  loading: boolean;
  reports: Report[];
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  addReport: (newReport: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel'>) => Promise<void>;
  updateReportStatus: (reportId: string, status: RepairStatus) => void;
  getReportById: (id: string) => Report | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Dummy function to simulate geocoding
const getDummyAddress = (lat: number, lng: number): string => {
  const randomJalan = ['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Pahlawan'][Math.floor(Math.random() * 5)];
  const randomNomor = Math.floor(Math.random() * 100) + 1;
  return `${randomJalan} No.${randomNomor}, Banyuwangi`;
};


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedReports = localStorage.getItem('reports');
      if (storedReports) {
        setReports(JSON.parse(storedReports));
      } else {
        // Add some mock data if no reports exist
        const mockReports: Report[] = [
          { id: '1', coords: { lat: -8.25, lng: 114.36 }, damageLevel: 'Medium', repairStatus: 'Reported', image: 'https://placehold.co/600x400.png', reportedAt: new Date().toISOString(), address: "Jl. Gajah Mada, Banyuwangi", description: "Pothole in the middle of the road" },
          { id: '2', coords: { lat: -8.255, lng: 114.365 }, damageLevel: 'High', repairStatus: 'In Progress', image: 'https://placehold.co/600x400.png', reportedAt: new Date().toISOString(), address: "Jl. Basuki Rahmat, Banyuwangi", description: "Cracked pavement across the lane" },
          { id: '3', coords: { lat: -8.245, lng: 114.355 }, damageLevel: 'Low', repairStatus: 'Repaired', image: 'https://placehold.co/600x400.png', reportedAt: new Date().toISOString(), address: "Jl. Letjen S. Parman, Banyuwangi", description: "Minor crack on the sidewalk" },
        ];
        setReports(mockReports);
        localStorage.setItem('reports', JSON.stringify(mockReports));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (username: string, pass: string): boolean => {
    if (username === 'admin' && pass === 'admin') {
      const adminUser: User = { username: 'admin', role: 'admin' };
      localStorage.setItem('user', JSON.stringify(adminUser));
      setUser(adminUser);
      return true;
    }
    if (username === 'user' && pass === 'user') {
      const regularUser: User = { username: 'user', role: 'user' };
      localStorage.setItem('user', JSON.stringify(regularUser));
      setUser(regularUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const addReport = async (newReportData: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel'>) => {
    const address = getDummyAddress(newReportData.coords.lat, newReportData.coords.lng);
    const newReport: Report = {
      ...newReportData,
      id: new Date().getTime().toString(),
      reportedAt: new Date().toISOString(),
      address,
      damageLevel: 'Medium', // Default value, will be updated by ML
    };
    setReports(prevReports => {
      const updatedReports = [...prevReports, newReport];
      localStorage.setItem('reports', JSON.stringify(updatedReports));
      return updatedReports;
    });
  };

  const updateReportStatus = (reportId: string, status: RepairStatus) => {
    setReports(prevReports => {
      const updatedReports = prevReports.map(report =>
        report.id === reportId ? { ...report, repairStatus: status } : report
      );
      localStorage.setItem('reports', JSON.stringify(updatedReports));
      return updatedReports;
    });
  };

  const getReportById = useCallback((id: string) => {
    return reports.find(report => report.id === id);
  }, [reports]);

  const value = {
    user,
    loading,
    reports,
    login,
    logout,
    addReport,
    updateReportStatus,
    getReportById
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
