"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditProfilePage() {
    const params = useParams();
    const usernameParam = params.username as string;
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
          try {
            console.log("[EditProfilePage] route username param:", usernameParam);

            const {
              data: { user: authUser },
              error: authError,
            } = await supabase.auth.getUser();

            console.log("[EditProfilePage] authUser:", authUser);
            console.log("[EditProfilePage] authError:", authError);

            if (authError || !authUser) {
              console.error("[EditProfilePage] User is not logged in");
              alert("You must be logged in.");
              router.push("/login");
              return;
            }

            setUserID(authUser.id);
            console.log("[EditProfilePage] auth userID:", authUser.id);

            const { data, error } = await supabase
              .from("users")
              .select("firstName, middleName, lastName, contactNumber, username, userID")
              .eq("userID", authUser.id)
              .maybeSingle();

            console.log("[EditProfilePage] fetched DB user:", data);
            console.log("[EditProfilePage] fetched DB user error:", error);

            if (error) {
              console.error("[EditProfilePage] fetch user error:", error);
              return;
            }

            if (!data) {
              console.error("[EditProfilePage] No user row found in users table");
              return;
            }

            setForm({
              firstName: data.firstName ?? "",
              middleName: data.middleName ?? "",
              lastName: data.lastName ?? "",
              contactNumber: data.contactNumber ?? "",
              username: data.username ?? "",
            });
          } catch (error){
            console.error("[EditProfilePage] unexpected error:", error);
          }
        };

        fetchUser();
    }, [router, usernameParam]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("[EditProfilePage] field changed:", e.target.name, e.target.value);

      setForm((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    };

    const handleSubmit = async () => {
      try {
        setLoading(true);

        console.log("[EditProfilePage] submitting userID:", userID);
        console.log("[EditProfilePage] submitting form:", form);

        if (!userID) {
          alert("User ID is missing.");
          return;
        }

        const response = await fetch(`/api/profile/${userID}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const result = await response.json();

        console.log("[EditProfilePage] PATCH status:", response.status);
        console.log("[EditProfilePage] PATCH result:", result);

        if (!response.ok) {
          alert(result.error || "Update failed");
          return;
        }

        alert("Updated successfully");

        const updatedUsername = result.user?.username || form.username;
        router.push(`/profile/${updatedUsername}`);
      } catch (error) {
        console.error("[EditProfilePage] submit error:", error);
        alert("Something went wrong.");
      } finally {
        setLoading(false);
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