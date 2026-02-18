import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
}

const SkeletonLoader = ({ className, lines = 3 }: SkeletonLoaderProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-muted animate-shimmer"
          style={{
            width: i === lines - 1 ? "60%" : "100%",
            backgroundImage:
              "linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 50%, hsl(var(--muted)) 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
