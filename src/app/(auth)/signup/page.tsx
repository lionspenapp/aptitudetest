"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await fetch("/api/init-subscription", { method: "POST" });
    }

    router.push("/setup");
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="font-serif text-3xl text-lapis-dark mb-2">Create Account</h1>
        <p className="text-slate-muted mb-6">Start your InScribe mastery journey</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-slate-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-gold-dark hover:text-gold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
