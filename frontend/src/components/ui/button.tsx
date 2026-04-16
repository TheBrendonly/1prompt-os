import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'primary' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const variantClass = variant === 'primary' 
      ? 'groove-btn groove-btn-primary'
      : variant === 'destructive'
      ? 'groove-btn groove-btn-destructive'
      : variant === 'ghost'
      ? 'groove-btn !border-transparent !bg-transparent hover:!bg-accent'
      : variant === 'link'
      ? 'groove-btn !border-transparent !bg-transparent underline-offset-4 hover:underline'
      : 'groove-btn'
    
    const sizeClass = size === 'icon' ? '!w-8 !p-0 !px-0' : ''

    return (
      <Comp
        className={cn(variantClass, sizeClass, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// Kept for backward compatibility with alert-dialog, calendar, pagination
import { cva } from "class-variance-authority"
const buttonVariants = cva("groove-btn", {
  variants: {
    variant: {
      default: "",
      primary: "groove-btn-primary",
      destructive: "groove-btn-destructive",
      outline: "",
      secondary: "",
      ghost: "!border-transparent !bg-transparent hover:!bg-accent",
      link: "!border-transparent !bg-transparent underline-offset-4 hover:underline",
    },
    size: {
      default: "",
      sm: "",
      lg: "",
      icon: "!w-8 !p-0 !px-0",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
})

export { Button, buttonVariants }
