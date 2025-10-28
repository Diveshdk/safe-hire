import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  variant?: "default" | "green" | "outline"
}

export function VerifiedBadge({ 
  size = "sm", 
  showIcon = true, 
  variant = "green" 
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  }

  const getVariantClasses = () => {
    switch (variant) {
      case "green":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
      case "outline":
        return "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
      default:
        return ""
    }
  }

  return (
    <Badge 
      className={`${sizeClasses[size]} ${getVariantClasses()} inline-flex items-center gap-1`}
      variant={variant === "outline" ? "outline" : "secondary"}
    >
      {showIcon && <CheckCircle className={iconSizes[size]} />}
      Verified
    </Badge>
  )
}
