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
    <div className="min-h-screen flex">

      {/*app name + desc*/}
      <div className="w-1/2 bg-[var(--main)] text-white flex flex-col justify-center p-12 rounded-2xl text-start">
        <h1 className="text-5xl font-bold mb-4 ml-10">
          Welcome to
          MagisPlan!
        </h1>
        <p className="text-md mx-10">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>

      {/*sign in essentials*/}
      <div className="w-1/2 flex justify-center items-center text-center">
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
            Already have an account? Log in here.
          </p>
          <button type="submit" className="btn-primary">Sign Up</button>

          {message && (
            <p className="text-center text-sm text-red-500">
              {message}
            </p>
          )}
        </form>
      </div>

    </div>
  );

}