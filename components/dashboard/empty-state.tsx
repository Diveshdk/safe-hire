import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="h-16 w-16 rounded-2xl bg-[#F4F4F6] flex items-center justify-center mb-4 text-[#A1A1AA]">
        {icon}
      </div>
      <p className="font-semibold text-[#18181B]">{title}</p>
      {description && (
        <p className="text-sm text-[#71717A] mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
