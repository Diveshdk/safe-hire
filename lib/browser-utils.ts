import puppeteer, { Browser } from "puppeteer"
import puppeteerCore from "puppeteer-core"
import chromium from "@sparticuz/chromium"

export async function getBrowser(): Promise<Browser> {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    // Vercel / Production environment
    return puppeteerCore.launch({
      args: chromium.args as string[],
      defaultViewport: (chromium as any).defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: (chromium as any).headless,
    }) as unknown as Browser
  } else {
    // Local development
    return puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    })
  }
}
