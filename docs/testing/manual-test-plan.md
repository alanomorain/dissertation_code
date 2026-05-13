# Manual Testing Plan

This plan covers features that are best checked by a human because they depend on external services, uploaded files, seeded data quality, or visual judgement.

## Setup

1. Start the app stack with `docker compose up --build` or start PostgreSQL/Redis and run `npm run dev`.
2. Seed demo data with `npm run db:seed` if the database is empty.
3. Sign in with the README credentials:
   - Lecturer: `l@example.com` / `LP123!`
   - Student: `s@example.com` / `SP123!`

## Lecturer Flow

1. Sign in as the lecturer.
2. Open Modules, Lectures, Analogies, Quizzes, Students, and Statistics from the dashboard.
3. Confirm each page loads without errors and only lecturer-owned data is shown.
4. Create a test module with a unique code, then confirm it appears in module filters and creation forms.

## Slide Upload And Analogy Generation

1. Open Lecturer > Lectures or Analogies > Upload Lecture Slides.
2. Upload a small PDF or PPTX with readable lecture text.
3. Confirm extracted text is previewed and suggested topics are relevant.
4. Generate analogies from selected topics.
5. Confirm failed extraction, unsupported file type, and missing module cases show clear errors.

## Analogy Review And Media

1. Open a generated analogy set.
2. Add or edit feedback for at least one topic.
3. Approve the analogy set.
4. Upload an image or video to a topic if media is enabled for the demo.
5. Confirm the media displays on lecturer pages and is visible to students only when revision access is unlocked.

## Quiz Flow

1. As lecturer, create or open a quiz linked to a module/lecture.
2. Publish the quiz and confirm it appears in the student quiz list.
3. As student, start the quiz, answer all questions, submit it, and verify the score shown.
4. Retake only if attempts remain; confirm max-attempt limits are enforced.
5. As lecturer, open quiz results and statistics to confirm the attempt is reflected.

## Statistics

1. Open lecturer statistics for all modules and for a single module.
2. Compare the displayed completion counts, averages, and analogy-view metrics against the visible quiz attempts where practical.
3. Open student statistics and confirm the student sees only their own enrolled-module data.

## External AI And Media Checks

1. If OpenAI keys are configured, generate analogies and quiz questions from realistic lecture content.
2. Check that generated content is coherent, relevant, and appropriate for MSc Software Development students.
3. If Gemini image generation is enabled, generate one illustration and confirm the disabled-state message appears when the feature flag is off.
4. If S3 mode is configured, upload and replace one media item, then confirm the previous managed object is no longer referenced.

## Docker Demo Startup

1. Run `docker compose down` and then `docker compose up --build`.
2. Confirm PostgreSQL, Redis, the slide extractor, and the Next.js app become healthy.
3. Open `http://localhost:3000`.
4. Confirm lecturer and student sign-in still work.

