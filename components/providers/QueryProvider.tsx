"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import React, { useState } from "react";

interface QueryProviderProps {
  children: React.ReactNode;
}

const shouldRetry = (failureCount: number, error: unknown) => {
  if (isAxiosError(error) && error.response) {
    const { status } = error.response;
    if (status >= 400 && status < 500) return false;
  }
  return failureCount < 3;
};

const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: shouldRetry },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
