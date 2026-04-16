import { NavLink as RouterNavLink, NavLinkProps, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNavigationGuard } from "@/contexts/NavigationGuardContext";
import { useCallback } from "react";

interface CustomNavLinkProps extends NavLinkProps {
  activeClassName?: string;
}

export function NavLink({ className, activeClassName, to, onClick, ...props }: CustomNavLinkProps) {
  const { tryNavigate } = useNavigationGuard();
  const navigate = useNavigate();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onClick) onClick(e as any);
    
    const target = typeof to === 'string' ? to : `${(to as any).pathname || ''}`;
    
    const allowed = tryNavigate(() => {
      navigate(to);
    });
    // If allowed, navigate immediately
    if (allowed) {
      navigate(to);
    }
    // If not allowed, the guard will call navigate(to) when user confirms
  }, [tryNavigate, navigate, to, onClick]);

  return (
    <RouterNavLink
      {...props}
      to={to}
      onClick={handleClick}
      className={({ isActive }) =>
        cn(
          className,
          isActive && activeClassName
        )
      }
    />
  );
}
