import { extractDocStyleClasses } from "@/lib/lesson-content/doc-styles";
import {
  type BackgroundImageStyle,
  extractBackgroundImage,
  extractCssLengthValue,
  isAllowedImageSrc,
} from "@/lib/lesson-content/images";

export type DocStyleMaps = {
  classStyleMap: Map<string, Set<string>>;
  backgroundImageMap: Map<string, BackgroundImageStyle>;
  styleNodes: HTMLStyleElement[];
};

export const extractStyleMaps = (document: Document): DocStyleMaps => {
  const styleNodes = Array.from(document.querySelectorAll<HTMLStyleElement>("style"));
  const classStyleMap = new Map<string, Set<string>>();
  const backgroundImageMap = new Map<string, BackgroundImageStyle>();
  if (styleNodes.length === 0) {
    return { classStyleMap, backgroundImageMap, styleNodes };
  }

  const cssText = styleNodes.map((node) => node.textContent ?? "").join("\n");
  const ruleRegex = /([^{}]+)\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(cssText)) !== null) {
    const selectors = match[1].split(",");
    const declarations = match[2];
    const docClasses = extractDocStyleClasses(declarations);
    const backgroundImage = extractBackgroundImage(declarations);
    const width = extractCssLengthValue(declarations, "width");
    const height = extractCssLengthValue(declarations, "height");
    const allowedBackground =
      backgroundImage && isAllowedImageSrc(backgroundImage) ? backgroundImage : null;
    if (docClasses.length === 0) {
      if (!allowedBackground) {
        continue;
      }
    }

    for (const selector of selectors) {
      const classMatches = selector.matchAll(/\.([a-zA-Z0-9_-]+)/g);
      for (const classMatch of classMatches) {
        const className = classMatch[1];
        if (docClasses.length > 0) {
          let existing = classStyleMap.get(className);
          if (!existing) {
            existing = new Set<string>();
            classStyleMap.set(className, existing);
          }
          for (const docClass of docClasses) {
            existing.add(docClass);
          }
        }
        if (allowedBackground) {
          backgroundImageMap.set(className, {
            src: allowedBackground,
            width,
            height,
          });
        }
      }
    }
  }

  return { classStyleMap, backgroundImageMap, styleNodes };
};
