/** Shared inputs for the generated lesson markup and its navigation assertions. */
export const lessonHeadingFixtures = {
  jobTitlesToCourses: {
    slug: "job-titles-to-cs-courses",
    id: "h.xbc98wpe6ddt",
    link: "Front-End Engineer (jobs)",
    heading: "Front-End Engineer courses",
  },
  coursesToJobTitles: {
    slug: "cs-courses-to-job-titles",
    id: "h.tvmayj7zoprj",
    link: "Front-End Engineer (courses)",
    heading: "Front-End Engineer description",
  },
} as const;

export const lessonSectionsFixture = {
  id: "lesson-top",
  heading: "Lesson sections",
  backLink: "Back to lesson sections",
} as const;

const { jobTitlesToCourses, coursesToJobTitles } = lessonHeadingFixtures;

/** Deterministic published-document markup, including both reported heading IDs. */
export const lessonHeadingContent = `
  <h2 id="${lessonSectionsFixture.id}">${lessonSectionsFixture.heading}</h2>
  <p><a href="/lesson/${jobTitlesToCourses.slug}#heading=${jobTitlesToCourses.id}">${jobTitlesToCourses.link}</a></p>
  <p><a href="/lesson/${coursesToJobTitles.slug}#heading=${coursesToJobTitles.id}">${coursesToJobTitles.link}</a></p>
  ${"<p>Course descriptions before the selected job title.</p>".repeat(30)}
  <h2 id="${jobTitlesToCourses.id}">${jobTitlesToCourses.heading}</h2>
  <p><a href="#${lessonSectionsFixture.id}">${lessonSectionsFixture.backLink}</a></p>
  <h2 id="${coursesToJobTitles.id}">${coursesToJobTitles.heading}</h2>
  ${"<p>Additional course descriptions after the selected job title.</p>".repeat(30)}
`;
