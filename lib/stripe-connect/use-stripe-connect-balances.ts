"use client";

import { useEffect, useState } from "react";
import {
  fetchStripeConnectStatus,
  getStripeConnectState,
} from "./storage";
import { isStripeConnected } from "./types";

export type StripeConnectBalancesState = {
  availableBalance: number;
  pendingBalance: number;
  lastPayoutAmount: number | null;
  lastPayoutDate: string | null;
  loading: boolean;
  stripeConnected: boolean;
  balanceUnavailable: boolean;
};

const INITIAL_STATE: StripeConnectBalancesState = {
  availableBalance: 0,
  pendingBalance: 0,
  lastPayoutAmount: null,
  lastPayoutDate: null,
  loading: true,
  stripeConnected: false,
  balanceUnavailable: false,
};

export function useStripeConnectBalances(): StripeConnectBalancesState {
  const [state, setState] = useState<StripeConnectBalancesState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function loadBalances() {
      const current = getStripeConnectState();
      const connected = isStripeConnected(current.status);

      if (!current.stripeAccountId || !connected) {
        if (!cancelled) {
          setState({
            ...INITIAL_STATE,
            loading: false,
            stripeConnected: connected,
          });
        }
        return;
      }

      try {
        const updated = await fetchStripeConnectStatus(current.stripeAccountId);
        if (cancelled) {
          return;
        }

        const dashboard = updated.dashboard;
        setState({
          availableBalance: dashboard?.availableBalance ?? 0,
          pendingBalance: dashboard?.pendingBalance ?? 0,
          lastPayoutAmount: dashboard?.lastPayoutAmount ?? null,
          lastPayoutDate: dashboard?.lastPayoutDate ?? null,
          loading: false,
          stripeConnected: isStripeConnected(updated.status),
          balanceUnavailable: false,
        });
      } catch {
        if (cancelled) {
          return;
        }

        setState({
          availableBalance: 0,
          pendingBalance: 0,
          lastPayoutAmount: null,
          lastPayoutDate: null,
          loading: false,
          stripeConnected: true,
          balanceUnavailable: true,
        });
      }
    }

    void loadBalances();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
