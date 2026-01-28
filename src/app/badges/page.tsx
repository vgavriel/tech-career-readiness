import { permanentRedirect } from "next/navigation";


/**
 * Redirect legacy badges routes to Gold Stars.
 */
export default function BadgesPage() {
  permanentRedirect("/gold-stars");
}
