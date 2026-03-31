import { redirect } from "next/navigation"

// Employer dashboard redirects to the employee dashboard
// since they share the same features
export default function EmployerDashboardPage() {
  redirect("/dashboard/employee")
}
