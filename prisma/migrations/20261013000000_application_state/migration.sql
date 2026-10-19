-- Persist the existing application document without changing its payload shape.
CREATE TABLE "application_state" (
  "application_key" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "revision" INTEGER NOT NULL,
  CONSTRAINT "application_state_pkey" PRIMARY KEY ("application_key")
);
