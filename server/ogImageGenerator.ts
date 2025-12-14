import { Request, Response } from 'express';
import { IStorage } from './storage';
import satori from 'satori';
import sharp from 'sharp';

interface ChallengeOGData {
  title: string;
  challenger: string;
  challenged: string;
  amount: string;
  category: string;
  status: string;
}

interface EventOGData {
  title: string;
  category: string;
  entryFee: string;
  participantCount: number;
  status: string;
}

async function generateChallengeSVG(challenge: ChallengeOGData): Promise<string> {
  const statusColor = challenge.status === 'active' ? '#10B981' :
                     challenge.status === 'completed' ? '#8B5CF6' : '#F59E0B';

  const categoryEmoji = getCategoryEmoji(challenge.category);

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background Gradient -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95" />
          <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:0.95" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bgGradient)"/>

      <!-- Card Background -->
      <rect x="100" y="100" width="1000" height="430" rx="20" fill="url(#cardGradient)" stroke="#e2e8f0" stroke-width="2"/>

      <!-- Bantah Logo Area -->
      <rect x="120" y="120" width="960" height="80" rx="10" fill="#6366f1" opacity="0.1"/>
      <text x="140" y="150" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#6366f1">
        🎯 BANTAH CHALLENGE
      </text>
      <text x="140" y="180" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
        Social Betting Platform
      </text>

      <!-- Challenge Title -->
      <text x="140" y="250" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#1e293b">
        ${escapeXML(challenge.title)}
      </text>

      <!-- VS Section -->
      <g transform="translate(140, 300)">
        <!-- Challenger -->
        <circle cx="150" cy="40" r="30" fill="#8b5cf6" opacity="0.2"/>
        <text x="150" y="48" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#8b5cf6">
          ${escapeXML(challenge.challenger.charAt(0).toUpperCase())}
        </text>
        <text x="150" y="85" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1e293b">
          ${escapeXML(challenge.challenger)}
        </text>

        <!-- VS -->
        <text x="300" y="48" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="#ef4444">
          VS
        </text>

        <!-- Challenged -->
        <circle cx="450" cy="40" r="30" fill="#10b981" opacity="0.2"/>
        <text x="450" y="48" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#10b981">
          ${escapeXML(challenge.challenged.charAt(0).toUpperCase())}
        </text>
        <text x="450" y="85" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1e293b">
          ${escapeXML(challenge.challenged)}
        </text>
      </g>

      <!-- Challenge Details -->
      <g transform="translate(140, 420)">
        <!-- Amount -->
        <rect x="0" y="0" width="200" height="60" rx="10" fill="#fbbf24" opacity="0.1"/>
        <text x="20" y="25" font-family="Arial, sans-serif" font-size="14" fill="#92400e">STAKE</text>
        <text x="20" y="45" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#92400e">₦${challenge.amount}</text>

        <!-- Category -->
        <rect x="220" y="0" width="200" height="60" rx="10" fill="#3b82f6" opacity="0.1"/>
        <text x="240" y="25" font-family="Arial, sans-serif" font-size="14" fill="#1d4ed8">CATEGORY</text>
        <text x="240" y="45" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1d4ed8">${categoryEmoji} ${challenge.category}</text>

        <!-- Status -->
        <rect x="440" y="0" width="160" height="60" rx="10" fill="${statusColor}" opacity="0.1"/>
        <text x="460" y="25" font-family="Arial, sans-serif" font-size="14" fill="${statusColor}">STATUS</text>
        <text x="460" y="45" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${statusColor}">${challenge.status.toUpperCase()}</text>
      </g>

      <!-- Call to Action -->
      <text x="950" y="500" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
        Join Bantah to participate!
      </text>
    </svg>
  `;
}

async function generateEventSVG(event: EventOGData): Promise<string> {
  const categoryEmoji = getCategoryEmoji(event.category);

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background Gradient -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95" />
          <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:0.95" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bgGradient)"/>

      <!-- Card Background -->
      <rect x="100" y="100" width="1000" height="430" rx="20" fill="url(#cardGradient)" stroke="#e2e8f0" stroke-width="2"/>

      <!-- Bantah Logo Area -->
      <rect x="120" y="120" width="960" height="80" rx="10" fill="#10b981" opacity="0.1"/>
      <text x="140" y="150" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#10b981">
        🎲 BANTAH EVENT
      </text>
      <text x="140" y="180" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
        Predict & Win
      </text>

      <!-- Event Title -->
      <text x="140" y="270" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#1e293b">
        ${escapeXML(event.title)}
      </text>

      <!-- Event Details -->
      <g transform="translate(140, 320)">
        <!-- Entry Fee -->
        <rect x="0" y="0" width="180" height="60" rx="10" fill="#f59e0b" opacity="0.1"/>
        <text x="20" y="25" font-family="Arial, sans-serif" font-size="14" fill="#92400e">ENTRY FEE</text>
        <text x="20" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#92400e">₦${event.entryFee}</text>

        <!-- Category -->
        <rect x="200" y="0" width="180" height="60" rx="10" fill="#3b82f6" opacity="0.1"/>
        <text x="220" y="25" font-family="Arial, sans-serif" font-size="14" fill="#1d4ed8">CATEGORY</text>
        <text x="220" y="45" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1d4ed8">${categoryEmoji} ${event.category}</text>

        <!-- Participants -->
        <rect x="400" y="0" width="180" height="60" rx="10" fill="#8b5cf6" opacity="0.1"/>
        <text x="420" y="25" font-family="Arial, sans-serif" font-size="14" fill="#7c3aed">PARTICIPANTS</text>
        <text x="420" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#7c3aed">${event.participantCount}</text>

        <!-- Status -->
        <rect x="600" y="0" width="140" height="60" rx="10" fill="#10b981" opacity="0.1"/>
        <text x="620" y="25" font-family="Arial, sans-serif" font-size="14" fill="#059669">STATUS</text>
        <text x="620" y="45" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#059669">${event.status.toUpperCase()}</text>
      </g>

      <!-- Call to Action -->
      <text x="600" y="480" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">
        Join the prediction now!
      </text>
    </svg>
  `;
}


export function setupOGImageRoutes(app: any, storage: IStorage) {
  // Generate OG image for challenges
  app.get('/api/og/challenge/:id', async (req: Request, res: Response) => {
    try {
      const challengeId = parseInt(req.params.id);
      const challenge = await storage.getChallengeById(challengeId);

      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      const challengerName = challenge.challengerUser?.username || challenge.challengerUser?.firstName || 'User';
      const challengedName = challenge.challengedUser?.username || challenge.challengedUser?.firstName || 'User';

      const svgString = await generateChallengeSVG({
        title: challenge.title,
        challenger: challengerName,
        challenged: challengedName,
        amount: challenge.amount,
        category: challenge.category,
        status: challenge.status
      });

      const svgBuffer = await satori(svgString, {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Arial',
            data: await fetch('https://fonts.gstatic.com/s/opensans/v34/mem8YaGs126MiZpBA-UvWbX2vVnXBbWV4y5bp2I.woff2').then(res => res.arrayBuffer()),
            style: 'normal',
            weight: 400,
          },
          {
            name: 'Arial',
            data: await fetch('https://fonts.gstatic.com/s/opensans/v34/mem8YaGs126MiZpBA-UvWbX2vVnXB5WV4y5bp0IA.woff2').then(res => res.arrayBuffer()),
            style: 'normal',
            weight: 'bold',
          },
        ],
      });

      const imageBuffer = await sharp(Buffer.from(svgBuffer)).png().toBuffer();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error generating challenge OG image:', error);
      res.status(500).json({ error: 'Failed to generate image' });
    }
  });

  // Generate OG image for events
  app.get('/api/og/event/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEventById(eventId);

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const svgString = await generateEventSVG({
        title: event.title,
        category: event.category,
        entryFee: event.entryFee,
        participantCount: event.participantCount || 0,
        status: event.status
      });

      const svgBuffer = await satori(svgString, {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Arial',
            data: await fetch('https://fonts.gstatic.com/s/opensans/v34/mem8YaGs126MiZpBA-UvWbX2vVnXBbWV4y5bp2I.woff2').then(res => res.arrayBuffer()),
            style: 'normal',
            weight: 400,
          },
          {
            name: 'Arial',
            data: await fetch('https://fonts.gstatic.com/s/opensans/v34/mem8YaGs126MiZpBA-UvWbX2vVnXB5WV4y5bp0IA.woff2').then(res => res.arrayBuffer()),
            style: 'normal',
            weight: 'bold',
          },
        ],
      });

      const imageBuffer = await sharp(Buffer.from(svgBuffer)).png().toBuffer();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error generating event OG image:', error);
      res.status(500).json({ error: 'Failed to generate image' });
    }
  });
}

// Helper functions
function getCategoryEmoji(category: string): string {
  const categoryEmojis: { [key: string]: string } = {
    'crypto': '₿',
    'sports': '⚽',
    'gaming': '🎮',
    'music': '🎵',
    'politics': '🗳️',
    'entertainment': '🎬',
    'technology': '💻',
    'finance': '💰',
    'news': '📰',
    'general': '🎯'
  };

  return categoryEmojis[category.toLowerCase()] || '🎯';
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}