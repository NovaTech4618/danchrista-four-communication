import { MessageCircle } from "lucide-react";

const whatsappUrl =
  "https://wa.me/2348035902087?text=Hello%20Amezing%20Limited%2C%20I%20need%20help%20with%20a%20phone%20problem%20or%20part.%20My%20phone%20model%3A%20____.%20Details%3A%20____.";

export function FloatingWhatsApp() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Amezing Limited on WhatsApp"
      className="fixed bottom-4 right-4 z-[60] inline-flex min-h-12 items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-[#062a15] shadow-xl ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:bg-[#20c35e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
      <span>WhatsApp Amezing</span>
    </a>
  );
}
