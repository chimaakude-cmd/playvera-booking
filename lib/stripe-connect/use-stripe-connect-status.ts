"use client";

import { useEffect, useState } from "react";
import {
  fetchStripeConnectStatus,
  getStripeConnectState,
} from "./storage";
import type { StripeConnectStatus } from "./types";

let cachedStatus: StripeConnectStatus | null = null;
let inflight: Promise<StripeConnectStatus> | null = null;

async function loadStripeConnectStatus(): Promise<StripeConnectStatus> {
  if (cachedStatus) {
    return cachedStatus;
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    const current = getStripeConnectState();
    if (current.stripeAccountId) {
      try {
        const updated = await fetchStripeConnectStatus(current.stripeAccountId);
        cachedStatus = updated.status;
        return updated.status;
      } catch {
        cachedStatus = current.status;
        return current.status;
      }
    }

    cachedStatus = current.status;
    return current.status;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function invalidateStripeConnectStatusCache() {
  cachedStatus = null;
}

export function useStripeConnectStatus() {
  const [status, setStatus] = useState<StripeConnectStatus>(
    cachedStatus ?? getStripeConnectState().status,
  );
  const [loading, setLoading] = useState(cachedStatus === null);

  useEffect(() => {
    let cancelled = false;

    void loadStripeConnectStatus().then((nextStatus) => {
      if (!cancelled) {
        setStatus(nextStatus);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, loading };
}
