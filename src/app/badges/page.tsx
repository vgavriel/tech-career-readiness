import { permanentRedirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Redirect legacy badges routes to Gold Stars.
 */
export default function BadgesPage() {
  permanentRedirect("/gold-stars");
}
