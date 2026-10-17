"use client";

import { useEffect, useEffectEvent } from "react";
import { supabase } from "./supabase";

const FALLBACK_POLL_MS = 4000;

// Calls onChange whenever any row in the given tables is inserted, updated, or deleted.
// Falls back to polling if the realtime connection isn't up (e.g. blocked network at a venue).
export function useRealtime(channelName: string, tables: string[], onChange: () => void) {
  const handleChange = useEffectEvent(onChange);
  const tableKey = tables.join(",");

  useEffect(() => {
    let connected = false;
    const channel = supabase.channel(channelName);
    for (const table of tableKey.split(",")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => handleChange());
    }
    channel.subscribe((status, err) => {
      connected = status === "SUBSCRIBED";
      if (status !== "SUBSCRIBED") console.warn(`[realtime] ${channelName}: ${status}`, err ?? "");
    });

    const poll = setInterval(() => {
      if (!connected) handleChange();
    }, FALLBACK_POLL_MS);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [channelName, tableKey]);
}
