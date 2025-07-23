
export type DamageLevel = "Low" | "Medium" | "High";
export const damageLevels: DamageLevel[] = ["Low", "Medium", "High"];

export type AreaStatus = "Active" | "Repaired";

export type UserRole = "admin" | "user" | "surveyor";

export type TrafficVolume = "Low" | "Medium" | "High";

export interface Feedback {
  userId: string;
  username: string;
  rating: number; // 1-5
  comment: string;
  submittedAt: string; // ISO string
}

export interface Report {
  id: string;
  image: string; // base64 data URL
  description: string;
  coords: {
    lat: number;
    lng: number;
  };
  damageLevel: DamageLevel;
  reportedAt: string; // ISO string
  address: string;
  reporterRole: UserRole;
}

export interface ReportArea {
    id: string;
    streetName: string; // Nama jalan dari OSM
    streetCoords: {
        lat: number;
        lng: number;
    };
    reports: Report[];
    status: AreaStatus;
    address: string;
    feedback: Feedback[];
    progress: number; // 0-100
    // SPK Criteria
    trafficVolume: TrafficVolume;
    roadWidth: number; // in meters
}

export interface User {
  username: string;
  email: string;
  password?: string; // Password is not always sent to the client
  role: UserRole;
}

export interface SawResult extends ReportArea {
  score: number;
  ranking: number;
}
