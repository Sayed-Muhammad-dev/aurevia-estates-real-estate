"use client";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    reduced = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
