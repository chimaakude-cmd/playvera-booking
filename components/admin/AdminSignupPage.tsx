"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/branding";
import { loginTestAccount } from "@/lib/auth";

export function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    loginTestAccount("admin");
    router.push("/admin/dashboard");
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#f6f7f9] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="desktop" href="/" />
        </div>
        <p className="mb-8 text-center text-sm text-zinc-500">
          Create platform admin account
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8"
        >
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Full name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-zinc-700">Password</span>
            <input
              type="password"
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </label>

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Create account
          </button>

          <p className="mt-4 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/admin/login"
              className="font-medium text-violet-700 hover:text-violet-900"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
