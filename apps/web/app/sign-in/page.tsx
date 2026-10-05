"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "../../components/auth-shell";
import { Button, FormError, Input, Label, Spinner } from "../../components/ui";
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
    setError("");
    
    try { 
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
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
        router.push("/dashboard");
      }
    } catch (error) {   
      setIsLoading(false);
      setError(
        axios.isAxiosError(error) && error.response
          ? "Incorrect username or password."
          : "Could not reach the server. Check your connection and try again."
      );
    }
  };

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Sign in to open your rooms."
      footer={{ prompt: "New to AIDraw?", href: "/sign-up", linkText: "Create an account" }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-username"
            disabled={isLoading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            required
          />
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Spinner className="h-4 w-4 border-primary-foreground/30 border-t-primary-foreground" label="Signing in…" />}
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
