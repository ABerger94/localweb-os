import { cn } from "@/lib/utils";

const statusColorMap = {
  // Invoice statuses
  Pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  Paid: "bg-green-100 text-green-800 border border-green-300",
  Overdue: "bg-red-100 text-red-800 border border-red-300",
  Cancelled: "bg-gray-100 text-gray-800 border border-gray-300",
  
  // Project statuses
  "Not Started": "bg-gray-100 text-gray-800 border border-gray-300",
  "In Progress": "bg-blue-100 text-blue-800 border border-blue-300",
  Review: "bg-purple-100 text-purple-800 border border-purple-300",
  Approved: "bg-green-100 text-green-800 border border-green-300",
  Delivered: "bg-green-100 text-green-800 border border-green-300",
  
  // Client statuses
  Lead: "bg-orange-100 text-orange-800 border border-orange-300",
  Active: "bg-green-100 text-green-800 border border-green-300",
  Paused: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  Churned: "bg-red-100 text-red-800 border border-red-300",
  
  // Retainer statuses
  Open: "bg-blue-100 text-blue-800 border border-blue-300",
  "In Progress": "bg-blue-100 text-blue-800 border border-blue-300",
  Resolved: "bg-green-100 text-green-800 border border-green-300",
  Closed: "bg-gray-100 text-gray-800 border border-gray-300",
  
  // Pipeline stages
  Prospect: "bg-gray-100 text-gray-800 border border-gray-300",
  "Mockup Sent": "bg-blue-100 text-blue-800 border border-blue-300",
  "Pitch Meeting": "bg-purple-100 text-purple-800 border border-purple-300",
  Onboarding: "bg-orange-100 text-orange-800 border border-orange-300",
  "Active Retainer": "bg-green-100 text-green-800 border border-green-300",
  
  // Ticket priorities
  Low: "bg-gray-100 text-gray-800 border border-gray-300",
  Medium: "bg-blue-100 text-blue-800 border border-blue-300",
  High: "bg-orange-100 text-orange-800 border border-orange-300",
  Critical: "bg-red-100 text-red-800 border border-red-300",
  
  // Wireframe & Design statuses
  Draft: "bg-gray-100 text-gray-800 border border-gray-300",
  "In Review": "bg-purple-100 text-purple-800 border border-purple-300",
  Published: "bg-green-100 text-green-800 border border-green-300",
};

export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusColorMap[status] || "bg-gray-100 text-gray-800 border border-gray-300",
        className
      )}
    >
      {status}
    </span>
  );
}