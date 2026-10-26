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
uses. Every event carries `site_name: "tech-career-readiness"`, so reports can
combine the two sites or filter to one. The code is in `src/lib/analytics.ts`
and `src/lib/lesson-analytics.ts`.

**When it runs.** Only in production: never locally, in tests, or in Vercel
preview deployments (`VERCEL_ENV=preview`). It also stays off on `localhost`,
in automated browsers, and for any URL with `?analytics=off`. Set
`GOOGLE_ANALYTICS_ENABLED=false` to turn it off in production. gtag.js loads
after the page's `load` event, so it never delays lesson content.

**Privacy.** No names, emails, user ids, or per-student progress are sent.
Email addresses are removed from link URLs and link text, and phone numbers from
`tel:` links. Google signals and ad personalization are off. Visitors in the
EEA, UK, and Switzerland get consent mode defaults of `denied`, so GA4 sets no
cookies for them (it sends cookieless pings instead). There is no consent
banner: US law doesn't require one for a nonprofit university, and Brown's own
site has none.

**Events.**

| Event                                   | When                                                                                                               | Parameters                                                                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page_view`                             | Every page, including in-app navigation (GA4 enhanced measurement, "page changes based on browser history events") | GA4 defaults, `site_name`                                                                                                                                                                                           |
| `lesson_view`                           | A lesson is opened                                                                                                 | `lesson_slug`, `resource_name`, `professional_pathway`, `career_field`, `resource_type`                                                                                                                             |
| `lesson_load`                           | The lesson body is on screen                                                                                       | `lesson_slug`, `data_source` (`live`, `built_in`, `sample`, `google_doc`, `none`), `load_time_ms`                                                                                                                   |
| `resource_click`                        | A lesson link to a library resource or another lesson                                                              | Same as the library's `resource_click` for that resource (`professional_pathway`, `career_field`, `resource_type`, `resource_name`, `link_url`, and `page_location` set to the resource's link), plus `lesson_slug` |
| `external_link_click`                   | Any other link inside a lesson                                                                                     | `link_url`, `link_domain`, `link_text`, `outbound`, `lesson_slug`, and the current lesson's `professional_pathway`, `career_field`, `resource_type`                                                                 |
| `filter_select`                         | A focus is chosen                                                                                                  | `filter_name: "Focus"`, `filter_value`                                                                                                                                                                              |
| `lesson_complete` / `lesson_uncomplete` | A completion change is saved                                                                                       | `lesson_slug`, `completion_source` (`toggle` or `navigator`)                                                                                                                                                        |
| `navigation_click`                      | Lesson navigator, next core lesson, or back to course                                                              | `nav_element`, `link_url` (path)                                                                                                                                                                                    |
| `login`                                 | A visitor comes back signed in after clicking sign in                                                              | `method`                                                                                                                                                                                                            |
| `theme_change`                          | Light/dark toggle                                                                                                  | `theme`                                                                                                                                                                                                             |

GA4 also records its own `click` event (enhanced measurement) for every
outbound link, on both sites; don't add it to `external_link_click`.

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

- [ ] GA4 → Reports → Realtime: open a lesson on the production site (not
      localhost, no `?analytics=off`) and confirm `page_view`, `lesson_view`, and
      `lesson_load` with `site_name = tech-career-readiness`.
- [ ] Click a link to another lesson (`resource_click`) and an outside link
      (`external_link_click`); check their parameters in Admin → DebugView with
      [Tag Assistant](https://tagassistant.google.com) connected.
- [ ] Jump to a heading inside a lesson: it must **not** add a `page_view`.
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
