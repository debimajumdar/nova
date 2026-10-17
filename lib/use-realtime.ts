"use client";

import { useEffect, useEffectEvent } from "react";
import { supabase } from "./supabase";

// Calls onChange whenever any row in the given tables is inserted, updated, or deleted.
export function useRealtime(channelName: string, tables: string[], onChange: () => void) {
  const handleChange = useEffectEvent(onChange);
  const tableKey = tables.join(",");

  useEffect(() => {
    const channel = supabase.channel(channelName);
    for (const table of tableKey.split(",")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => handleChange());
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, tableKey]);
}
