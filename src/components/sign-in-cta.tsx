"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { signIn } from "next-auth/react";

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
  provider = "google",
  callbackUrl,
  type = "button",
  ...props
}: SignInCtaProps) {
  const options = callbackUrl ? { callbackUrl } : undefined;

  return (
    <button
      {...props}
      type={type}
      onClick={() => signIn(provider, options)}
    >
      {children}
    </button>
  );
}
