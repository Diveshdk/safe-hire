-- This script removes the word " as " from all certificate body templates
-- RESTRICTION: Only applies to "winner" certificates as requested.

-- 1. Update issued "winner" certificates
UPDATE certificates
SET metadata = jsonb_set(
  metadata,
  '{design_config, body_template}',
  to_jsonb(replace(metadata->'design_config'->>'body_template', ' as ', ' '))
)
WHERE certificate_type = 'winner'
  AND metadata->'design_config'->>'body_template' LIKE '% as %';

-- 2. Update certificate templates that are for winners
-- We check for "winner" in the template name or certificate title
UPDATE certificate_templates
SET config = jsonb_set(
  config,
  '{body_template}',
  to_jsonb(replace(config->>'body_template', ' as ', ' '))
)
WHERE (template_name ILIKE '%winner%' OR config->>'title' ILIKE '%winner%' OR config->>'title' ILIKE '%Achievement%')
  AND config->>'body_template' LIKE '% as %';
