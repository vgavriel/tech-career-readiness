# Observability

## Request IDs

- Proxy assigns `x-request-id` to matched routes (HTML + API) and returns the same value on the response.
- If a request already includes `x-request-id`, it is preserved and propagated downstream.

## Structured logging

Logs are JSON lines emitted by `src/lib/logger.ts`.

Common fields:

- `timestamp`: ISO timestamp.
- `level`: debug/info/warn/error.
- `message`: event name.
- `requestId`: correlates logs with `x-request-id`.
- `route`: logical route label when applicable.
- `durationMs`: elapsed milliseconds for the server handler.
- `status`: HTTP status code when applicable.
- `cache`: "hit" or "miss" for lesson-content fetches.
- `action`, `provider`, `method`, `userId`: contextual fields for auth/progress logs.

### Redaction defaults

The logger redacts values for keys that commonly contain secrets or PII
(e.g., email, tokens, secrets, passwords, cookies, authorization headers).

### Configuration

- `LOG_LEVEL`: debug/info/warn/error. Default: debug (local), warn (test), info (preview/prod).
- `LOG_SAMPLE_RATE`: 0-1 float; applies to debug/info logs only. Warn/error always log.
- `NEXT_PUBLIC_ANALYTICS_ENABLED`: true/false; controls client pageview telemetry.

## Client pageview telemetry

Page views are tracked with `@vercel/analytics` when enabled. By default it
is on for preview/production and off for local/test unless overridden by
`NEXT_PUBLIC_ANALYTICS_ENABLED`.

## Google Analytics (GA4)

Page views and student actions also go to the Center for Career Exploration's
GA4 property `G-40SVVNLXG8`, the same property the
[Career Exploration Library](https://brown-career-center.github.io/career-exploration-library)
uses. Every event carries `site_name: "tech-career-readiness"` (set on the
Google tag's `config`, so it also reaches GA4's own page views and clicks), so
reports can combine the two sites or filter to one. The code is in
`src/lib/analytics.ts` and `src/lib/lesson-analytics.ts`.

**When it runs.** Only in production: never locally, in tests, or in Vercel
preview deployments (`VERCEL_ENV=preview`). It also stays off on `localhost`,
in automated browsers, and for any URL with `?analytics=off`. Set
`GOOGLE_ANALYTICS_ENABLED=false` to turn it off in production. gtag.js loads
asynchronously as soon as the app hydrates. It doesn't wait for the window
`load` event, which on streamed lesson pages can wait for a slow Google Doc;
visits and clicks before then would be lost.

**What is sent.** Pages and lessons viewed, links clicked inside lessons,
lesson completions, focus and theme changes, and sign-ins. GA4 ties these to a
random id in a first-party cookie, so they form a pseudonymous history per
browser, not per account: no names, emails, or account ids are sent. Email
addresses are removed from link URLs and link text, and phone numbers from
`tel:` links. Google signals and ad personalization are off. The site has no
consent banner. Visitors in the EEA, UK, and Switzerland get consent mode
defaults of `denied`, so GA4 sets no cookies for them; it still sends
cookieless pings, which barely appear in reports.

**Events.**

| Event                                   | When                                                                                                               | Parameters                                                                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page_view`                             | Every page, including in-app navigation (GA4 enhanced measurement, "page changes based on browser history events") | GA4 defaults, `site_name`                                                                                                                                                                                           |
| `lesson_view`                           | A lesson is opened                                                                                                 | `lesson_slug`, `resource_name`, `professional_pathway`, `career_field`, `resource_type`                                                                                                                             |
| `lesson_load`                           | The lesson body is on screen                                                                                       | `lesson_slug`, `data_source` (`live`, `built_in`, `sample`, `google_doc`, `none`), `navigation_type`, `load_time_ms`                                                                                                |
| `resource_click`                        | A lesson link to a library resource or another lesson                                                              | Same as the library's `resource_click` for that resource (`professional_pathway`, `career_field`, `resource_type`, `resource_name`, `link_url`, and `page_location` set to the resource's link), plus `lesson_slug` |
| `external_link_click`                   | Any other link inside a lesson                                                                                     | `link_url`, `link_domain`, `link_text`, `outbound`, `lesson_slug`, and the current lesson's `professional_pathway`, `career_field`, `resource_type`                                                                 |
| `filter_select`                         | A focus is chosen                                                                                                  | `filter_name: "Focus"`, `filter_value`                                                                                                                                                                              |
| `lesson_complete` / `lesson_uncomplete` | A completion change is saved                                                                                       | `lesson_slug`, `completion_source` (`toggle`, `navigator`, or `next_lesson`)                                                                                                                                        |
| `navigation_click`                      | Lesson navigator, next core lesson, or back to course                                                              | `nav_element`, `link_url` (path)                                                                                                                                                                                    |
| `login`                                 | A visitor comes back signed in after clicking sign in                                                              | `method`                                                                                                                                                                                                            |
| `theme_change`                          | Light/dark toggle                                                                                                  | `theme`                                                                                                                                                                                                             |

GA4 also records its own `click` event (enhanced measurement) for every
outbound link, on both sites; don't add it to `external_link_click`.

**Reading the numbers.**

- GA4 doesn't log parameter values over 100 characters (`page_location`
  allows 1,000). `external_link_click` drops the query string from long
  `link_url`s so the host and path still arrive. `resource_click` sends the
  library's own URL for the resource, so a few long ones are lost on both sites
  alike.
- `load_time_ms` is shared with the library's `library_load`, so always split
  it by event name. For `lesson_load`, also split by `navigation_type`:
  `page_load` runs from the page request until the lesson body is on screen and
  interactive; `in_app` runs from the lesson frame's first render until its body
  is on screen.
- Every page has the title "Tech Career Readiness", so use page path, not page
  title, in page reports.

**Library values.** Lessons and lesson links get their pathway, field, and type
from the library's own data, copied into `src/lib/library-resources.json`.
Every lesson has a row in the library sheet that links to its page, so a
library click on a lesson and this app's views of it land on the same
`page_location`. Refresh the copy after the sheet changes:

```bash
npm run analytics:sync-library
```

A unit test fails if a seeded lesson has no library row.

**Launch checklist.**

- [ ] Before launch, add a `site_name` comparison or filter to the property's
      existing reports, explorations, and dashboards. From launch, totals
      (users, sessions, page views) and the library's `resource_click` and
      `filter_select` counts include this app's traffic. Library events show
      `site_name` as "(not set)" until the library sends its own.
- [ ] Add `site_name: "career-exploration-library"` to the library's Google tag
      `config` (in the career-exploration-library repository).
- [ ] GA4 → Reports → Realtime: open a lesson on the production site (not
      localhost, no `?analytics=off`) and confirm `page_view`, `lesson_view`, and
      `lesson_load` with `site_name = tech-career-readiness`.
- [ ] In Admin → DebugView with [Tag Assistant](https://tagassistant.google.com)
      connected: click a link to another lesson (`resource_click`) and an outside
      link (`external_link_click`) and check their parameters. Confirm GA4's own
      `page_view` and `click` events also carry `site_name`.
- [ ] Move to another lesson with the navigator: it must add one `page_view`.
      Jump to a heading inside a lesson: it must **not** add a `page_view`.
- [ ] After the parameters show up, register two event-scoped custom
      dimensions in Admin → Data display → Custom definitions: "Site name"
      (`site_name`) and "Lesson slug" (`lesson_slug`). The library's dimensions
      and the `load_time_ms` metric are already registered.
- [ ] Optional: in the web stream's Configure tag settings → Configure your
      domains, add `tech-career-readiness.vercel.app` and
      `brown-career-center.github.io` to count a student who uses both sites once.

## Client performance telemetry

Performance vitals are captured with `@vercel/speed-insights` when analytics are
enabled. It follows the same `NEXT_PUBLIC_ANALYTICS_ENABLED` toggle as pageview
telemetry (on for preview/production by default; off for local/test unless
overridden).

## Sampling and retention guidance

- Keep warn/error logs at full retention for 30-90 days.
- Sample info/debug via `LOG_SAMPLE_RATE` and retain for 7-14 days.
- If volume spikes, apply additional sampling or filters at the log sink.
