import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "@/lib/db";

const jwtSecret = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  // Find the user by username
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username);

  if (!error) {
    if (data.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 400 }
      );
    }
    const user = data[0];

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 400 }
      );
    }

    // Passwords match, so create a JWT
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "1h" });

    return NextResponse.json({
      message: "Logged in successfully",
      token,
      user: { id: user.id, username: user.username },
    });
  } else {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Server error during login" },
      { status: 500 }
    );
  }
}
