"use client";

import { useTheme } from "@/hooks";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useTheme();

  // Prevent flash of unstyled content by not rendering until theme is loaded
  if (!isLoaded) {
    return null;
  }

  return <>{children}</>;
}
