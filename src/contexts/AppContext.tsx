"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Report, ReportArea, AreaStatus } from '@/lib/types';
import { useRouter } from 'next/navigation';

// Helper function to calculate distance between two lat-lng points in kilometers
const calculateDistance = (coords1: { lat: number; lng: number }, coords2: { lat: number; lng: number }) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
  const dLon = (coords2.lng - coords1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.lat * (Math.PI / 180)) *
      Math.cos(coords2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Dummy function to simulate geocoding
const getDummyAddress = (lat: number, lng: number): string => {
  const randomJalan = ['Kawasan Jl. Merdeka', 'Area Jl. Sudirman', 'Zona Jl. Thamrin', 'Sektor Jl. Gatot Subroto', 'Distrik Jl. Pahlawan'][Math.floor(Math.random() * 5)];
  return `${randomJalan}, Banyuwangi`;
};

interface AppContextType {
  user: User | null;
  loading: boolean;
  reportAreas: ReportArea[];
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  addReport: (newReportData: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel' | 'repairStatus'>) => Promise<void>;
  updateAreaStatus: (areaId: string, status: AreaStatus) => void;
  getAreaById: (id: string) => ReportArea | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [reportAreas, setReportAreas] = useState<ReportArea[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedAreas = localStorage.getItem('reportAreas');
      if (storedAreas) {
        setReportAreas(JSON.parse(storedAreas));
      } else {
        const mockReport: Report = { id: '1', coords: { lat: -8.25, lng: 114.36 }, damageLevel: 'Medium', repairStatus: 'Reported', image: 'https://placehold.co/600x400.png', reportedAt: new Date().toISOString(), address: "Jl. Gajah Mada, Banyuwangi", description: "Pothole in the middle of the road" };
        const mockArea: ReportArea = {
            id: 'area-1',
            centerCoords: { lat: -8.25, lng: 114.36 },
            reports: [mockReport],
            status: 'Active',
            address: getDummyAddress(-8.25, 114.36)
        };
        setReportAreas([mockArea]);
        localStorage.setItem('reportAreas', JSON.stringify([mockArea]));
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

  const addReport = async (newReportData: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel'| 'repairStatus'>) => {
    
    const newReport: Report = {
      ...newReportData,
      id: new Date().getTime().toString(),
      reportedAt: new Date().toISOString(),
      address: getDummyAddress(newReportData.coords.lat, newReportData.coords.lng),
      damageLevel: 'Medium', // Default value
      repairStatus: 'Reported',
    };

    setReportAreas(prevAreas => {
        const activeAreas = prevAreas.filter(a => a.status === 'Active');
        const existingArea = activeAreas.find(area => calculateDistance(area.centerCoords, newReport.coords) <= 1);

        let updatedAreas;

        if (existingArea) {
            // Add report to existing area
            updatedAreas = prevAreas.map(area => 
                area.id === existingArea.id 
                ? { ...area, reports: [...area.reports, newReport] }
                : area
            );
        } else {
            // Create a new area
            const newArea: ReportArea = {
                id: `area-${new Date().getTime()}`,
                centerCoords: newReport.coords,
                reports: [newReport],
                status: 'Active',
                address: getDummyAddress(newReport.coords.lat, newReport.coords.lng)
            };
            updatedAreas = [...prevAreas, newArea];
        }
        
        localStorage.setItem('reportAreas', JSON.stringify(updatedAreas));
        return updatedAreas;
    });
  };

  const updateAreaStatus = (areaId: string, status: AreaStatus) => {
    setReportAreas(prevAreas => {
      const updatedAreas = prevAreas.map(area =>
        area.id === areaId ? { ...area, status: status } : area
      );
      localStorage.setItem('reportAreas', JSON.stringify(updatedAreas));
      return updatedAreas;
    });
  };

  const getAreaById = useCallback((id: string) => {
    return reportAreas.find(area => area.id === id);
  }, [reportAreas]);

  const value = {
    user,
    loading,
    reportAreas,
    login,
    logout,
    addReport,
    updateAreaStatus,
    getAreaById
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
