import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

vi.mock("next-auth/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-auth/react")>();
  return {
    ...actual,
    getProviders: vi.fn().mockResolvedValue({
      google: { id: "google", name: "Google" },
    }),
  };
});

process.env.GOOGLE_CLIENT_ID ??= "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-google-client-secret";
process.env.NEXTAUTH_SECRET ??= "test-nextauth-secret";
process.env.DATABASE_URL ??= "postgresql://test-user:test-pass@localhost:5432/test-db";
process.env.NEXTAUTH_URL ??= "http://localhost:3000";
