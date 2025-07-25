
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { User, Report, ReportArea, AreaStatus, Feedback, UserRole } from '@/lib/types';
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
  const streets = ['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Pahlawan', 'Jl. Diponegoro', 'Jl. Ahmad Yani', 'Jl. Gajah Mada'];
  const areas = ['Pusat Kota', 'Kec. Banyuwangi', 'Kec. Rogojampi', 'Kec. Genteng', 'Kec. Srono', 'Kec. Muncar', 'Kec. Glenmore', 'Kec. Licin'];
  
  if (Math.random() > 0.4) {
    return `${streets[Math.floor(Math.random() * streets.length)]}, ${areas[Math.floor(Math.random() * areas.length)]}`;
  } else {
    return `Area ${areas[Math.floor(Math.random() * areas.length)]}`;
  }
};


// Function to generate initial mock data
const generateInitialData = (): ReportArea[] => {
    const mockReports: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel' | 'reporterRole'>[] = [
      // Area 1: Pusat Kota, Ramai
      { coords: { lat: -8.2095, lng: 114.3651 }, image: 'https://placehold.co/600x400.png', description: 'Lubang besar dekat alun-alun.' },
      { coords: { lat: -8.2100, lng: 114.3655 }, image: 'https://placehold.co/600x400.png', description: 'Aspal retak.' },
      { coords: { lat: -8.2098, lng: 114.3653 }, image: 'https://placehold.co/600x400.png', description: 'Paving pecah.' },
      
      // Area 2: Jalan Protokol, Cukup Ramai
      { coords: { lat: -8.1683, lng: 114.3365 }, image: 'https://placehold.co/600x400.png', description: 'Jalan bergelombang parah.' },
      { coords: { lat: -8.1685, lng: 114.3367 }, image: 'https://placehold.co/600x400.png', description: 'Retakan memanjang.' },

      // Area 3: Perkampungan, Sepi
      { coords: { lat: -8.3582, lng: 114.2694 }, image: 'https://placehold.co/600x400.png', description: 'Genangan air tidak surut.' },

      // Area 4: Dekat Pelabuhan, Sangat Ramai
      { coords: { lat: -8.2530, lng: 114.3670 }, image: 'https://placehold.co/600x400.png', description: 'Kerusakan di dekat pelabuhan.' },
      { coords: { lat: -8.2532, lng: 114.3671 }, image: 'https://placehold.co/600x400.png', description: 'Banyak lubang kecil.' },
      { coords: { lat: -8.2535, lng: 114.3673 }, image: 'https://placehold.co/600x400.png', description: 'Amblas.' },
      { coords: { lat: -8.2528, lng: 114.3669 }, image: 'https://placehold.co/600x400.png', description: 'Jalan licin.' },

      // Area 5: Pedesaan, Sepi
      { coords: { lat: -8.4521, lng: 114.0531 }, image: 'https://placehold.co/600x400.png', description: 'Jalanan longsor di area Glenmore.' },

       // Area 6: Perumahan, Cukup Ramai
      { coords: { lat: -8.1130, lng: 114.2185 }, image: 'https://placehold.co/600x400.png', description: 'Kerusakan akibat akar pohon di Licin.' },
      { coords: { lat: -8.1132, lng: 114.2187 }, image: 'https://placehold.co/600x400.png', description: 'Paving block rusak.' },
    ];

    let reportAreas: ReportArea[] = [];
    const trafficVolumes: ReportArea['trafficVolume'][] = ['High', 'Medium', 'Low', 'High', 'Low', 'Medium'];
    const roadWidths = [8, 6, 4, 10, 5, 6];

    mockReports.forEach((reportData, index) => {
        const newReport: Report = {
            ...reportData,
            id: `mock-${index + 1}`,
            reportedAt: new Date().toISOString(),
            address: getDummyAddress(reportData.coords.lat, reportData.coords.lng),
            damageLevel: 'Medium', // Default value
            reporterRole: 'user', // Default role for mock data
        };

        const activeAreas = reportAreas.filter(a => a.status === 'Active');
        const existingArea = activeAreas.find(area => calculateDistance(area.centerCoords, newReport.coords) <= 0.5);

        if (existingArea) {
            reportAreas = reportAreas.map(area =>
                area.id === existingArea.id
                ? { ...area, reports: [...area.reports, newReport] }
                : area
            );
        } else {
            const areaIndex = reportAreas.length;
            const newArea: ReportArea = {
                id: `area-mock-${new Date().getTime()}-${index}`,
                centerCoords: newReport.coords,
                reports: [newReport],
                status: 'Active',
                address: getDummyAddress(newReport.coords.lat, newReport.coords.lng),
                trafficVolume: trafficVolumes[areaIndex % trafficVolumes.length],
                roadWidth: roadWidths[areaIndex % roadWidths.length],
                feedback: [],
                progress: Math.random() > 0.7 ? Math.floor(Math.random() * 80) : 0,
            };
            reportAreas.push(newArea);
        }
    });
    
    // Add one repaired area for demonstration with feedback
    reportAreas.push({
        id: 'area-repaired-1',
        centerCoords: { lat: -8.2173, lng: 114.3725 },
        reports: [],
        status: 'Repaired',
        address: 'Jl. Basuki Rahmat, Kec. Banyuwangi',
        trafficVolume: 'Medium',
        roadWidth: 8,
        feedback: [
            {
                userId: 'user1',
                username: 'citizen_joe',
                rating: 5,
                comment: 'Perbaikannya sangat cepat dan hasilnya mulus. Terima kasih!',
                submittedAt: new Date().toISOString(),
            },
            {
                userId: 'user2',
                username: 'reporter_jane',
                rating: 4,
                comment: 'Sudah jauh lebih baik, meskipun masih sedikit bergelombang di satu sisi.',
                submittedAt: new Date().toISOString(),
            }
        ],
        progress: 100,
    });

    return reportAreas;
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

      // Initialize reports data
      const storedAreas = localStorage.getItem('reportAreas');
      if (storedAreas) {
        setReportAreas(JSON.parse(storedAreas));
      } else {
        const initialAreas = generateInitialData();
        setReportAreas(initialAreas);
        localStorage.setItem('reportAreas', JSON.stringify(initialAreas));
      }
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
    
    const newReport: Report = {
      ...newReportData,
      id: new Date().getTime().toString(),
      reportedAt: new Date().toISOString(),
      address: getDummyAddress(newReportData.coords.lat, newReportData.coords.lng),
      damageLevel: 'Medium', // Default value
      reporterRole: user.role,
    };

    setReportAreas(prevAreas => {
        const activeAreas = prevAreas.filter(a => a.status === 'Active');
        const existingArea = activeAreas.find(area => calculateDistance(area.centerCoords, newReport.coords) <= 0.5);

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
                address: getDummyAddress(newReport.coords.lat, newReport.coords.lng),
                trafficVolume: 'Low', // Default for new areas
                roadWidth: 5, // Default for new areas
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
