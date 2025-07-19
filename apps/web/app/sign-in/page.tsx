"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ModeToggle } from "../../components/mode-toggle";
import axios from "axios";
import { useAuth } from "../providers/authProvider";

export default function SignIn() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try { 
      const baseUrl = "http://localhost:3002";
      const response = await axios.post(`${baseUrl}/login`, {
        username,
        password,
      });
      console.log("response------------------", response);
      if (response.status === 200) {
        const token = response.data.token;
        const username = response.data.username;
        login(token);
        localStorage.setItem("username", username);
        setUsername(username);
        setIsLoading(false);
        router.push("/");
      }
    } catch (error) {   
      setIsLoading(false);
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/" className="font-bold">
            AI Draw
          </Link>
          <ModeToggle />
        </div>
      </header>
      <main className="grid flex-1 place-items-center">
        <div className="w-full max-w-md space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-muted-foreground">
              Enter your email below to sign in to your account
            </p>
          </div>
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-sm text-muted-foreground">
                Don't have an account?
              </span>
              <Link
                href="/sign-up"
                className="text-sm font-medium underline underline-offset-4 hover:text-primary"
              >
                Sign up
              </Link>
            </div>
            {error && <p className="text-red-500">{error}</p>}
          </div>
        </div>
      </main>
    </div>
  );
} 