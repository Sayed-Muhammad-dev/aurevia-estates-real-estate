import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        tone === "success" && "bg-success/15 text-success",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "default" && "bg-foreground/6 text-foreground/80",
      )}
    >
      {children}
    </span>
  );
}
