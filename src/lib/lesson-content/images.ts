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
 * Normalize computed CSS length values into rounded pixel numbers.
 */
const parseComputedLength = (value: string | null | undefined) => {
  if (!value) {
    return undefined;
  }
  const parsed = parseCssLength(value);
  return parsed === null ? undefined : Math.round(parsed);
};

/**
 * Replace empty background-image elements with <img> tags.
 */
export const applyBackgroundImages = (
  root: Element,
  backgroundImageMap: Map<string, BackgroundImageStyle>
) => {
  if (backgroundImageMap.size === 0) {
    if (!root.ownerDocument?.defaultView) {
      return;
    }
  }

  const defaultView = root.ownerDocument?.defaultView;
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

    if (defaultView) {
      const computedStyle = defaultView.getComputedStyle(element);
      const computedBackground = extractBackgroundImage(computedStyle.backgroundImage);
      if (!matchedStyle && computedBackground) {
        if (isAllowedImageSrc(computedBackground)) {
          matchedStyle = {
            src: computedBackground,
            width: parseComputedLength(computedStyle.width),
            height: parseComputedLength(computedStyle.height),
          };
        }
      } else if (matchedStyle) {
        matchedStyle = {
          ...matchedStyle,
          width: matchedStyle.width ?? parseComputedLength(computedStyle.width),
          height: matchedStyle.height ?? parseComputedLength(computedStyle.height),
        };
      }
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
