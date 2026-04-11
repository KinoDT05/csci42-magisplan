"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const router = useRouter();
    const [userID, setUserID] = useState<string>("");

    const [form, setForm] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        contactNumber: "",
        username: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data, error } = await supabase
                .from("users")
                .select("firstName, middleName, lastName, contactNumber, username, userID")
                .eq("username", username)
                .maybeSingle();

            if (data) {
                setUserID(data.userID); 
                setForm(data);
            }
        };

        fetchUser();
    }, [username]);

    const handleChange = (e: any) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async () => {
        console.log("userID:", userID);
        console.log("form:", form);

        const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("userID")
            .eq("username", form.username)
            .maybeSingle();

        if (existingUser && existingUser.userID !== userID) {
            alert("Username already taken!");
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .update({
            firstName: form.firstName,
            lastName: form.lastName,
            middleName: form.middleName,
            contactNumber: form.contactNumber,
            username: form.username,
            })
            .eq("userID", userID);
        
        
        console.log("update error:", error);

        if (error) {
            alert("Update failed");
        } else {
            alert("Updated successfully");
            router.push(`/profile/${form.username}`);
        }
    };
    

  return (
    <div className="p-6 max-w-xl mx-auto bg-[var(--bg-gray)] p-10">
      <h1 className="text-5xl font-semibold mb-6 text-[var(--main)]">Edit Profile</h1>

      <div className="flex flex-col gap-4">
        <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" className="input-field"/>
        <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Middle Name" className="input-field " />
        <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" className="input-field" />
        <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Contact Number" className="input-field"/>
        <input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="input-field"/>

        <div className="flex">
            <button onClick={() => router.back()} className="font-semibold cursor-pointer">Cancel</button>

            <button onClick={handleSubmit} disabled={loading} className="btn-primary ml-auto">
                {loading ? "Saving..." : "Save Changes"}
            </button>
        </div>
        

        
      </div>
    </div>
  );
}