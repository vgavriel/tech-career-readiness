"use client";

import { getProviders } from "next-auth/react";
import { useEffect, useState } from "react";

import { devAuthDefaults } from "@/lib/dev-auth";

type AuthProvider = {
  id: string;
  label: string;
  isDev: boolean;
};

type AuthProviderState = {
  provider: AuthProvider;
  isReady: boolean;
};

const googleProvider: AuthProvider = {
  id: "google",
  label: "Sign in with Google",
  isDev: false,
};

const devProvider: AuthProvider = {
  id: "credentials",
  label: "Sign in (dev)",
  isDev: true,
};

const resolveProvider = (
  providers?: Record<string, { id: string; name?: string }>
): AuthProvider => {
  if (providers?.google) {
    return googleProvider;
  }
  if (providers?.credentials) {
    return devProvider;
  }

  const firstProvider = providers ? Object.values(providers)[0] : undefined;
  if (firstProvider) {
    return {
      id: firstProvider.id,
      label: `Sign in with ${firstProvider.name ?? firstProvider.id}`,
      isDev: false,
    };
  }

  return googleProvider;
};

export const useAuthProvider = () => {
  const [state, setState] = useState<AuthProviderState>({
    provider: googleProvider,
    isReady: false,
  });

  useEffect(() => {
    let isActive = true;
    getProviders()
      .then((providers) => {
        if (!isActive) {
          return;
        }
        setState({
          provider: resolveProvider(providers ?? undefined),
          isReady: true,
        });
      })
      .catch(() => {
        if (isActive) {
          setState({
            provider: googleProvider,
            isReady: true,
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return state;
};

export const buildSignInOptions = (providerId: string, callbackUrl?: string) => {
  const options: Record<string, string> = {};

  if (callbackUrl) {
    options.callbackUrl = callbackUrl;
  }

  if (providerId === devProvider.id) {
    options.email = devAuthDefaults.email;
    options.name = devAuthDefaults.name;
  }

  return Object.keys(options).length ? options : undefined;
};
