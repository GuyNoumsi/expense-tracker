// components/ExpenseForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

interface ExpenseFormProps {
  onExpenseAdded: () => void;
  editingExpense: Expense | null;
  onEditComplete: () => void;
}

const hardcodedCategories = [
  "Groceries",
  "Food",
  "Rent",
  "Utilities",
  "Transportation",
  "Entertainment",
];

export default function ExpenseForm({
  onExpenseAdded,
  editingExpense,
  onEditComplete,
}: ExpenseFormProps) {
  const { token } = useAuth();
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const allCategories = [...hardcodedCategories, ...userCategories];
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchUserCategories();
  }, [token]);

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setCategory(editingExpense.category);
      setDate(parseISO(editingExpense.created_at));
    } else {
      setAmount("");
      setDescription("");
      setCategory("");
      setDate(new Date());
    }
  }, [editingExpense]);

  const fetchUserCategories = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/categories", {
        headers: { Authorization: token },
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      const fetchedCategories = await response.json();
      setUserCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories.");
    }
  };

  const handleAddCategory = async () => {
    if (!token) return;
    if (!newCategoryName) {
      toast.error("Category name cannot be empty.");
      return;
    }

    if (allCategories.includes(newCategoryName)) {
      toast.error("Category already exists.");
      return;
    }

    setIsAddingCategory(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add new category.");
      }

      toast.success("Category added successfully!");
      fetchUserCategories();
      setNewCategoryName("");
      setIsDialogOpen(false);
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Error adding category:", error);
      toast.error(errMsg);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (
    categoryName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevents the dropdown from closing immediately
    if (!token) return;

    // Prevent deleting a category that is currently selected
    if (category === categoryName) {
      toast.error("Cannot delete the currently selected category.");
      return;
    }

    const isConfirmed = confirm(
      `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`
    );
    if (!isConfirmed) return;

    try {
      const response = await fetch("/api/categories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ name: categoryName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category.");
      }

      toast.success("Category deleted successfully!");
      fetchUserCategories(); // Refresh the category list
      onExpenseAdded(); // Trigger a full data refresh on the main page
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Error deleting category:", error);
      toast.error(errMsg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);

    const expenseData = {
      amount: parseFloat(amount),
      description,
      category,
      created_at: date?.toISOString(),
    };

    try {
      let response;
      if (editingExpense) {
        response = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify(expenseData),
        });
      } else {
        response = await fetch("/api/expenses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify(expenseData),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (editingExpense) {
        toast.success("Expense updated successfully!");
        onEditComplete();
      } else {
        toast.success("Expense added successfully!");
        onExpenseAdded();
        setAmount("");
        setDescription("");
        setCategory("");
        setDate(new Date());
      }
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error("Failed to save expense. ");
      console.error("Error saving expense:", errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>
          {editingExpense ? "Update Expense" : "Add New Expense"}
        </CardTitle>
        <CardDescription>
          Enter the details of your daily expense.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 25.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g., Coffee and sandwich"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => {
                if (value === "add-new") {
                  setIsDialogOpen(true);
                } else {
                  setCategory(value);
                }
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {hardcodedCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                {userCategories.length > 0 && (
                  <>
                    <div className="p-2 text-xs font-semibold text-muted-foreground">
                      My Categories
                    </div>
                    {userCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center justify-between group">
                          <span>{cat}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteCategory(cat, e)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                <SelectItem value="add-new">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="h-4 w-4" />
                    Add new category...
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? editingExpense
                  ? "Updating..."
                  : "Adding..."
                : editingExpense
                ? "Update Expense"
                : "Add Expense"}
            </Button>
            {editingExpense && (
              <Button type="button" variant="outline" onClick={onEditComplete}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Enter a name for your new expense category.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g., Subscriptions"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={isAddingCategory}>
              {isAddingCategory ? "Adding..." : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
