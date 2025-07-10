export type DamageLevel = "Low" | "Medium" | "High";
export const damageLevels: DamageLevel[] = ["Low", "Medium", "High"];

export type AreaStatus = "Active" | "Repaired";

export type UserRole = "admin" | "user";

export type TrafficVolume = "Low" | "Medium" | "High";

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
}

export interface ReportArea {
    id: string;
    centerCoords: {
        lat: number;
        lng: number;
    };
    reports: Report[];
    status: AreaStatus;
    address: string;
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
