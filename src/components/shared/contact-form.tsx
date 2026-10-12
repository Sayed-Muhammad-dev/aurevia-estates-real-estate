"use client";

import { applicationRequest } from "@/lib/application";
import { useState } from "react";
import { isValidEmail } from "@/lib/forms";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

type ContactFormValues = {
  name: string;
  email: string;
  interest: string;
  message: string;
};

const initialForm: ContactFormValues = {
  name: "",
  email: "",
  interest: "Buying",
  message: "",
};

export function ContactForm({
  defaultInterest,
  defaultMessage,
}: {
  defaultInterest?: string;
  defaultMessage?: string;
}) {
  const { showToast } = useToast();
  const initialState = {
    ...initialForm,
    interest: defaultInterest ?? initialForm.interest,
    message: defaultMessage ?? initialForm.message,
  };
  const [form, setForm] = useState<ContactFormValues>({
    ...initialState,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormValues, string>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: Partial<Record<keyof ContactFormValues, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!isValidEmail(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.message.trim().length < 20) {
      nextErrors.message =
        "Include at least 20 characters so the team can respond properly.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!validate()) {
          setSubmitted(false);
          return;
        }

        if (submitting) return;
        setSubmitting(true);
        try {
          await applicationRequest("submit/inquiries", form);
        } catch (error) {
          setErrors({
            message:
              error instanceof Error ? error.message : "Could not send message",
          });
          return;
        } finally {
          setSubmitting(false);
        }
        setSubmitted(true);
        setErrors({});
        showToast(
          "Message received",
          "Your enquiry is saved for an advisor to review.",
        );
        setForm(initialState);
      }}
      className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-muted">
          <span>Name</span>
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
        <label className="space-y-2 text-sm text-muted md:col-span-2">
          <span>What do you need?</span>
          <select
            value={form.interest}
            onChange={(e) => {
              setForm((c) => ({ ...c, interest: e.target.value }));
              if (submitted) setSubmitted(false);
            }}
            className="field"
          >
            <option>Buying</option>
            <option>Renting</option>
            <option>Selling</option>
            <option>Investment advisory</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted md:col-span-2">
          <span>Message</span>
          <textarea
            value={form.message}
            onChange={(e) => {
              setForm((c) => ({ ...c, message: e.target.value }));
              setErrors((current) => ({ ...current, message: undefined }));
              if (submitted) setSubmitted(false);
            }}
            className="field min-h-36"
            placeholder="Share your preferred markets, budget, timeline, and anything else we should know."
          />
          {errors.message ? (
            <span className="text-xs text-danger">{errors.message}</span>
          ) : null}
        </label>
      </div>
      {submitted ? (
        <div className="mt-6 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          Your inquiry is saved in the advisory inbox for review.
        </div>
      ) : null}
      <div className="mt-6">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving inquiry…" : "Send inquiry"}
        </Button>
      </div>
    </form>
  );
}
