import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import jwt from "jsonwebtoken";

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
    throw new Error("Token is not valid: " + error);
  }
}

// GET /api/expenses - Get expenses for a specific month and year
export async function GET(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const { data, error } = await supabase.rpc("get_expenses_by_month_year", {
      uid: userId,
      month,
      year,
    });

    if (error) {
      throw error;
    } else {
      return NextResponse.json(data);
    }
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Get expenses error:", error);
    if (errMsg.includes("authorization")) {
      return NextResponse.json({ error: errMsg }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to retrieve expenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    const { amount, description, category, created_at } = await request.json();

    const { data, error } = await supabase
      .from("expenses")
      .insert([{ amount, description, category, created_at, user_id: userId }])
      .select();

    if (error) {
      throw error;
    } else {
      return NextResponse.json(data[0], { status: 201 });
    }
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Get expenses error:", error);
    console.error("Create expense error:", error);
    if (errMsg.includes("authorization")) {
      return NextResponse.json({ error: errMsg }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to add expense" },
      { status: 500 }
    );
  }
}
