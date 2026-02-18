import { cn } from "@/lib/utils";

const StatusBadge = ({ status }: { status: "confirmed" | "pending" | "failed" }) => {
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium",
        status === "confirmed" && "status-confirmed",
        status === "pending" && "status-pending",
        status === "failed" && "status-failed"
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
