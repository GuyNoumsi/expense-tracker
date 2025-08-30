import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "@/lib/db";

const jwtSecret = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  const { username, email, password } = await request.json();

  // Hash the password with a salt round of 10
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Insert new user
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, email, password_hash }])
    .select("id, username, email"); // return specific columns

  if (!error) {
    const newUser = data[0];
    // Create a JWT
    const token = jwt.sign({ userId: newUser.id }, jwtSecret, {
      expiresIn: "1h",
    });
    console.log("User created.");

    return NextResponse.json(
      { message: "User registered successfully", token, user: newUser },
      { status: 201 }
    );
  } else {
    console.error("Registration error:", error);

    if (error.code === "23505") {
      // PostgreSQL error code for unique constraint violation
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Server error during registration" },
      { status: 500 }
    );
  }
}
