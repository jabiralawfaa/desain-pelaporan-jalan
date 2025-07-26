
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { User, Report, ReportArea, AreaStatus, Feedback, UserRole, GeocodingMetadata } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { getStreetNameFromOverpass, calculateDistance } from '@/lib/utils';

// Helper function to calculate distance between two lat-lng points in kilometers
const calculateDistanceKm = (coords1: { lat: number; lng: number }, coords2: { lat: number; lng: number }) => {
  return calculateDistance(coords1, coords2) / 1000; // Convert meters to kilometers
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

// Helper function to calculate area quality score
const calculateAreaQualityScore = (
  geocodingMetadata: GeocodingMetadata | undefined,
  reportCount: number
): number => {
  let score = 0.5; // Base score

  if (geocodingMetadata) {
    // Geocoding confidence contributes 40% to quality score
    score += geocodingMetadata.confidence * 0.4;

    // Source reliability contributes 20% to quality score
    const sourceReliability = {
      'overpass': 1.0,
      'nominatim': 0.8,
      'fallback': 0.2,
      'error_fallback': 0.1,
      'batch_error_fallback': 0.1
    };
    score += (sourceReliability[geocodingMetadata.source] || 0.1) * 0.2;

    // Road type contributes 20% to quality score
    if (geocodingMetadata.roadType) {
      const roadTypeScore = {
        'motorway': 1.0,
        'trunk': 0.9,
        'primary': 0.8,
        'secondary': 0.7,
        'tertiary': 0.6,
        'unclassified': 0.5,
        'residential': 0.4,
        'service': 0.3
      };
      score += (roadTypeScore[geocodingMetadata.roadType as keyof typeof roadTypeScore] || 0.2) * 0.2;
    }
  }

  // Report density contributes 20% to quality score
  const reportDensityScore = Math.min(reportCount / 5, 1.0); // Max score at 5+ reports
  score += reportDensityScore * 0.2;

<<<<<<< HEAD
  return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
=======
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
                username: 'RusydiJabir',
                rating: 5,
                comment: 'Perbaikannya sangat cepat dan hasilnya mulus. Terima kasih!',
                submittedAt: new Date().toISOString(),
            },
            {
                userId: 'user2',
                username: 'MGhofur',
                rating: 4,
                comment: 'Sudah jauh lebih baik, meskipun masih sedikit bergelombang di satu sisi.',
                submittedAt: new Date().toISOString(),
            }
        ],
        progress: 100,
    });

    return reportAreas;
>>>>>>> dino/main
};

interface AppContextType {
  user: User | null;
  loading: boolean;
  reportAreas: ReportArea[];
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  register: (username: string, email: string, pass: string, role?: UserRole) => { success: boolean; message: string };
  addReport: (newReportData: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel' | 'reporterRole'>) => Promise<boolean>;
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

      // Load report areas
      const storedReportAreas = localStorage.getItem('reportAreas');
      if (storedReportAreas) {
        setReportAreas(JSON.parse(storedReportAreas));
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

  const addReport = async (newReportData: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel' | 'reporterRole' | 'geocodingMetadata'>): Promise<boolean> => {
    if (!user) return false;

    let streetName: string;
    let streetCoords: { lat: number, lng: number };
    let geocodingMetadata: GeocodingMetadata | undefined;

    try {
      console.log('Starting geocoding for coordinates:', newReportData.coords);
      const result = await getStreetNameFromOverpass(newReportData.coords.lat, newReportData.coords.lng);
      
      streetName = result.streetName;
      streetCoords = result.streetCoords;
      geocodingMetadata = result.metadata;

      console.log('Geocoding completed:', {
        streetName,
        source: geocodingMetadata?.source,
        confidence: geocodingMetadata?.confidence
      });

    } catch (error) {
      console.error("Error during geocoding process:", error);
      
      // Enhanced fallback with better error handling
      streetName = getDummyAddress(newReportData.coords.lat, newReportData.coords.lng);
      streetCoords = newReportData.coords;
      geocodingMetadata = {
        confidence: 0.1,
        source: 'error_fallback',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown geocoding error'
      };
    }

    const newReport: Report = {
      ...newReportData,
      id: new Date().getTime().toString(),
      reportedAt: new Date().toISOString(),
      address: streetName,
      damageLevel: 'Medium',
      reporterRole: user.role,
<<<<<<< HEAD
      geocodingMetadata,
=======
      roadName: newReportData.roadName, // tambahan
      roadType: newReportData.roadType, // tambahan
      roadLength: newReportData.roadLength, // tambahan
>>>>>>> dino/main
    };

    setReportAreas(prevAreas => {
      const existingArea = prevAreas.find(area =>
        area.status === 'Active' &&
        calculateDistanceKm(area.streetCoords, streetCoords) < 0.05 // 50 meters threshold
      );

      let updatedAreas;
      if (existingArea) {
        console.log('Adding report to existing area:', existingArea.streetName);
        
        // Update area's geocoding metadata if new report has better confidence
        const shouldUpdateAreaMetadata = geocodingMetadata &&
          (!existingArea.geocodingMetadata ||
           geocodingMetadata.confidence > existingArea.geocodingMetadata.confidence);

        updatedAreas = prevAreas.map(area =>
          area.id === existingArea.id
            ? {
                ...area,
                reports: [...area.reports, newReport],
                // Update area metadata if new geocoding is more confident
                ...(shouldUpdateAreaMetadata && {
                  streetName,
                  streetCoords,
                  address: streetName,
                  geocodingMetadata
                })
              }
            : area
        );
      } else {
        console.log('Creating new area for:', streetName);
        
        // Calculate quality score based on geocoding confidence and other factors
        const qualityScore = calculateAreaQualityScore(geocodingMetadata, 1); // 1 report initially

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
          geocodingMetadata,
          qualityScore,
          // Store alternative names if available
          alternativeNames: geocodingMetadata?.source !== 'fallback' ? [{
            name: streetName,
            source: geocodingMetadata?.source || 'fallback',
            confidence: geocodingMetadata?.confidence || 0.1
          }] : undefined
        };
        updatedAreas = [...prevAreas, newArea];
      }
      
      localStorage.setItem('reportAreas', JSON.stringify(updatedAreas));
      return updatedAreas;
    });

    return true;
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
          const newStatus: AreaStatus = progress === 100 ? 'Repaired' : 'Active';
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
