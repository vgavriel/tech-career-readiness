import { parseCssLength } from "@/lib/lesson-content/doc-styles";

/**
 * Resolved background image metadata extracted from CSS.
 */
export type BackgroundImageStyle = {
  src: string;
  width?: number;
  height?: number;
};

const ALLOWED_IMAGE_HOSTS = ["docs.google.com", "googleusercontent.com", "gstatic.com"];

/**
 * Check if a hostname is in the image allowlist.
 */
const isAllowedImageHost = (hostname: string) =>
  ALLOWED_IMAGE_HOSTS.some((host) => (hostname === host ? true : hostname.endsWith(`.${host}`)));

/**
 * Validate an image src URL against the https allowlist.
 */
export const isAllowedImageSrc = (src: string | undefined) => {
  if (!src) {
    return false;
  }

  const trimmed = src.trim();
  if (!trimmed) {
    return false;
  }

  const normalized = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:") {
      return false;
    }
    return isAllowedImageHost(url.hostname);
  } catch {
    return false;
  }
};

/**
 * Extract a numeric CSS length from a style string for a given property.
 */
export const extractCssLengthValue = (style: string | undefined, property: string) => {
  if (!style) {
    return undefined;
  }
  const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`, "i");
  const match = style.match(regex);
  if (!match) {
    return undefined;
  }
  const value = parseCssLength(match[1].trim());
  return value === null ? undefined : Math.round(value);
};

/**
 * Extract a background-image URL from a CSS declaration block.
 */
export const extractBackgroundImage = (style: string | undefined) => {
  if (!style) {
    return undefined;
  }
  const match = style.match(/background(?:-image)?\s*:\s*[^;]*url\(['"]?([^'")]+)['"]?\)/i);
  if (match?.[1]) {
    return match[1];
  }
  const fallback = style.match(/url\(['"]?([^'")]+)['"]?\)/i);
  return fallback?.[1];
};

/**
 * Replace empty background-image elements with <img> tags.
 */
export const applyBackgroundImages = (
  root: Element,
  backgroundImageMap: Map<string, BackgroundImageStyle>
) => {
  const elements = [root, ...Array.from(root.querySelectorAll("*"))];

  for (const element of elements) {
    if (element.tagName === "IMG") {
      continue;
    }

    const contentText = (element.textContent ?? "").replace(/\s+/g, "");
    if (contentText.length > 0) {
      continue;
    }

    let matchedStyle: BackgroundImageStyle | null = null;
    for (const className of Array.from(element.classList)) {
      const candidate = backgroundImageMap.get(className);
      if (candidate) {
        matchedStyle = candidate;
        break;
      }
    }

    const inlineStyle = element.getAttribute?.("style") ?? "";
    const inlineBackground = extractBackgroundImage(inlineStyle);
    const inlineWidth = extractCssLengthValue(inlineStyle, "width");
    const inlineHeight = extractCssLengthValue(inlineStyle, "height");

    if (!matchedStyle && inlineBackground && isAllowedImageSrc(inlineBackground)) {
      matchedStyle = {
        src: inlineBackground,
        width: inlineWidth,
        height: inlineHeight,
      };
    } else if (matchedStyle) {
      matchedStyle = {
        ...matchedStyle,
        width: matchedStyle.width ?? inlineWidth,
        height: matchedStyle.height ?? inlineHeight,
      };
    }

    if (!matchedStyle) {
      continue;
    }

    const img = element.ownerDocument?.createElement("img");
    if (!img) {
      continue;
    }

    img.setAttribute("src", matchedStyle.src);
    img.setAttribute("alt", "");
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.setAttribute("referrerpolicy", "no-referrer");
    if (matchedStyle.width) {
      img.setAttribute("width", matchedStyle.width.toString());
    }
    if (matchedStyle.height) {
      img.setAttribute("height", matchedStyle.height.toString());
    }

    element.replaceWith(img);
  }
};
