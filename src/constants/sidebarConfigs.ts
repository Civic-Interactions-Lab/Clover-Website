import {
  BarChart2,
  BookOpenText,
  Users,
  PenBoxIcon,
  LucideIcon,
  Activity,
  FileText,
  Settings,
  BarChart3,
  ClipboardPenIcon,
  BugIcon,
} from "lucide-react";
import { UserRole } from "../types/user";
import { ComponentType } from "react";
import StudentStatsView from "../pages/dashboard/ui/views/student/StudentStatsView";
import StudentClassesView from "@/pages/dashboard/ui/views/student/StudentClassesView";
import StudentRegisterClassView from "@/pages/dashboard/ui/views/student/StudentRegisterClassView";
import StudentLogsView from "@/pages/dashboard/ui/views/student/StudentLogsView";
import InstructorStudentListView from "@/pages/dashboard/ui/views/instructor/InstructorStudentListView";
import InstructorStatsView from "@/pages/dashboard/ui/views/instructor/InstructorStatsView";
import InstructorClassesView from "@/pages/dashboard/ui/views/instructor/InstructorClassesView";
import UsersAdministrationView from "@/pages/dashboard/ui/views/admin/UsersAdministrationView";
import ClassesAdministrationView from "@/pages/dashboard/ui/views/admin/ClassesAdministrationView";
import AppAnalyticsView from "@/pages/dashboard/ui/views/dev/AppAnalyticsView";
import StudentQuizView from "@/pages/dashboard/ui/views/student/StudentQuizView";
import ErrorAnalyticsView from "@/pages/dashboard/ui/views/dev/ErrorAnalyticsView";
import ViewAllSurveys from "@/pages/dashboard/ui/views/admin/ViewAllSurveys";

export type SideBarItem = {
  id: string;
  icon: LucideIcon;
  name: string;
  title: string;
  description?: string;
  subheading: string;
  roles: UserRole[];
  dashboardView: ComponentType<{
    description?: string;
  }>;
};

export const ROLE_SELECT_CONFIG = {
  [UserRole.STUDENT]: [UserRole.STUDENT],
  [UserRole.INSTRUCTOR]: [UserRole.STUDENT, UserRole.INSTRUCTOR],
  [UserRole.ADMIN]: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN],
  [UserRole.DEV]: [
    UserRole.STUDENT,
    UserRole.INSTRUCTOR,
    UserRole.ADMIN,
    UserRole.DEV,
  ],
};

const STUDENT = [
  UserRole.STUDENT,
  UserRole.INSTRUCTOR,
  UserRole.ADMIN,
  UserRole.DEV,
];
const INSTRUCTOR = [UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.DEV];
const ADMIN = [UserRole.ADMIN, UserRole.DEV];
const DEV = [UserRole.DEV];

export const sidebarItems: SideBarItem[] = [
  {
    id: "user-stats",
    icon: Activity,
    name: "Statistics",
    title: "Activity Statistics",
    description:
      "View your learning progress, accuracy rates, and performance metrics.",
    subheading: "My Dashboard",
    roles: STUDENT,
    dashboardView: StudentStatsView,
  },
  {
    id: "user-classes",
    icon: BookOpenText,
    name: "Classes",
    title: "Class Information",
    description:
      "Explore your class portfolio and access detailed course information.",
    subheading: "My Dashboard",
    roles: STUDENT,
    dashboardView: StudentClassesView,
  },
  {
    id: "user-register-classes",
    icon: PenBoxIcon,
    name: "Register",
    title: "Class Registration",
    description:
      "Explore available learning opportunities and advance your academic goals.",
    subheading: "My Dashboard",
    roles: STUDENT,
    dashboardView: StudentRegisterClassView,
  },
  // {
  //   id: "user-logs",
  //   icon: FileText,
  //   name: "Logs",
  //   title: "Activity Details",
  //   subheading: "My Dashboard",
  //   roles: STUDENT,
  //   dashboardView: StudentLogsView,
  // },
  {
    id: "user-quiz",
    icon: ClipboardPenIcon,
    name: "Review",
    title: "Quiz",
    subheading: "My Dashboard",
    roles: STUDENT,
    dashboardView: StudentQuizView,
  },

  // Teaching
  {
    id: "instructor-stats",
    icon: BarChart3,
    name: "Class Statistics",
    title: "Student Performance Analytics",
    subheading: "Teaching",
    description: "Track and analyze student performance and progress.",
    roles: INSTRUCTOR,
    dashboardView: InstructorStatsView,
  },
  {
    id: "instructor-students",
    icon: Users,
    name: "Students",
    title: "Student Management",
    subheading: "Teaching",
    roles: INSTRUCTOR,
    dashboardView: InstructorStudentListView,
  },
  {
    id: "instructor-classes",
    icon: BookOpenText,
    name: "Classes",
    title: "Class Management",
    description:
      "Create new courses, monitor class progress, and manage your teaching portfolio.",
    subheading: "Teaching",
    roles: INSTRUCTOR,
    dashboardView: InstructorClassesView,
  },

  // Administration
  {
    id: "admin-users",
    icon: Users,
    name: "Manage Users",
    title: "User Administration",
    subheading: "Administration",
    roles: ADMIN,
    dashboardView: UsersAdministrationView,
  },
  {
    id: "admin-classes",
    icon: Settings,
    name: "Manage Classes",
    title: "Class Administration",
    subheading: "Administration",
    roles: ADMIN,
    dashboardView: ClassesAdministrationView,
  },
  {
    id: "admin-surveys",
    icon: FileText,
    name: "Surveys",
    title: "Survey Management",
    subheading: "Administration",
    roles: ADMIN,
    dashboardView: ViewAllSurveys,
  },

  // Development
  {
    id: "app-stats",
    icon: BarChart2,
    name: "App Stats",
    title: "Application Analytics",
    subheading: "Development",
    roles: DEV,
    dashboardView: AppAnalyticsView,
  },
  {
    id: "error-stats",
    icon: BugIcon,
    name: "Error Stats",
    title: "Error Statistics",
    subheading: "Development",
    description: "Monitor and manage application errors with ease.",
    roles: DEV,
    dashboardView: ErrorAnalyticsView,
  },
];
