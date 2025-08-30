// components/ChartViewSelector.tsx
"use client";

import { Button } from "@/components/ui/button";

interface ChartViewSelectorProps {
  currentView: "weekly" | "monthly" | "yearly";
  onViewChange: (view: "weekly" | "monthly" | "yearly") => void;
}

export default function ChartViewSelector({
  currentView,
  onViewChange,
}: ChartViewSelectorProps) {
  return (
    <div className="flex space-x-2">
      <Button
        onClick={() => onViewChange("weekly")}
        variant={currentView === "weekly" ? "default" : "outline"}
      >
        Weekly
      </Button>
      <Button
        onClick={() => onViewChange("monthly")}
        variant={currentView === "monthly" ? "default" : "outline"}
      >
        Monthly
      </Button>
      <Button
        onClick={() => onViewChange("yearly")}
        variant={currentView === "yearly" ? "default" : "outline"}
      >
        Yearly
      </Button>
    </div>
  );
}
