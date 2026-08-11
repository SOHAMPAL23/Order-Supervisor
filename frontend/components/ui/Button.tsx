"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses = {
  primary:
    "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 shadow-sm shadow-indigo-500/20",
  secondary:
    "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60",
  danger:
    "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30",
  ghost: "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200",
  outline:
    "bg-transparent hover:bg-zinc-800 text-zinc-300 border border-zinc-700",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      icon,
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg
          transition-all duration-150 focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
          focus-visible:ring-offset-zinc-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
