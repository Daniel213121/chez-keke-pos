"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AutoLogout() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only track idle timeouts for actively logged-in users
    if (status !== "authenticated") return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // Automatically log out after 15 minutes of inactivity
      timeoutId = setTimeout(async () => {
        await signOut({ redirect: false });
        // Hard reload clears browser cache — back button can't return to protected page
        window.location.replace('/auth/login');
      }, 15 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Start timer initially
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [status, router]);

  return null;
}
