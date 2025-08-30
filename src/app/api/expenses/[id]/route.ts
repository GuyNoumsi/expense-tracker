import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import jwt from "jsonwebtoken";

type ExpenseRouteContext = { params: { id: string } };
const jwtSecret = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    throw new Error("No token, authorization denied");
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    return decoded.userId;
  } catch (error) {
    throw new Error(`Token is not valid: ${error}`);
  }
}

// PUT /api/expenses/[id] - Update an expense
export async function PUT(request: NextRequest, context: unknown) {
  const { id } = (context as ExpenseRouteContext).params;
  const userId = verifyToken(request);
  const expenseId = parseInt(id);

  const { amount, description, category, created_at } = await request.json();

  const { data, error } = await supabase
    .from("expenses")
    .update({ amount, description, category, created_at })
    .eq("id", expenseId)
    .eq("user_id", userId)
    .select();

  if (!error) {
    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          error: "Expense not found or you do not have permission to edit it.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(data[0]);
  }

  console.error("Update expense error:", error);
  if (error.message.includes("authorization")) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Failed to update expense" },
    { status: 500 }
  );
}

// DELETE /api/expenses/[id] - Delete an expense
export async function DELETE(request: NextRequest, context: unknown) {
  const { id } = (context as ExpenseRouteContext).params;
  const userId = verifyToken(request);
  const expenseId = parseInt(id);

  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", userId)
    .select();

  if (!error) {
    if (data.length === 0) {
      return NextResponse.json(
        { error: "Expense not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Expense deleted successfully" });
  } else {
    console.error("Delete expense error:", error);
    if (error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
