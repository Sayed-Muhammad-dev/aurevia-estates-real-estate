"use client";

import { useState } from "react";
import { isValidEmail, isValidPhone } from "@/lib/forms";
import { properties } from "@/data/properties";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface FormState {
  property: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  visitType: string;
  message: string;
}

const initialState: FormState = {
  property: properties[0]?.title ?? "",
  name: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  visitType: "In-person",
  message: "",
};

export function BookingForm({ propertyTitle }: { propertyTitle?: string }) {
  const [form, setForm] = useState<FormState>({
    ...initialState,
    property: propertyTitle ?? initialState.property,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [open, setOpen] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<Pick<FormState, "property" | "visitType" | "date" | "time"> | null>(null);

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!isValidEmail(form.email)) nextErrors.email = "A valid email is required.";
    if (!isValidPhone(form.phone)) nextErrors.phone = "A valid phone number is required.";
    if (!form.date) nextErrors.date = "Preferred date is required.";
    if (!form.time) nextErrors.time = "Preferred time is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmittedBooking({
      property: form.property,
      visitType: form.visitType,
      date: form.date,
      time: form.time,
    });
    setOpen(true);
    setForm({ ...initialState, property: propertyTitle ?? initialState.property });
    setErrors({});
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-muted">
            <span>Property</span>
            <select
              value={form.property}
              onChange={(event) => setForm((current) => ({ ...current, property: event.target.value }))}
              className="field"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.title}>
                  {property.title}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Visit type</span>
            <select
              value={form.visitType}
              onChange={(event) => setForm((current) => ({ ...current, visitType: event.target.value }))}
              className="field"
            >
              <option>In-person</option>
              <option>Virtual</option>
              <option>Private evening tour</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => {
                setForm((c) => ({ ...c, name: e.target.value }));
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              className="field"
            />
            {errors.name ? <span className="text-xs text-danger">{errors.name}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((c) => ({ ...c, email: e.target.value }));
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              className="field"
            />
            {errors.email ? <span className="text-xs text-danger">{errors.email}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(e) => {
                setForm((c) => ({ ...c, phone: e.target.value }));
                setErrors((current) => ({ ...current, phone: undefined }));
              }}
              className="field"
            />
            {errors.phone ? <span className="text-xs text-danger">{errors.phone}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Preferred date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm((c) => ({ ...c, date: e.target.value }));
                setErrors((current) => ({ ...current, date: undefined }));
              }}
              className="field"
            />
            {errors.date ? <span className="text-xs text-danger">{errors.date}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Preferred time</span>
            <input
              type="time"
              value={form.time}
              onChange={(e) => {
                setForm((c) => ({ ...c, time: e.target.value }));
                setErrors((current) => ({ ...current, time: undefined }));
              }}
              className="field"
            />
            {errors.time ? <span className="text-xs text-danger">{errors.time}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-muted md:col-span-2">
            <span>Message</span>
            <textarea
              value={form.message}
              onChange={(e) => setForm((c) => ({ ...c, message: e.target.value }))}
              className="field min-h-32"
              placeholder="Tell us if you need a virtual showing, relocation support, or a same-day visit."
            />
          </label>
        </div>
        <div className="mt-6">
          <Button type="submit">Confirm visit request</Button>
        </div>
      </form>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Visit request confirmed"
        description="An advisor will reach out shortly with the next available schedule and a personalized itinerary."
      >
        <div className="mt-6 rounded-2xl border border-line bg-background/60 p-4 text-sm text-muted">
          <p>Property: {submittedBooking?.property ?? propertyTitle}</p>
          <p className="mt-2">Visit type: {submittedBooking?.visitType}</p>
          <p className="mt-2">Requested schedule: {submittedBooking?.date} at {submittedBooking?.time}</p>
        </div>
        <div className="mt-6">
          <Button onClick={() => setOpen(false)} className="w-full">
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
