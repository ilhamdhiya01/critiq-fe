"use client";

import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import {
  REALTIME_BACKOFF_MS,
  REALTIME_BATCH_MS,
  REALTIME_DOMAIN_EVENTS,
  REALTIME_HIDDEN_CLOSE_MS,
} from "@/const/realtime.constant";
import {
  getEventInvalidations,
  RECONNECT_INVALIDATIONS,
} from "@/lib/helpers/realtime.helper";
import { userKeys } from "@/lib/hooks/auth/queryKeys";
import { membershipWithOrgKeys } from "@/lib/hooks/integrations/queryKeys";
import { useOrgBySlug } from "@/lib/hooks/organisation/useOrgBySlug";
import { RealtimeStatusContext } from "@/lib/hooks/useRealtimeStatus";
import type {
  RealtimeRevokeReason,
  RealtimeStatus,
} from "@/lib/types/realtime.types";
import { API_ORG_EVENTS } from "@/routes";

type Timer = ReturnType<typeof setTimeout> | undefined;

const parseData = (event: Event): unknown => {
  try {
    return JSON.parse((event as MessageEvent<string>).data);
  } catch {
    return null;
  }
};

// One SSE stream per tab, for the active org only. Events only say which
// data changed; the matching queries are invalidated and refetched over REST.
const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const params = useParams<{ slug: string }>();
  const { orgId } = useOrgBySlug(params.slug);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("unavailable");

  useEffect(() => {
    if (!orgId || typeof EventSource === "undefined") return;

    let source: EventSource | null = null;
    let hasConnected = false;
    let isStopped = false;
    let isClosedWhileHidden = false;
    let backoffStep = 0;
    let retryTimer: Timer;
    let hiddenTimer: Timer;
    let flushTimer: Timer;
    const pending = new Map<string, QueryKey>();

    const flush = () => {
      flushTimer = undefined;
      pending.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
      pending.clear();
    };

    const enqueue = (keys: QueryKey[]) => {
      keys.forEach((key) => pending.set(JSON.stringify(key), key));
      if (pending.size > 0 && !flushTimer) {
        flushTimer = setTimeout(flush, REALTIME_BATCH_MS);
      }
    };

    const closeSource = () => {
      source?.close();
      source = null;
    };

    const handleDomainEvent = (event: Event) => {
      const data = parseData(event);
      if (data && typeof data === "object" && "type" in data) {
        enqueue(getEventInvalidations(data as { type: string }, orgId));
      }
    };

    const connect = () => {
      retryTimer = undefined;
      if (isStopped) return;

      setStatus("connecting");
      const stream = new EventSource(API_ORG_EVENTS(orgId), {
        withCredentials: true,
      });
      source = stream;

      // First frame of every (re)connect. Missed events are not replayed.
      stream.addEventListener("ready", () => {
        setStatus("open");
        backoffStep = 0;
        if (hasConnected) enqueue(RECONNECT_INVALIDATIONS);
        hasConnected = true;
      });

      // The server closes the stream after this; never reconnect.
      stream.addEventListener("revoked", (event) => {
        isStopped = true;
        closeSource();
        setStatus("unavailable");
        const reason = (parseData(event) as { reason?: RealtimeRevokeReason })
          ?.reason;
        queryClient.invalidateQueries({
          queryKey:
            reason === "session_expired"
              ? userKeys.all
              : membershipWithOrgKeys.all,
        });
      });

      REALTIME_DOMAIN_EVENTS.forEach((name) =>
        stream.addEventListener(name, handleDomainEvent),
      );

      stream.onerror = () => {
        if (source !== stream) return;
        if (stream.readyState === EventSource.CLOSED) {
          // 401/403/429 or the BE is down: fall back to polling and retry
          // slowly instead of letting it hammer the server.
          closeSource();
          setStatus("unavailable");
          const delay =
            REALTIME_BACKOFF_MS[
              Math.min(backoffStep, REALTIME_BACKOFF_MS.length - 1)
            ];
          backoffStep += 1;
          retryTimer = setTimeout(connect, delay);
        } else {
          // The browser is reconnecting on its own.
          setStatus("connecting");
        }
      };
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearTimeout(hiddenTimer);
        hiddenTimer = setTimeout(() => {
          clearTimeout(retryTimer);
          retryTimer = undefined;
          closeSource();
          isClosedWhileHidden = true;
          setStatus("unavailable");
        }, REALTIME_HIDDEN_CLOSE_MS);
        return;
      }

      clearTimeout(hiddenTimer);
      if (isClosedWhileHidden && !isStopped) {
        isClosedWhileHidden = false;
        connect();
      }
    };

    connect();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isStopped = true;
      closeSource();
      clearTimeout(retryTimer);
      clearTimeout(hiddenTimer);
      clearTimeout(flushTimer);
      pending.clear();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [orgId, queryClient]);

  // No org yet, or no EventSource (old browser, tests): polling only.
  const isAvailable = !!orgId && typeof EventSource !== "undefined";

  return (
    <RealtimeStatusContext.Provider
      value={isAvailable ? status : "unavailable"}
    >
      {children}
    </RealtimeStatusContext.Provider>
  );
};

export default RealtimeProvider;
