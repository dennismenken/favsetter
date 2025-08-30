import * as cheerio from 'cheerio';

export interface UrlMetadata {
  title?: string;
  description?: string;
  domain: string;
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  try {
    // Extract domain
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FavSetter/1.0)',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { domain };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    let title = 
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      undefined;

    // Extract description
    let description = 
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      undefined;

    // Clean up title (remove excessive whitespace)
    if (title) {
      title = title.replace(/\s+/g, ' ').trim();
      if (title.length > 200) {
        title = title.substring(0, 197) + '...';
      }
    }

    // Clean up description
    if (description) {
      description = description.replace(/\s+/g, ' ').trim();
      if (description.length > 500) {
        description = description.substring(0, 497) + '...';
      }
    }

    return {
      title,
      description,
      domain,
    };
  } catch (error) {
    console.error('Error fetching metadata for URL:', url, error);
    
    // Fallback: at least return the domain
    try {
      const urlObj = new URL(url);
      return { domain: urlObj.hostname };
    } catch {
      return { domain: 'unknown' };
    }
  }
} 