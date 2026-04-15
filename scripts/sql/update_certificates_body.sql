-- Update certificates table
UPDATE certificates
SET design_config = jsonb_set(
  design_config,
  '{body_template}',
  to_jsonb(replace(design_config->>'body_template', ' as ', ' '))
)
WHERE design_config->>'body_template' LIKE '% as %';

-- Update certificate_templates table
UPDATE certificate_templates
SET config = jsonb_set(
  config,
  '{body_template}',
  to_jsonb(replace(config->>'body_template', ' as ', ' '))
)
WHERE config->>'body_template' LIKE '% as %';
