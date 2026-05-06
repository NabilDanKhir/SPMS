import { validateAttendance } from "@/lib/attendance";
import AttendanceDashboard from '@/components/attendance/AttendanceDashboard'

export default function AdminAttendancePage() {
  return <AttendanceDashboard sysRole="admin" />
}