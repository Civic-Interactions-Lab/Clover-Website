import { ClassInfo } from "./class";

export enum UserRole {
  STUDENT = "STUDENT",
  INSTRUCTOR = "INSTRUCTOR",
  ADMIN = "ADMIN",
  DEV = "DEVELOPER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  LOCKED = "LOCKED",
}

export enum EnrollmentStatus {
  WAITLISTED = "WAITLISTED",
  ENROLLED = "ENROLLED",
  COMPLETED = "COMPLETED",
  REMOVED = "REMOVED",
  REJECTED = "REJECTED",
}

export enum UserMode {
  CODE_BLOCK = "CODE_BLOCK",
  LINE_BY_LINE = "LINE_BY_LINE",
  CODE_SELECTION = "CODE_SELECTION",
}

export const AUTH_CONTEXT = "authContext";

export interface User {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  pid?: string;
  settings: UserSettings;
  isConsent?: boolean;
  // last_updated_at?: string;
  // auth_created_at?: string;
  // last_sign_in?: string;
  // source?: string;

  enrollmentStatus?: EnrollmentStatus;
}

export type UserSettings = {
  enableQuiz: boolean;
  bugPercentage: number;
  showNotifications: boolean;
  mode: UserMode;
  enableDashboard: boolean;
};

export interface ProgressData {
  totalAccepted: number;
  totalRejected: number;
  totalInteractions: number;
  correctSuggestions: number;
  correctAccepts?: number;
  correctRejects?: number;
  accuracyPercentage: number;
}

export interface UserWithActivity extends User, ProgressData {
  lastActivity: string | null;
  activityMode: UserMode | null;
}

export interface ClassData extends ClassInfo {
  createdAt?: string;
  instructorName?: string;
  joinedAt?: string;
  enrollmentStatus?: EnrollmentStatus;
  studentCount?: number;
  students?: User[];
}
