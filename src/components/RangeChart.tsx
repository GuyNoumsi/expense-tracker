// components/RangeChart.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface RangeChartProps {
  data: { day: string; total_amount: string }[];
  isLoading: boolean;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const formatXAxis = (tickItem: string) => {
  // Format the date for the chart's X-axis based on the range size
  const date = new Date(tickItem);
  return format(date, "MMM d");
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow">
        <p className="text-sm text-gray-500">
          {format(new Date(label), "PPP")}
        </p>
        <p className="text-lg font-semibold text-blue-600">
          ${parseFloat(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function RangeChart({
  data,
  isLoading,
  startDate,
  endDate,
}: RangeChartProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Loading chart data...
          </p>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((d) => ({
    day: d.day,
    total_amount: parseFloat(d.total_amount),
  }));

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>
          Spending Trend from {startDate ? format(startDate, "PPP") : "..."} to{" "}
          {endDate ? format(endDate, "PPP") : "..."}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="total_amount"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
