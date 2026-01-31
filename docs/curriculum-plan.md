# Curriculum Plan: Brown-Specific Tech Career Roadmap

## Goals

- Keep Brown-specific resources and context as the primary USP.
- Use existing Google Doc content as-is; do not edit source docs yet.
- Support short attention spans with UI layering, not content edits.
- Preserve autonomy by offering focuses and an open Role Library.

## Constraints (current)

- Lesson content comes from published Google Docs (docx copies are mirrors).
- Missing resources remain external links, not first-class lessons.
- No word count caps yet; track as a future optimization.

## Entry points

- Quick picker on landing plus an always-visible "Explore roles" entry.
- Picker options (routes to curated ordering of core lessons):
  - Just starting / exploring
  - Applying soon (1-2 weeks)
  - Interviewing soon
  - Offer in hand / internship prep

## Curriculum structure

Note: Core lessons count toward progress. Extra credit lessons are optional and tracked separately.

### Module 0: Start here

- [Core] Start to Finish: The Roadmap to a Tech Internship or Job
- [Core] Tech Recruiting Timeline
- [Extra] 3 Short Stories to Illustrate the Tech Career Exploration Journey at Brown University

### Module 1: Explore roles (Role Library)

- [Core] Explore Various Technology Jobs and Fields
- [Core] Popular Tech Roles
- [Core] Map of CS Courses to Job Titles
- [Core] Map of Job Titles to CS Courses
- [Extra] Role deep dives (all roles visible):
  - Learn about AI Engineering
  - Learn about AR/VR Engineering
  - Learn about Backend Engineering
  - Learn about Blockchain Engineering
  - Learn about Computer Vision Engineering
  - Learn about Cybersecurity Analysts/Specialists
  - Learn about Cybersecurity Engineering
  - Learn about Data Engineering
  - Learn about Data Science
  - Learn about DevOps Engineering
  - Learn about Embedded Engineering
  - Learn about Forward Deployed Engineering (FDE)
  - Learn about Frontend Engineering
  - Learn about Full-Stack Engineering
  - Learn about Game Development
  - Learn about Machine Learning (ML) Engineering
  - Learn about Mobile App Engineering
  - Learn about Product Management
  - Learn about Quant Developers
  - Learn about Quant Traders
  - Learn about Site Reliability Engineering (SRE)
  - Learn about UI/UX Design
  - Learn about Web Development

### Module 2: Build experience

- [Core] Build Experience to Get Tech Internships and New-Grad Jobs

### Module 3: Find opportunities + networking

- [Core] Tech Internship and Job Boards
- [Core] Informational Interviewing & Networking Tipsheet for Tech
- [Core] Is Networking Worth It For Tech Jobs?
- [Core] How to Network With Tech Recruiters
- [Extra] Tracking spreadsheets (resources, not lessons):
  - Spreadsheet to track Tech Job/Internship Applications
  - Spreadsheet to track Networking and Informational Interviews

### Module 4: Research companies

- [Core] Researching Tech Companies and Understanding Core Values

### Module 5: Applications

- [Core] Craft Winning Tech Job and Internship Applications
- [Core] Tech Resume Example with Annotations
- [Core] Examples: Quantify Impact on Tech Resumes
- [Extra] External-only links (not lessons):
  - Resume tipsheet and template (linked from docs)
  - Cover letter tipsheet and samples (linked from docs)

### Module 6: Interviews

- [Core] Ace the Tech Interview: Your Ultimate Prep Timeline
- [Core] Ace the Tech Interview: Solve Coding Challenges with Confidence
- [Core] Ace the Tech Interview: Stand Out with Smart Questions
- [Extra] External-only link (not a lesson):
  - Ace the Tech Interview: Send Thank You Notes

### Module 7: Offers

- [Core] Tech Job Offer Evaluation and Negotiation
- [Core] Tech Job Offer Evaluation and Negotiation Checklist

### Module 8: Internship success (post-offer)

- [Extra] Tech Internship Success Handbook
- [Extra] Tech Internship Success Checklist

## Focuses (quick picker output)

Each focus is a curated ordering of core lessons, not a separate curriculum.

- Just starting / exploring
  - Modules 0, 1, 2 in full
  - Then Modules 3, 4, 5

- Applying soon (1-2 weeks)
  - Module 0 (Roadmap + Timeline)
  - Module 3 (Job boards + networking)
  - Module 5 (Applications)
  - Module 4 (Research companies)
  - Module 6 (Interview prep)

- Interviewing soon
  - Module 0 (Roadmap + Timeline)
  - Module 6 (Interview prep)
  - Module 4 (Research companies)
  - Module 5 (Applications refreshers)

- Offer in hand / internship prep
  - Module 7 (Offers)
  - Module 8 (Internship success)

## Progress model

- Core progress: percent = completed core lessons / total core lessons.
- Extra credit progress: percent = completed extra credit lessons / total extra credit lessons.
- Roadmap completion is defined by core completion only; extra credit is motivational.

## Focus UX rules (tracked)

- Focus progress shows focus completion alongside overall core progress to avoid misleading percentages.
- Continue behavior uses focus order when a focus is selected, otherwise uses global core order.
- Core/extra credit and role-deep-dive flags are a source-of-truth mapping for progress and gold stars.

## Gamification (no streaks)

Use lesson completion events to award lightweight gold stars:

- Pathfinder: complete Module 0 (Start here)
- Explorer: complete Module 1 core + any 3 role deep dives
- Connector: complete Module 3
- Applicant: complete Module 5
- Interview Ready: complete Module 6
- Offer Confident: complete Module 7
- Internship Ready: complete Module 8 (extra credit)
- Extra Credit Collector: complete 50% of extra credit lessons

## Short-attention UX layer (future, no doc edits)

- Lesson snapshot at the top: 3 takeaways, 1 common mistake, 1 next action.
- Optional 60-second skim mode before full content.
- Generate from lesson HTML and cache by content hash.

## Lightweight assessments + success metrics (future)

- LLM-generated 3-5 self-check questions or reflection prompts.
- Cache by lesson content hash; regenerate on content change.
- Use assessment completion to suggest personal success metrics (self-marked).

## Feature backlog (tracked)

- Lesson snapshots (summary/takeaways/pitfall/action) with content-hash caching.
- Lightweight assessments with content-hash caching.
- Success-metric suggestions aligned to lesson content and assessments.
- Action cards surfaced outside of doc content.
- Word count and readability optimization pass (when doc edits are allowed).
- Focus-aware progress messaging + continue behavior rules.
- Lesson classification mapping for core/extra credit + role deep dives to support gold stars.
