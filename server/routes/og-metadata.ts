import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

// Open Graph metadata fetcher endpoint
router.get('/og-metadata', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BetChat-Bot/1.0 (+https://betchat.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch URL' });
    }

    const html = await response.text();

    // Extract Open Graph metadata
    const ogData: Record<string, string> = {};

    // Basic OG tags
    const ogTags = [
      'og:title',
      'og:description', 
      'og:image',
      'og:url',
      'og:type',
      'og:site_name'
    ];

    // Twitter Card tags as fallback
    const twitterTags = [
      'twitter:title',
      'twitter:description',
      'twitter:image', 
      'twitter:card'
    ];

    // Standard HTML tags as additional fallback
    const htmlTags = [
      'title',
      'description'
    ];

    // Extract OG tags
    ogTags.forEach(tag => {
      const regex = new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*content=["']([^"']*?)["']`, 'i');
      const match = html.match(regex);
      if (match) {
        const key = tag.replace('og:', '');
        ogData[key] = match[1];
      }
    });

    // Extract Twitter tags as fallback
    twitterTags.forEach(tag => {
      const key = tag.replace('twitter:', '');
      if (!ogData[key]) {
        const regex = new RegExp(`<meta[^>]*name=["']${tag}["'][^>]*content=["']([^"']*?)["']`, 'i');
        const match = html.match(regex);
        if (match) {
          ogData[key] = match[1];
        }
      }
    });

    // Extract title from <title> tag if not found
    if (!ogData.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]*?)<\/title>/i);
      if (titleMatch) {
        ogData.title = titleMatch[1].trim();
      }
    }

    // Extract description from meta description if not found  
    if (!ogData.description) {
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*?)["']/i);
      if (descMatch) {
        ogData.description = descMatch[1];
      }
    }

    // Ensure image URLs are absolute
    if (ogData.image && !ogData.image.startsWith('http')) {
      const baseUrl = new URL(url);
      if (ogData.image.startsWith('/')) {
        ogData.image = `${baseUrl.origin}${ogData.image}`;
      } else {
        ogData.image = `${baseUrl.origin}/${ogData.image}`;
      }
    }

    res.json(ogData);

  } catch (error) {
    console.error('Error fetching OG metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

export default router;