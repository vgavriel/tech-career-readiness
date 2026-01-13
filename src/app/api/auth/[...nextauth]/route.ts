import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

/**
 * Create a shared NextAuth handler for GET and POST routes.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
