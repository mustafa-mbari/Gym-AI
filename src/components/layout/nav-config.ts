import {
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  LineChart,
  Settings,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  /** Show in the mobile bottom navigation. */
  mobile?: boolean;
}

/** Primary navigation, shared by the desktop sidebar and mobile bottom bar. */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    mobileLabel: "Home",
    icon: LayoutDashboard,
    mobile: true,
  },
  {
    href: "/plan",
    label: "My Plan",
    mobileLabel: "Plan",
    icon: ClipboardList,
    mobile: true,
  },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  {
    href: "/workouts",
    label: "Workouts",
    mobileLabel: "Workout",
    icon: Dumbbell,
    mobile: true,
  },
  {
    href: "/progress",
    label: "Progress",
    mobileLabel: "Progress",
    icon: LineChart,
    mobile: true,
  },
  { href: "/equipment", label: "Equipment", icon: Boxes },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  {
    href: "/settings",
    label: "Settings",
    mobileLabel: "Profile",
    icon: Settings,
    mobile: true,
  },
];

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) => i.mobile);

export { User };
