import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanup() {
  console.log('--- Cleaning up "winner" certificates body_template ---')

  // 1. Fetch only "winner" certificates with " as " in body_template
  const { data: certs, error: certError } = await supabase
    .from('certificates')
    .select('id, metadata')
    .eq('certificate_type', 'winner')
    
  if (certError) {
    console.error('Error fetching certificates:', certError)
  } else {
    let updatedCount = 0
    for (const cert of certs || []) {
      const bodyTemplate = cert.metadata?.design_config?.body_template
      if (bodyTemplate && bodyTemplate.includes(' as ')) {
        const updatedBody = bodyTemplate.replace(/ as /g, ' ')
        const updatedMetadata = {
          ...cert.metadata,
          design_config: {
            ...cert.metadata.design_config,
            body_template: updatedBody
          }
        }
        
        const { error } = await supabase
          .from('certificates')
          .update({ metadata: updatedMetadata })
          .eq('id', cert.id)
          
        if (!error) updatedCount++
      }
    }
    console.log(`Updated ${updatedCount} winner certificates.`)
  }

  // 2. Fetch templates that look like winner templates
  const { data: templates, error: templateError } = await supabase
    .from('certificate_templates')
    .select('id, config, template_name')

  if (templateError) {
    console.error('Error fetching templates:', templateError)
  } else {
    let updatedCount = 0
    for (const tpl of templates || []) {
      const isWinner = 
        tpl.template_name?.toLowerCase().includes('winner') || 
        tpl.config?.title?.toLowerCase().includes('winner') ||
        tpl.config?.title?.toLowerCase().includes('achievement')

      if (isWinner) {
        const bodyTemplate = tpl.config?.body_template
        if (bodyTemplate && bodyTemplate.includes(' as ')) {
          const updatedConfig = {
            ...tpl.config,
            body_template: bodyTemplate.replace(/ as /g, ' ')
          }
          
          const { error } = await supabase
            .from('certificate_templates')
            .update({ config: updatedConfig })
            .eq('id', tpl.id)
            
          if (!error) updatedCount++
        }
      }
    }
    console.log(`Updated ${updatedCount} winner-related templates.`)
  }

  console.log('--- Cleanup complete ---')
}

cleanup()
