const INDENT_STEP_PX = 24;
const MAX_INDENT_LEVEL = 4;

/**
 * Parse a CSS length into pixels, supporting px/pt/rem/em units.
 */
export const parseCssLength = (value: string) => {
  const match = value.trim().match(/^(-?\d*\.?\d+)(px|pt|rem|em)?$/);
  if (!match) {
    return null;
  }

  const numeric = Number.parseFloat(match[1]);
  if (Number.isNaN(numeric)) {
    return null;
  }

  const unit = match[2] ?? "px";
  if (unit === "pt") {
    return numeric * (4 / 3);
  }
  if (unit === "rem" || unit === "em") {
    return numeric * 16;
  }

  return numeric;
};

/**
 * Derive an indentation class from inline CSS.
 */
const extractIndentClass = (styleValue: string) => {
  const normalized = styleValue.toLowerCase();
  const candidates = [
    normalized.match(/margin-left\s*:\s*([^;]+)/)?.[1],
    normalized.match(/padding-left\s*:\s*([^;]+)/)?.[1],
    normalized.match(/text-indent\s*:\s*([^;]+)/)?.[1],
  ]
    .map((value) => (value ? parseCssLength(value) : null))
    .filter((value): value is number => value !== null && value > 0);

  if (candidates.length === 0) {
    return null;
  }

  const maxValue = Math.max(...candidates);
  const level = Math.min(MAX_INDENT_LEVEL, Math.max(1, Math.round(maxValue / INDENT_STEP_PX)));

  return `doc-indent-${level}`;
};

/**
 * Convert inline style declarations into doc-* class names.
 */
export const extractDocStyleClasses = (styleValue: string) => {
  const classes = new Set<string>();
  const normalized = styleValue.toLowerCase();
  const fontWeightMatch = normalized.match(/font-weight\s*:\s*([^;]+)/);
  if (fontWeightMatch) {
    const weight = fontWeightMatch[1].trim();
    const numeric = Number.parseInt(weight, 10);
    if (weight === "bold" || (!Number.isNaN(numeric) && numeric >= 600)) {
      classes.add("doc-bold");
    }
  }

  const fontStyleMatch = normalized.match(/font-style\s*:\s*([^;]+)/);
  if (fontStyleMatch && /(italic|oblique)/.test(fontStyleMatch[1])) {
    classes.add("doc-italic");
  }

  const textDecorationMatch = normalized.match(/text-decoration(?:-line)?\s*:\s*([^;]+)/);
  if (textDecorationMatch && textDecorationMatch[1].includes("underline")) {
    classes.add("doc-underline");
  }

  const indentClass = extractIndentClass(styleValue);
  if (indentClass) {
    classes.add(indentClass);
  }

  return Array.from(classes);
};

/**
 * Merge new class names with an existing class string.
 */
export const mergeClassNames = (existing: string | undefined, additions: string[]) => {
  if (additions.length === 0) {
    return existing;
  }

  const merged = new Set<string>(
    (existing ?? "")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean)
  );
  for (const addition of additions) {
    merged.add(addition);
  }

  return Array.from(merged).join(" ");
};

/**
 * Strip inline style attributes while preserving style-derived classes.
 */
export const stripInlineStyle = (
  attribs: Record<string, string | undefined>
): Record<string, string | undefined> => {
  const nextAttribs: Record<string, string | undefined> = { ...attribs };
  const styleValue = nextAttribs.style;
  if (!styleValue) {
    return nextAttribs;
  }

  const classes = extractDocStyleClasses(styleValue);
  const mergedClass = mergeClassNames(nextAttribs.class, classes);
  if (mergedClass) {
    nextAttribs.class = mergedClass;
  }
  delete nextAttribs.style;

  return nextAttribs;
};

/**
 * Apply mapped doc classes to elements based on style-class mappings.
 */
export const applyDocClassStyles = (root: Element, classStyleMap: Map<string, Set<string>>) => {
  if (classStyleMap.size === 0) {
    return;
  }

  const elements = root.matches("[class]")
    ? [root, ...Array.from(root.querySelectorAll("[class]"))]
    : Array.from(root.querySelectorAll("[class]"));

  for (const element of elements) {
    const additions = new Set<string>();
    for (const className of Array.from(element.classList)) {
      const mapped = classStyleMap.get(className);
      if (mapped) {
        for (const docClass of mapped) {
          additions.add(docClass);
        }
      }
    }
    for (const docClass of additions) {
      element.classList.add(docClass);
    }
  }
};
