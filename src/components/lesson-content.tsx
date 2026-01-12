type LessonContentProps = {
  html: string;
};

export default function LessonContent({ html }: LessonContentProps) {
  return (
    <div
      className="lesson-content"
      data-testid="lesson-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
