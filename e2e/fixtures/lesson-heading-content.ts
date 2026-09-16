/** Deterministic published-document markup, including both reported heading IDs. */
export const lessonHeadingContent = `
  <h2 id="lesson-top">Lesson sections</h2>
  <p><a href="/lesson/job-titles-to-cs-courses#heading=h.xbc98wpe6ddt">Front-End Engineer (jobs)</a></p>
  <p><a href="/lesson/cs-courses-to-job-titles#heading=h.tvmayj7zoprj">Front-End Engineer (courses)</a></p>
  ${"<p>Course descriptions before the selected job title.</p>".repeat(30)}
  <h2 id="h.xbc98wpe6ddt">Front-End Engineer courses</h2>
  <p><a href="#lesson-top">Back to lesson sections</a></p>
  <h2 id="h.tvmayj7zoprj">Front-End Engineer description</h2>
  ${"<p>Additional course descriptions after the selected job title.</p>".repeat(30)}
`;
