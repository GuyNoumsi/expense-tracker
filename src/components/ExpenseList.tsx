// components/ExpenseList.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Expense } from "@/app/page";

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  onExpenseDeleted: () => void;
  onEdit: (expense: Expense) => void;
  title: string;
}

export default function ExpenseList({
  expenses,
  isLoading,
  onExpenseDeleted,
  onEdit,
  title,
}: ExpenseListProps) {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!token) return;

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }
      toast.success("Expense deleted successfully!");
      onExpenseDeleted();
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error("Failed to delete expense. ");
      console.error("Error deleting expense:", errMsg);
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Loading expenses...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    $
                    {typeof expense.amount == "string"
                      ? expense.amount
                      : expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(expense)}
                      disabled={isDeleting === expense.id}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                      disabled={isDeleting === expense.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground">
            No expenses added yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
