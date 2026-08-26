"use client";

import { useState } from "react";
import { isValidEmail } from "@/lib/forms";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!isValidEmail(email)) {
          setSuccess(false);
          setError("Enter a valid email address.");
          return;
        }

        setError("");
        setSuccess(true);
        showToast("Subscribed", "You will receive weekly market briefings and newly released listings.");
        setEmail("");
      }}
      className="space-y-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) {
              setError("");
            }
            if (success) {
              setSuccess(false);
            }
          }}
          placeholder="Enter your email"
          className="field flex-1"
          aria-invalid={Boolean(error)}
        />
        <Button type="submit">Join newsletter</Button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {success ? <p className="text-sm text-success">Subscription confirmed.</p> : null}
    </form>
  );
}
