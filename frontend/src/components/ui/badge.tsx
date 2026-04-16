import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClass = 
    variant === 'success' ? 'terminal-tag-green'
    : variant === 'destructive' ? 'terminal-tag-red'
    : variant === 'warning' ? 'terminal-tag-orange'
    : variant === 'secondary' ? 'terminal-tag-neutral'
    : variant === 'outline' ? 'terminal-tag-neutral'
    : 'terminal-tag-neutral'
  
  return (
    <div className={cn('terminal-tag', variantClass, className)} {...props} />
  )
}

export { Badge }
