import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import supabase from "@/lib/db";

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
    throw new Error("Token is not valid");
  }
}

// GET /api/reports/range-daily-summary - Get daily spending summary for a date range
export async function GET(request: NextRequest) {
  try {
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

    const { data, error } = await supabase.rpc("get_expenses_summary", {
      uid: userId,
      start_date: startDate,
      end_date: endDate,
    });

    if (error) {
      throw error;
    } else {
      console.log("Expense summary:", data);
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error("Get daily summary error:", error);
    if (error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to retrieve daily summary" },
      { status: 500 }
    );
  }
}
