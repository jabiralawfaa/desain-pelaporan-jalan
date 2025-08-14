
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { User, Report, ReportArea, AreaStatus, Feedback, UserRole, GeocodingMetadata } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { getStreetNameFromOverpass } from '@/lib/utils';
import { initializeDataMigration } from '@/lib/data-migration';

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

  return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
};

interface AppContextType {
  user: User | null;
  loading: boolean;
  reportAreas: ReportArea[];
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  register: (username: string, email: string, pass: string, role?: UserRole) => { success: boolean; message: string };
  addReport: (newReportData: Omit<Report, 'id' | 'reportedAt' | 'address' | 'damageLevel' | 'reporterRole' | 'geocodingMetadata'>) => Promise<boolean>;
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
      // Run data migration first to ensure data integrity
      initializeDataMigration();

      // Initialize users
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        const initialUsers: User[] = [
            { username: 'admin', email: 'admin@app.com', password: 'admin', role: 'admin' },
            { username: 'citizen_joe', email: 'joe@email.com', password: 'password', role: 'user' },
            { username: 'surveyor_mike', email: 'mike@email.com', password: 'password', role: 'surveyor' },
        ];
        setUsers(initialUsers);
        localStorage.setItem('users', JSON.stringify(initialUsers));
      }

      // Check for logged in user
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Load report areas (data should be clean after migration)
      const storedReportAreas = localStorage.getItem('reportAreas');
      if (storedReportAreas) {
        try {
          const parsedAreas = JSON.parse(storedReportAreas);
          // Additional validation after migration
          const validatedAreas = parsedAreas
            .filter((area: any) => area && area.id && area.streetName)
            .map((area: any) => ({
              ...area,
              // Ensure streetCoords exists and has valid lat/lng
              streetCoords: area.streetCoords &&
                           typeof area.streetCoords.lat === 'number' &&
                           typeof area.streetCoords.lng === 'number'
                           ? area.streetCoords
                           : { lat: -8.253, lng: 114.367 }, // Default fallback
              // Ensure reports array exists and is valid
              reports: Array.isArray(area.reports)
                       ? area.reports.filter((report: any) =>
                           report &&
                           report.id &&
                           report.coords &&
                           typeof report.coords.lat === 'number' &&
                           typeof report.coords.lng === 'number'
                         )
                       : [],
              // Ensure other required fields exist
              status: area.status || 'Active',
              address: area.address || area.streetName || 'Unknown Address',
              feedback: Array.isArray(area.feedback) ? area.feedback : [],
              progress: typeof area.progress === 'number' ? area.progress : 0,
              trafficVolume: area.trafficVolume || 'Low',
              roadWidth: typeof area.roadWidth === 'number' ? area.roadWidth : 5
            }));
          setReportAreas(validatedAreas);
        } catch (error) {
          console.error("Failed to parse stored report areas:", error);
          setReportAreas([]);
        }
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

    // Validate input coordinates
    if (!newReportData.coords ||
        typeof newReportData.coords.lat !== 'number' ||
        typeof newReportData.coords.lng !== 'number' ||
        isNaN(newReportData.coords.lat) ||
        isNaN(newReportData.coords.lng)) {
      console.error('Invalid coordinates provided:', newReportData.coords);
      return false;
    }

    let streetName: string;
    let streetCoords: { lat: number, lng: number };
    let geocodingMetadata: GeocodingMetadata | undefined;

    try {
      console.log('Starting geocoding for coordinates:', newReportData.coords);
      const result = await getStreetNameFromOverpass(newReportData.coords.lat, newReportData.coords.lng);
      
      streetName = result.streetName || 'Unknown Street';
      streetCoords = result.streetCoords &&
                    typeof result.streetCoords.lat === 'number' &&
                    typeof result.streetCoords.lng === 'number'
                    ? result.streetCoords
                    : newReportData.coords; // Fallback to original coords
      geocodingMetadata = result.metadata;

      console.log('Geocoding completed:', {
        streetName,
        source: geocodingMetadata?.source,
        confidence: geocodingMetadata?.confidence
      });

    } catch (error) {
      console.error("Error during geocoding process:", error);
      
      streetName = `Area Dekat ${newReportData.coords.lat.toFixed(3)}, ${newReportData.coords.lng.toFixed(3)}`;
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
      geocodingMetadata,
    };

    setReportAreas(prevAreas => {
      const existingArea = prevAreas.find(area => area.streetName.toLowerCase() === streetName.toLowerCase() && area.status === 'Active');

      let updatedAreas;
      if (existingArea) {
        console.log('Adding report to existing area:', existingArea.streetName);
        
        updatedAreas = prevAreas.map(area =>
          area.id === existingArea.id
            ? {
                ...area,
                reports: [...(area.reports || []), newReport],
              }
            : area
        );
      } else {
        console.log('Creating new area for:', streetName);
        
        const qualityScore = calculateAreaQualityScore(geocodingMetadata, 1);

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
        };
        updatedAreas = [...prevAreas, newArea];
      }
      
      localStorage.setItem('reportAreas', JSON.stringify(updatedAreas));
      return updatedAreas;
    });

    return true;
  };
  
  const updateAreaProgress = (areaId: string, progress: number) => {
    setReportAreas(prevAreas => {
      const updatedAreas = prevAreas.map(area => {
        if (area.id === areaId) {
          const newStatus: AreaStatus = progress >= 100 ? 'Repaired' : 'Active';
          return { ...area, progress: Math.min(100, progress), status: newStatus };
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
