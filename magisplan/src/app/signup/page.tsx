"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailAddress: email,
        password,
        firstName,
        middleName,
        lastName,
        contactNumber,
      }),
    });

    const data = await res.json();
    setMessage(data.error || data.message);
  }

  return (
    <form onSubmit={handleSignup}>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
      <input placeholder="Middle Name" value={middleName} onChange={e => setMiddleName(e.target.value)} />
      <input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
      <input placeholder="Contact Number" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
      <button type="submit">Sign Up</button>
      {message && <p>{message}</p>}
    </form>
  )
}