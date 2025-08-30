import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import jwt from "jsonwebtoken";
import { PostgrestError } from "@supabase/supabase-js";

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

// GET /api/categories - Get categories for a logged-in user
export async function GET(request: NextRequest) {
  try {
    const userId = verifyToken(request);

    const { data, error } = await supabase
      .from("categories")
      .select("name")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (!error) {
      const categories = data.map((row) => row.name);
      return NextResponse.json(categories);
    } else {
      throw error;
    }
  } catch (error) {
    const errMsg =
      error instanceof PostgrestError
        ? error.message
        : "An unknown error occurred.";
    console.error("Get categories error:", error);
    if (errMsg.includes("authorization")) {
      return NextResponse.json({ error: errMsg }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to retrieve categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Add a new category for a logged-in user
export async function POST(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, user_id: userId }])
      .select("name");

    if (!error) {
      return NextResponse.json(data[0], { status: 201 });
    } else {
      throw error;
    }
  } catch (error) {
    const errMsg =
      error instanceof PostgrestError
        ? error.message
        : "An unknown error occurred.";
    console.error("Add category error:", error);
    if (errMsg.includes("authorization")) {
      return NextResponse.json({ error: errMsg }, { status: 401 });
    }
    if (error instanceof PostgrestError && error.code === "23505") {
      // PostgreSQL unique violation error code
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories - Delete a category
export async function DELETE(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("name", name)
      .eq("user_id", userId)
      .select();

    if (!error) {
      if (data.length === 0) {
        return NextResponse.json(
          {
            error:
              "Category not found or you do not have permission to delete it.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: "Category deleted successfully" });
    } else {
      throw error;
    }
  } catch (error) {
    const errMsg =
      error instanceof PostgrestError
        ? error.message
        : "An unknown error occurred.";
    console.error("Delete category error:", error);
    if (errMsg.includes("authorization")) {
      return NextResponse.json({ error: errMsg }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
