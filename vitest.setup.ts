import "@testing-library/jest-dom/vitest";

process.env.GOOGLE_CLIENT_ID ??= "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-google-client-secret";
process.env.NEXTAUTH_SECRET ??= "test-nextauth-secret";
process.env.DATABASE_URL ??= "postgresql://test-user:test-pass@localhost:5432/test-db";
