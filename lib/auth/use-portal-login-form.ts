"use client";

import { useCallback, useState } from "react";

/**
 * Shared submit/loading state for portal login forms.
 * Ensures loading resets in finally so the sign-in button never stays disabled after errors.
 */
export function usePortalLoginForm() {
  const [loading, setLoading] = useState(false);

  const runSubmit = useCallback(
    async (submit: () => void | Promise<void>) => {
      if (loading) {
        return;
      }

      setLoading(true);
      try {
        await submit();
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return { loading, runSubmit };
}
