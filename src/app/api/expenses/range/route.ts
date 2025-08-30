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

// GET /api/expenses/range - Get expenses for a custom date range
export async function GET(request: NextRequest) {
  const userId = verifyToken(request);
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, description, category, created_at")
    .eq("user_id", userId)
    .gte("created_at", startDate) // >= startDate
    .lte("created_at", endDate) // <= endDate
    .order("created_at", { ascending: false });

  if (!error) {
    return NextResponse.json(data);
  } else {
    console.error("Get expenses range error:", error);
    if (error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to retrieve expenses for the date range" },
      { status: 500 }
    );
  }
}
