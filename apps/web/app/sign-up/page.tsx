"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "../../components/auth-shell";
import { Button, FormError, Input, Label, Spinner } from "../../components/ui";
import axios from "axios";
import { useAuth } from "../providers/authProvider";

export default function SignUp() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
    console.log("Aa", baseUrl);
    try {
      const response = await axios.post(`${baseUrl}/signup`, {
        username: name,
        password,
      });

      const token = response.data.token;
      login(token);
      localStorage.setItem("username", name);
      console.log("Response", response);
      if (response.status === 200) {
        setIsLoading(false);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setIsLoading(false);
      setError(
        axios.isAxiosError(error) && error.response
          ? "Could not create the account. The username may already be taken."
          : "Could not reach the server. Check your connection and try again."
      );
    }
  };

  return (
    <AuthShell
      title="Create an account"
      description="Pick a username and password to start drawing."
      footer={{ prompt: "Already have an account?", href: "/sign-in", linkText: "Sign in" }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Username</Label>
          <Input
            id="name"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            required
          />
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Spinner className="h-4 w-4 border-primary-foreground/30 border-t-primary-foreground" label="Creating account…" />}
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
