"use client";

import Link from "next/link";
import { useState } from "react";
import { isValidEmail } from "@/lib/forms";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="shell section">
      <div className="mx-auto max-w-xl rounded-[2.5rem] border border-line bg-panel p-8 shadow-float">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Client login</p>
        <h1 className="mt-3 font-display text-5xl text-foreground">Access saved homes, tours, and updates.</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors: { email?: string; password?: string } = {};
            if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address.";
            if (password.trim().length < 8) nextErrors.password = "Password must be at least 8 characters.";
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length > 0) {
              setSubmitted(false);
              return;
            }

            setSubmitted(true);
            showToast("Signed in", "Your client dashboard session has been opened.");
            setEmail("");
            setPassword("");
          }}
          className="mt-8 space-y-4"
        >
          <label className="space-y-2 text-sm text-muted">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
                if (submitted) setSubmitted(false);
              }}
              className="field"
            />
            {errors.email ? <span className="text-xs text-danger">{errors.email}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
                if (submitted) setSubmitted(false);
              }}
              className="field"
            />
            {errors.password ? <span className="text-xs text-danger">{errors.password}</span> : null}
          </label>
          {submitted ? (
            <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              Sign-in validation passed. Client session opened.
            </div>
          ) : null}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-5 text-sm text-muted">
          Need an account? <Link href="/register" className="text-accent">Create one here</Link>.
        </p>
      </div>
    </div>
  );
}
