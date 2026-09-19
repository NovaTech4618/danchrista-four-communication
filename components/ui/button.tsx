"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "outline" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg" | "icon-sm" | "icon-md" | "icon-lg";
  nativeButton?: boolean;
  /** Render the button styles on its child element instead of a native button. */
  asChild?: boolean;
  render?: React.ReactElement<{ className?: string; children?: React.ReactNode }>;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-500/30",
  secondary: "bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-500/30",
  glass: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950",
  outline: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950",
  destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-rose-500/30",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs font-semibold",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  "icon-sm": "size-8 p-0",
  "icon-md": "size-9 p-0",
  "icon-lg": "size-10 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, nativeButton = true, asChild = false, render, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 rounded-lg font-manrope font-semibold tracking-tight transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    const content = <span className="flex items-center justify-center gap-2">{children}</span>;

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(classes, (children.props as { className?: string }).className),
        children: content,
      } as Partial<React.HTMLAttributes<HTMLElement>>);
    }

    if (render && !nativeButton) {
      return React.cloneElement(render, {
        className: cn(classes, render.props.className),
        children: content,
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
