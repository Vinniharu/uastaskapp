"use client";

import { useEffect, useState } from "react";
import { NavigationEvents } from "./navigation-events";

export function NavigationEventsWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <NavigationEvents />;
} 