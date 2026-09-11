import { cn } from "@/lib/utils";

interface BrandLockupProps {
  /** "sm" for the dark sidebar rail, "lg" for light auth cards */
  size?: "sm" | "lg";
  className?: string;
}

export function BrandLockup({ size = "lg", className }: BrandLockupProps) {
  const isSm = size === "sm";

  return (
    <div className={cn("flex flex-col leading-none", isSm ? "items-start" : "items-center", className)}>
      <span
        className={cn(
          "font-heading font-bold tracking-tight",
          isSm ? "text-base text-sidebar-foreground" : "text-3xl text-zinc-900"
        )}
      >
        TATA <span className="font-normal">CLiQ</span>
      </span>
      <span
        className={cn(
          "font-semibold uppercase bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent",
          isSm ? "text-[9px] tracking-wider mt-0.5" : "text-xs tracking-widest mt-1"
        )}
      >
        Seller Center
      </span>
    </div>
  );
}
