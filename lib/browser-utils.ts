import puppeteer, { Browser } from "puppeteer"
import puppeteerCore from "puppeteer-core"
import chromium from "@sparticuz/chromium-min"

export async function getBrowser(): Promise<Browser> {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    // Vercel / Production environment
    console.log("[BrowserUtils] Launching production browser...")
    return puppeteerCore.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    }) as unknown as Browser
  } else {
    // Local development
    return puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    })
  }
}
