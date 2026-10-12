"use client";

import { applicationRequest } from "@/lib/application";
import Link from "next/link";
import { useState } from "react";
import { isValidEmail } from "@/lib/forms";

import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    interest: "Buying",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="shell section">
      <div className="mx-auto max-w-xl rounded-[2.5rem] border border-line bg-panel p-8 shadow-float">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">
          Create account
        </p>
        <h1 className="mt-3 font-display text-5xl text-foreground">
          Start a tailored property journey.
        </h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const nextErrors: {
              name?: string;
              email?: string;
              password?: string;
            } = {};
            if (!form.name.trim()) nextErrors.name = "Full name is required.";
            if (!isValidEmail(form.email))
              nextErrors.email = "Enter a valid email address.";
            if (form.password.trim().length < 12)
              nextErrors.password = "Password must be at least 12 characters.";
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length > 0) {
              setSubmitted(false);
              return;
            }

            try {
              await applicationRequest("register", form);
              await applicationRequest("login", form);
              window.location.assign("/workspace");
            } catch (error) {
              setErrors({
                email:
                  error instanceof Error
                    ? error.message
                    : "Registration failed",
              });
              return;
            }
            setSubmitted(true);
            setForm({ name: "", email: "", password: "", interest: "Buying" });
          }}
          className="mt-8 space-y-4"
        >
          <label className="space-y-2 text-sm text-muted">
            <span>Full name</span>
            <input
              value={form.name}
              onChange={(e) => {
                setForm((c) => ({ ...c, name: e.target.value }));
                setErrors((current) => ({ ...current, name: undefined }));
                if (submitted) setSubmitted(false);
              }}
              className="field"
            />
            {errors.name ? (
              <span className="text-xs text-danger">{errors.name}</span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((c) => ({ ...c, email: e.target.value }));
                setErrors((current) => ({ ...current, email: undefined }));
                if (submitted) setSubmitted(false);
              }}
              className="field"
            />
            {errors.email ? (
              <span className="text-xs text-danger">{errors.email}</span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => {
                setForm((c) => ({ ...c, password: e.target.value }));
                setErrors((current) => ({ ...current, password: undefined }));
                if (submitted) setSubmitted(false);
              }}
              className="field"
            />
            {errors.password ? (
              <span className="text-xs text-danger">{errors.password}</span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Primary interest</span>
            <select
              value={form.interest}
              onChange={(e) =>
                setForm((c) => ({ ...c, interest: e.target.value }))
              }
              className="field"
            >
              <option>Buying</option>
              <option>Renting</option>
              <option>Selling</option>
              <option>Investing</option>
            </select>
          </label>
          {submitted ? (
            <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              Account created successfully. Your profile is ready for saved
              homes and bookings.
            </div>
          ) : null}
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-5 text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="text-accent">
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
