
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { User, Report, ReportArea, AreaStatus, Feedback, UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { getStreetNameFromOverpass } from '@/lib/utils';

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
  const streets = ['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Pahlawan', 'Jl. Diponegoro', 'Jl. Ahmad Yani', 'Jl. Gajah Mada'];
  const areas = ['Pusat Kota', 'Kec. Banyuwangi', 'Kec. Rogojampi', 'Kec. Genteng', 'Kec. Srono', 'Kec. Muncar', 'Kec. Glenmore', 'Kec. Licin'];
  
  if (Math.random() > 0.4) {
    return `${streets[Math.floor(Math.random() * streets.length)]}, ${areas[Math.floor(Math.random() * areas.length)]}`;
  } else {
    return `Area ${areas[Math.floor(Math.random() * areas.length)]}`;
  }
};


interface AppContextType {
  user: User | null;
  loading: boolean;
  reportAreas: ReportArea[];
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  register: (username: string, email: string, pass: string, role?: UserRole) => { success: boolean; message: string };
  addReport: (newReportData: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel' | 'reporterRole'>) => Promise<void>;
  updateAreaStatus: (areaId: string, status: AreaStatus) => void;
  updateAreaProgress: (areaId: string, progress: number) => void;
  addFeedback: (areaId: string, feedback: Feedback) => Promise<void>;
  getAreaById: (id: string) => ReportArea | undefined;
  isAreaDetailOpen: boolean;
  setAreaDetailOpen: (isOpen: boolean) => void;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reportAreas, setReportAreas] = useState<ReportArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAreaDetailOpen, setAreaDetailOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      // Initialize users
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        const initialUsers: User[] = [
            { username: 'admin', email: 'admin@app.com', password: 'admin', role: 'admin' },
            { username: 'citizen_joe', email: 'joe@email.com', password: 'password', role: 'user' },
            { username: 'reporter_jane', email: 'jane@email.com', password: 'password', role: 'user' },
        ];
        setUsers(initialUsers);
        localStorage.setItem('users', JSON.stringify(initialUsers));
      }

      // Check for logged in user
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Hapus semua area lama dan localStorage reportAreas
      localStorage.removeItem('reportAreas');
      setReportAreas([]);
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (username: string, pass: string): boolean => {
    const foundUser = users.find(u => u.username === username && u.password === pass);
    if (foundUser) {
      localStorage.setItem('user', JSON.stringify(foundUser));
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const register = (username: string, email: string, pass: string, role: UserRole = 'user'): { success: boolean; message: string } => {
    if (users.some(u => u.username === username)) {
      return { success: false, message: 'Username is already taken.' };
    }
    if (users.some(u => u.email === email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser: User = { username, email, password: pass, role };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    return { success: true, message: 'Registration successful.' };
  };


  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const addReport = async (newReportData: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel' | 'reporterRole'>) => {
    if (!user) return;
    // Ambil nama jalan dari Overpass API
    const { streetName, streetCoords } = await getStreetNameFromOverpass(newReportData.coords.lat, newReportData.coords.lng);
    const newReport: Report = {
      ...newReportData,
      id: new Date().getTime().toString(),
      reportedAt: new Date().toISOString(),
      address: streetName,
      damageLevel: 'Medium', // Default value
      reporterRole: user.role,
    };

    setReportAreas(prevAreas => {
      // Cari area dengan nama jalan yang sama
      const existingArea = prevAreas.find(area => area.streetName === streetName && area.status === 'Active');
      let updatedAreas;
      if (existingArea) {
        updatedAreas = prevAreas.map(area =>
          area.id === existingArea.id
            ? { ...area, reports: [...area.reports, newReport] }
            : area
        );
      } else {
        const newArea: ReportArea = {
          id: `area-${new Date().getTime()}`,
          streetName,
          streetCoords,
          reports: [newReport],
          status: 'Active',
          address: streetName,
          trafficVolume: 'Low',
          roadWidth: 5,
          feedback: [],
          progress: 0,
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
        area.id === areaId ? { ...area, status: status, progress: status === 'Repaired' ? 100 : area.progress, reports: status === 'Repaired' ? [] : area.reports } : area
      );
      localStorage.setItem('reportAreas', JSON.stringify(updatedAreas));
      return updatedAreas;
    });
  };

  const updateAreaProgress = (areaId: string, progress: number) => {
    setReportAreas(prevAreas => {
      const updatedAreas = prevAreas.map(area => {
        if (area.id === areaId) {
          const newStatus = progress === 100 ? 'Repaired' : 'Active';
          return { ...area, progress, status: newStatus, reports: newStatus === 'Repaired' ? [] : area.reports };
        }
        return area;
      });
      localStorage.setItem('reportAreas', JSON.stringify(updatedAreas));
      return updatedAreas;
    });
  };
  
  const addFeedback = async (areaId: string, feedback: Feedback) => {
    setReportAreas(prevAreas => {
        const updatedAreas = prevAreas.map(area => {
            if (area.id === areaId) {
                const newFeedback = [...(area.feedback || []), feedback];
                return { ...area, feedback: newFeedback };
            }
            return area;
        });
        localStorage.setItem('reportAreas', JSON.stringify(updatedAreas));
        return updatedAreas;
    });
  }

  const getAreaById = useCallback((id: string) => {
    return reportAreas.find(area => area.id === id);
  }, [reportAreas]);

  const value = {
    user,
    loading,
    reportAreas,
    login,
    logout,
    register,
    addReport,
    updateAreaStatus,
    updateAreaProgress,
    addFeedback,
    getAreaById,
    isAreaDetailOpen,
    setAreaDetailOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
