/**
 * Props for rendering sanitized lesson HTML.
 */
type LessonContentProps = {
  html: string;
};

/**
 * Render sanitized lesson HTML content.
 *
 * @remarks
 * Injects trusted HTML markup into the lesson layout; no state or side effects.
 */
export default function LessonContent({ html }: LessonContentProps) {
  return (
    <div
      className="lesson-content"
      data-testid="lesson-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
