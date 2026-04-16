import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"

import { cn } from "@/lib/utils"

const PixelCheck = () => (
  <svg viewBox="0 0 16 15" fill="currentColor" shapeRendering="crispEdges" className="w-3 h-3">
    <rect x="1" y="5" width="3" height="3" />
    <rect x="3" y="7" width="3" height="3" />
    <rect x="5" y="9" width="3" height="3" />
    <rect x="7" y="7" width="3" height="3" />
    <rect x="9" y="5" width="3" height="3" />
    <rect x="11" y="3" width="3" height="3" />
  </svg>
);

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-5 w-5 shrink-0 items-center justify-center groove-border align-middle ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-card",
      className
    )}
    style={props.checked || props.defaultChecked ? { backgroundColor: '#fff' } : undefined}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center")}
      style={{ color: '#000' }}
    >
      <PixelCheck />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
