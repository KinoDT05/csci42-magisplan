import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Authentication",
  description: "login and signup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex">

            {/*app name + desc*/}
            <div className="w-1/2 bg-[var(--main)] text-white flex flex-col justify-center p-12 rounded-2xl text-start">
                <h1 className="text-5xl font-bold mb-4 ml-10">
                    Welcome to
                    MagisPlan!
                </h1>
                <p className="text-md mx-10 mt-7">
                    MagisPlan is a digital project management planner designed for students, workers, and project managers who require a centralized platform for efficiently managing tasks across different individual and organizational projects. 
                    The platform centralizes task tracking, scheduling, managing essential documents, and team collaboration features, all within a single unified workspace.
                    <br></br>
                    <br></br>
                    This is brought to you by Jam Abarico, Francine Benito, Kino De Torres, Axel Fang, and Mady Young.
                </p>
            </div>

            {/*log in essentials*/}
            <div className="w-1/2 flex justify-center items-center text-center">
                {children}
            </div>

        </div>
      </body>
    </html>
  );
}
