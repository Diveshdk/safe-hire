/**
 * Utility functions for handling API responses consistently
 */

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

/**
 * Safely parse JSON from an API response with proper error handling
 */
export async function parseApiResponse<T = any>(response: Response): Promise<T> {
  // Check if response is OK
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  
  // Check if response is JSON
  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text()
    throw new Error(`Expected JSON response, got: ${contentType || 'unknown'}. Response: ${text}`)
  }
  
  try {
    return await response.json()
  } catch (parseError) {
    const text = await response.text()
    throw new Error(`Failed to parse JSON response: ${parseError}. Response: ${text}`)
  }
}

/**
 * Standard fetch wrapper with error handling
 */
export async function apiCall<T = any>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options)
    return await parseApiResponse<T>(response)
  } catch (error) {
    console.error(`API call to ${url} failed:`, error)
    throw error
  }
}

/**
 * Fetch wrapper specifically for SWR with consistent error handling
 */
export const swrFetcher = (url: string) =>
  fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Expected JSON response, got: ${contentType || 'unknown'}`)
    }
    
    const text = await response.text()
    try {
      return text ? JSON.parse(text) : {}
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Response text:", text)
      throw new Error("Invalid JSON response")
    }
  })
