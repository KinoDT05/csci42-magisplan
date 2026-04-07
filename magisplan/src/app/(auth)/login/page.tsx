"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
        setError(data.error);
    }

      router.push("/moderator/create-project");
    
  }

  return (
      <div>
        <form onSubmit={handleLogin} className="p-8 w-96 space-y-4">
          <h2 className="text-2xl font-semibold text-center mb-4">
            Login
          </h2>

          <input className="input-field" placeholder="Your email" type="email" value={email} onChange={e => setEmail(e.target.value)}/>
          <input className="input-field" placeholder="Your password" type="password" value={password} onChange={e => setPassword(e.target.value)}/>

          <p className="mt-8">
            Don't have an account? <a href="/signup" className="text-[#0F5EA7]">Sign up here.</a>
          </p>
          <button type="submit" className="btn-primary">Login</button>

          {error && (
            <p className="text-center text-sm text-red-500">
              {error}
            </p>
          )}
        </form>
      </div>
  );
}