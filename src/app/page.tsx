// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import CategoryReport from "@/components/CategoryReport";
import RangeChart from "@/components/RangeChart";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Download,
  TrendingUp,
  BarChart3,
  Plus,
  LogOut,
  User,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { HashLoader } from "react-spinners";

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

interface ReportData {
  category: string;
  total_amount: string;
}

interface ChartData {
  day: string;
  total_amount: string;
}

export default function Home() {
  const { token, isLoading, logout, user } = useAuth();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [dataIsLoading, setDataIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const quickSelects = [
    {
      label: "Last 7 Days",
      range: { from: subDays(new Date(), 6), to: new Date() },
    },
    {
      label: "This Month",
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    },
    {
      label: "This Year",
      range: { from: startOfYear(new Date()), to: endOfYear(new Date()) },
    },
  ];

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
      return;
    }
    if (token && dateRange?.from && dateRange?.to) {
      fetchData();
    }
  }, [dateRange, token, isLoading, router]);

  const fetchData = async () => {
    if (!token || !dateRange?.from || !dateRange?.to) return;

    setDataIsLoading(true);
    const formattedStartDate = format(dateRange.from, "yyyy-MM-dd");
    const formattedEndDate = format(dateRange.to, "yyyy-MM-dd");

    try {
      const headers = { Authorization: token };

      const [expensesResponse, reportResponse, chartResponse] =
        await Promise.all([
          fetch(
            `/api/expenses/range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
            { headers }
          ),
          fetch(
            `/api/reports/range-category-summary?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
            { headers }
          ),
          fetch(
            `/api/reports/range-daily-summary?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
            { headers }
          ),
        ]);

      if (!expensesResponse.ok) throw new Error("Failed to fetch expenses");
      setExpenses(await expensesResponse.json());

      if (!reportResponse.ok) throw new Error("Failed to fetch report data");
      setReportData(await reportResponse.json());

      if (!chartResponse.ok) throw new Error("Failed to fetch chart data");
      setChartData(await chartResponse.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setDataIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!expenses.length) {
      alert("No expenses to download.");
      return;
    }

    // Exclude 'id' and 'created_at' from the headers
    const headers = ["amount", "description", "category"];

    // Format the expenses data to match the new headers
    const csvRows = expenses.map((expense) =>
      headers
        .map((header) => {
          const value = (expense as any)[header];
          // Simple double-quote for values that contain commas
          return `"${value}"`;
        })
        .join(",")
    );

    const csvString = [headers.join(","), ...csvRows].join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    // Dynamic file name based on the date range
    const formattedStartDate = dateRange?.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : "start";
    const formattedEndDate = dateRange?.to
      ? format(dateRange.to, "yyyy-MM-dd")
      : "end";
    link.setAttribute(
      "download",
      `expenses-${formattedStartDate}-to-${formattedEndDate}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleQuickSelect = (range: DateRange) => {
    setDateRange(range);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const onEditComplete = () => {
    setEditingExpense(null);
    fetchData();
  };

  const getExpenseListTitle = () => {
    if (!dateRange?.from || !dateRange?.to) {
      return "Expense List";
    }
    const formattedFrom = format(dateRange.from, "MMM d, yyyy");
    const formattedTo = format(dateRange.to, "MMM d, yyyy");
    if (formattedFrom === formattedTo) {
      return `Expenses for ${formattedFrom}`;
    }
    return `Expenses from ${formattedFrom} to ${formattedTo}`;
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <div className="text-center">
          <HashLoader color="#8B5CF6" size={50} />
          <p className="text-white/70 mt-4 text-lg">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">ExpenseTracker</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/70">
                <User className="w-4 h-4" />
                <span className="text-sm">{user?.username || "User"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-white">
                  Date Range:
                </h2>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-[300px] justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                        !dateRange && "text-white/50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-white/95 backdrop-blur-xl border-white/20"
                    align="start"
                  >
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2">
                {quickSelects.map((option) => (
                  <Button
                    key={option.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(option.range)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {option.label}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={handleDownloadCSV}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Add Expense Form */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Add New Expense
                </h3>
              </div>
              <ExpenseForm
                onExpenseAdded={fetchData}
                editingExpense={editingExpense}
                onEditComplete={onEditComplete}
              />
            </div>

            {/* Expense List */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {getExpenseListTitle()}
                </h3>
              </div>
              <ExpenseList
                expenses={expenses}
                isLoading={dataIsLoading}
                onExpenseDeleted={fetchData}
                onEdit={handleEdit}
                title={getExpenseListTitle()}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Category Report */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Category Breakdown
                </h3>
              </div>
              <CategoryReport
                reportData={reportData}
                isLoading={dataIsLoading}
              />
            </div>

            {/* Range Chart */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Spending Trends
                </h3>
              </div>
              <RangeChart
                data={chartData}
                isLoading={dataIsLoading}
                startDate={dateRange?.from}
                endDate={dateRange?.to}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
