import { CertificateDesignConfig } from "@/components/dashboard/certificate-viewer"
import QRCode from "qrcode"

export async function generateCertificateHtml(config: CertificateDesignConfig): Promise<string> {
  const {
    template_id = "classic",
    organization_name,
    logos = [],
    logo_count = 1,
    header_lines = [],
    title = "Certificate",
    static_text = "This is to certify that",
    body_template,
    purpose,
    recipient_name,
    recipient_rank,
    recipient_name_style,
    date,
    safe_hire_id,
    signatories = [],
    verification_url,
  } = config

  // Generate QR Code Base64
  let qrBase64 = ""
  if (verification_url) {
    qrBase64 = await QRCode.toDataURL(verification_url, {
      margin: 1,
      width: 150,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
  }

  // Replace variables in body
  const replaceVariables = (text: string) => {
    if (!text) return ""
    return text
      .replace(/{Full Name}/g, recipient_name)
      .replace(/{recipient_name}/g, recipient_name)
      .replace(/{Position}/g, recipient_rank || "")
      .replace(/{recipient_rank}/g, recipient_rank || "")
      .replace(/{Event Name}/g, organization_name)
      .replace(/{Date}/g, date)
  }

  const finalBodyContent = replaceVariables(body_template || purpose || "")

  // Template-specific styles
  const templateStyles: Record<string, any> = {
    classic: {
      container: "border: 12px double #92400e; padding: 3rem; font-family: 'Playfair Display', serif; color: #0f172a; background: #ffffff;",
      org: "color: #78350f; font-size: 1.875rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;",
      title: "color: #78350f; font-size: 3rem; font-weight: 700; text-transform: uppercase; margin-top: 0.5rem;",
      recipient: "font-size: 2.25rem; font-weight: 700; font-style: italic; border-bottom: 2px solid rgba(120, 53, 15, 0.3); padding-bottom: 0.25rem;",
      qrBorder: "border: 2px solid #92400e; padding: 0.25rem;",
    },
    modern: {
      container: "border-right: 32px solid #0f172a; padding: 3rem; font-family: 'Inter', sans-serif; color: #1e293b; background: #ffffff; position: relative; overflow: hidden;",
      org: "color: #0f172a; font-size: 1.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.025em;",
      title: "color: #1e40af; font-size: 3rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em;",
      recipient: "font-size: 2.25rem; font-weight: 300; color: #0f172a; margin-bottom: 1rem;",
      qrBorder: "border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 4px solid #ffffff;",
    },
    premium: {
      container: "background: #020617; border: 2px solid rgba(245, 158, 11, 0.5); padding: 4rem; font-family: 'Playfair Display', serif; color: #fffbeb;",
      org: "font-size: 1.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3em; background: linear-gradient(to right, #fde68a, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent;",
      title: "font-size: 4.5rem; font-weight: 700; text-transform: uppercase; background: linear-gradient(to bottom, #fde68a, rgba(245, 158, 11, 0.8)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.5));",
      recipient: "font-size: 3.75rem; font-weight: 900; color: #fffbeb; text-decoration: underline; text-decoration-color: rgba(245, 158, 11, 0.3); text-underline-offset: 12px;",
      qrBorder: "border: 2px solid rgba(245, 158, 11, 0.3); padding: 0.5rem; background: #fffbeb; border-radius: 2px;",
    },
    academic: {
      container: "background: rgba(254, 252, 232, 0.3); border: 4px solid #1a365d; padding: 4rem; font-family: 'Playfair Display', serif; color: #0f172a;",
      org: "font-size: 1.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #1a365d;",
      title: "font-size: 3rem; font-weight: 700; text-transform: uppercase; color: #1a365d; opacity: 0.9;",
      recipient: "font-size: 3rem; font-weight: 700; color: #1a365d; background: rgba(255, 255, 255, 0.4); padding: 0.75rem 2.5rem; border: 1px solid rgba(26, 54, 93, 0.05);",
      qrBorder: "border: 2px solid #1a365d; padding: 0.25rem; background: #ffffff;",
    },
  }

  const style = templateStyles[template_id] || templateStyles.classic

  // Helper to render logos based on count
  let logoGridHtml = ""
  const displayLogos = logos.slice(0, logo_count)
  
  if (logo_count === 1) {
    logoGridHtml = `
      <div style="display: flex; justify-content: center; margin-bottom: 8px;">
        <img src="${displayLogos[0]}" style="height: 64px; width: auto; object-fit: contain;" />
      </div>`
  } else if (logo_count === 2) {
    logoGridHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 8px; padding: 0 32px;">
        <img src="${displayLogos[0]}" style="height: 64px; width: auto; object-fit: contain;" />
        <img src="${displayLogos[1]}" style="height: 64px; width: auto; object-fit: contain;" />
      </div>`
  } else {
    logoGridHtml = `
      <div style="display: flex; justify-content: space-around; align-items: center; width: 100%; margin-bottom: 8px;">
        ${displayLogos.map(url => `<img src="${url}" style="height: 64px; width: auto; object-fit: contain;" />`).join("")}
      </div>`
  }

  const headerLinesHtml = header_lines.map(line => `
    <p style="text-align: center; width: 100%; font-size: 1rem; font-style: italic; opacity: 0.7; margin: 2px 0;">${line}</p>
  `).join("")

  const signatoriesHtml = signatories.map(sig => `
    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 140px; margin: 0 16px;">
      <div style="height: 48px; display: flex; align-items: flex-end; margin-bottom: 8px; justify-content: center;">
        ${sig.signature_url ? `<img src="${sig.signature_url}" style="max-height: 100%; width: auto;" />` : `<div style="border-bottom: 1px solid #64748b; width: 100%; padding-bottom: 4px; font-style: italic; font-size: 0.875rem; opacity: 0.5;">Digital Signature</div>`}
      </div>
      <div style="height: 1px; width: 100%; background: #64748b; margin-bottom: 12px;"></div>
      <span style="font-weight: 700; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">${sig.name}</span>
      <span style="font-size: 0.75rem; color: #64748b;">${sig.designation}</span>
    </div>
  `).join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    
    body {
      margin: 0;
      padding: 0;
      width: 1123px;
      height: 794px;
      overflow: hidden;
    }
    
    .certificate-container {
      width: 1123px;
      height: 794px;
      position: relative;
      display: flex;
      flex-direction: column;
      ${style.container}
    }
    
    .header {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .logo-grid {
      display: flex;
      justify-content: center;
      margin-bottom: 0.5rem;
      width: 100%;
    }
    
    .content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      flex-grow: 1;
    }
    
    .footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-top: auto;
      margin-bottom: 4rem;
      width: 100%;
    }
    
    .branding {
      position: absolute;
      bottom: 24px;
      right: 32px;
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0.3;
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    ${template_id === "modern" ? '<div style="position: absolute; top: -10%; right: -10%; width: 256px; height: 256px; background: rgba(37, 99, 235, 0.05); border-radius: 50%; filter: blur(48px);"></div>' : ""}
    
    <div class="header">
      <div class="logo-grid">${logoGridHtml}</div>
      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 8px; width: 100%;">
        <p style="text-align: center; width: 100%; ${style.org}">${organization_name}</p>
        ${headerLinesHtml}
      </div>
      <h1 style="text-align: center; width: 100%; ${style.title}">${title}</h1>
    </div>

    <div class="content">
      <p style="font-size: 1.125rem; font-style: italic; opacity: 0.7; margin: 1rem 0;">${static_text}</p>
      <h2 style="${style.recipient} font-size: ${recipient_name_style?.size || '2.25rem'}; font-weight: ${recipient_name_style?.weight || '700'}; ${recipient_name_style?.underline ? 'text-decoration: underline;' : ''}">
        ${recipient_name || "[RECIPIENT NAME]"}
      </h2>
      <div style="max-width: 800px; margin: 0 auto; margin-top: 0.5rem;">
        <p style="font-size: 1.125rem; line-height: 1.6; white-space: pre-wrap;">${finalBodyContent}</p>
      </div>
    </div>

    <div class="footer">
      <div style="display: flex; align-items: center; gap: 16px;">
        <div class="qr-code" style="${style.qrBorder}">
          ${qrBase64 ? `<img src="${qrBase64}" width="100" height="100" />` : ""}
        </div>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 10px; text-transform: uppercase; opacity: 0.6;">Verification ID</span>
          <code style="font-size: 0.875rem; font-weight: 700; font-family: monospace;">${safe_hire_id}</code>
          <span style="font-size: 10px; margin-top: 4px; opacity: 0.6;">${date}</span>
        </div>
      </div>

      <div style="display: flex; align-items: flex-end; justify-content: flex-end; flex-grow: 1;">
        ${signatoriesHtml}
      </div>
    </div>

    <div class="branding">
      <div style="width: 16px; height: 16px; background: #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
      </div>
      <span style="font-size: 10px; font-weight: 700; color: #0f172a; letter-spacing: -0.05em;">SAFEHIRE VERIFIED</span>
    </div>
  </div>
</body>
</html>
  `
}
