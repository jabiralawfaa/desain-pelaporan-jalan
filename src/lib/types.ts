export type DamageLevel = "Low" | "Medium" | "High";
export const damageLevels: DamageLevel[] = ["Low", "Medium", "High"];

export type RepairStatus = "Reported" | "In Progress" | "Repaired";
export const repairStatuses: RepairStatus[] = ["Reported", "In Progress", "Repaired"];

export type UserRole = "admin" | "user";

export interface Report {
  id: string;
  image: string; // base64 data URL
  coords: {
    lat: number;
    lng: number;
  };
  damageLevel: DamageLevel;
  repairStatus: RepairStatus;
  reportedAt: string; // ISO string
  address: string;
}

export interface User {
  username: string;
  role: UserRole;
}
