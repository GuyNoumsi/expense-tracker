"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ReportData {
  category: string;
  total_amount: string;
}

interface CategoryReportProps {
  reportData: ReportData[];
  isLoading: boolean;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF005E",
];

export default function CategoryReport({
  reportData,
  isLoading,
}: CategoryReportProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Loading report...</p>
        </CardContent>
      </Card>
    );
  }

  const formattedData = reportData.map((item) => ({
    ...item,
    total_amount: parseFloat(item.total_amount),
  }));

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                dataKey="total_amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={({ name, percent }) => {
                  const pct = percent ?? 0;
                  return `${name} ${(pct * 100).toFixed(0)}%`;
                }}
              >
                {formattedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground">
            No data to generate a report.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
