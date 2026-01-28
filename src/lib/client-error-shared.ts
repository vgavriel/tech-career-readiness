/**
 * Raw client error details captured from the browser.
 */
export type ClientErrorPayload = {
  message: string;
  name?: string;
  stack?: string;
  url?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  componentStack?: string;
  userAgent?: string;
};
