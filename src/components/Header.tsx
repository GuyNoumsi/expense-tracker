// components/Header.tsx
"use client";

import { useAuth } from "../../context/AuthContext";
import { Button } from "./ui/button";
import Link from "next/link";
import { LogOut } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          💰 My Expenses
        </Link>
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600">
              Welcome, {user.username}!
            </span>
            <Button variant="ghost" onClick={logout} className="text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
