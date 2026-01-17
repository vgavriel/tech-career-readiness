"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { signIn } from "next-auth/react";

import { buildSignInOptions, useAuthProvider } from "@/hooks/use-auth-provider";

/**
 * Props for the sign-in CTA component.
 */
type SignInCtaProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  children: ReactNode;
  provider?: string;
  callbackUrl?: string;
};

/**
 * Render a sign-in CTA that returns users to the current page by default.
 */
export default function SignInCta({
  children,
  provider,
  callbackUrl,
  type = "button",
  ...props
}: SignInCtaProps) {
  const authProvider = useAuthProvider();
  const providerId = provider ?? authProvider.id;
  const options = buildSignInOptions(providerId, callbackUrl);

  return (
    <button
      {...props}
      type={type}
      onClick={() => signIn(providerId, options)}
    >
      {children}
    </button>
  );
}
