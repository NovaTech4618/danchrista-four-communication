"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function NetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div role="status" aria-live="polite" className="sticky top-16 z-30 flex items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:top-[72px]">
      <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p><strong>You are offline.</strong> Live records cannot be safely loaded or saved. Reconnect before recording money, sales, repairs, or stock movements.</p>
    </div>
  );
}
