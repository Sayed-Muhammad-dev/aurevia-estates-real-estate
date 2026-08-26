import Link from "next/link";
import { cn } from "@/lib/utils";

const baseClasses =
  "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-accent text-slate-950 shadow-lg shadow-accent/20 hover:-translate-y-0.5 hover:bg-accent/90",
  secondary: "border border-line bg-panel text-foreground hover:border-accent/40 hover:bg-accent/5",
  ghost: "text-foreground hover:bg-foreground/5",
};

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variants;
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  disabled?: boolean;
}

export function Button({
  children,
  className,
  variant = "primary",
  href,
  type = "button",
  onClick,
  disabled,
}: ButtonProps) {
  const classes = cn(baseClasses, variants[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
