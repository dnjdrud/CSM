-- Add REPORT_USER type to moderation_reports check constraint
ALTER TABLE moderation_reports
  DROP CONSTRAINT IF EXISTS moderation_reports_type_check;

ALTER TABLE moderation_reports
  ADD CONSTRAINT moderation_reports_type_check
  CHECK (type IN ('REPORT_POST', 'REPORT_COMMENT', 'REPORT_USER'));
