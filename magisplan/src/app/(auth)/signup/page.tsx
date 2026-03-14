"use client";

import { useState } from "react";

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
    <div>

      

      {/*sign in essentials*/}
        <form onSubmit={handleSignup} className="p-8 w-96 space-y-4">
          <h2 className="text-2xl font-semibold text-center mb-4">
            Sign Up
          </h2>

          <input className="input-field" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)}/>
          <input className="input-field" placeholder="Your first name" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <input className="input-field" placeholder="Your middle name" value={middleName} onChange={e => setMiddleName(e.target.value)} />
          <input className="input-field" placeholder="Your last name" value={lastName} onChange={e => setLastName(e.target.value)} />
          <input className="input-field" placeholder="Your contact number" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
          <input className="input-field" placeholder="Create password" type="password" value={password} onChange={e => setPassword(e.target.value)} />

          <p className="mt-8">
            Already have an account? <a href="/login" className="text-[#0F5EA7]">Login here.</a>
          </p>
          <button type="submit" className="btn-primary">Sign Up</button>

          {message && (
            <p className="text-center text-sm text-red-500">
              {message}
            </p>
          )}
        </form>

    </div>
  );

}