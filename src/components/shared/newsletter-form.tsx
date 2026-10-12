"use client";

import { applicationRequest } from "@/lib/application";
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
      onSubmit={async (event) => {
        event.preventDefault();
        if (!isValidEmail(email)) {
          setSuccess(false);
          setError("Enter a valid email address.");
          return;
        }

        setError("");
        try {
          await applicationRequest("submit/subscribers", { email });
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Subscription request failed",
          );
          return;
        }
        setSuccess(true);
        showToast(
          "Request saved",
          "Your email is saved for the team to review.",
        );
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
      {success ? (
        <p className="text-sm text-success">Subscription request received.</p>
      ) : null}
    </form>
  );
}
