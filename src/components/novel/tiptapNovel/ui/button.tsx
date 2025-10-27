import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        // 默认
        default: "bg-primary text-primary-foreground text-white hover:bg-primary-hover",
        // 危险
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // 边框
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // 次要
        secondary: "bg-secondary text-secondary-foreground hover:bg-gray-400/20",
        // 幽灵
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // 亮色
        light: "bg-white text-black hover:bg-gray-100",
        // 链接
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "rounded-md px-1.5 py-1.5 text-base/4",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
