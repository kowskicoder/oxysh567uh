import { storage } from "./storage";

interface OGMetaData {
  title: string;
  description: string;
  image?: string;
  url: string;
  type: string;
  siteName: string;
  twitterCard: string;
  twitterSite?: string;
}

// Generate dynamic OG image URLs (using a service like og-image.vercel.app or similar)
function generateOGImage(type: string, data: any): string {
  const baseUrl = process.env.OG_IMAGE_BASE_URL || 'https://og-image.vercel.app';

  switch (type) {
    case 'event':
      return `${baseUrl}/${encodeURIComponent(data.title)}.png?theme=light&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-black.svg`;
    case 'challenge':
      return `${baseUrl}/Challenge%3A%20${encodeURIComponent(data.title)}.png?theme=dark&md=1&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg`;
    case 'referral':
      return `${baseUrl}/Join%20BetChat%20-%20${encodeURIComponent(data.username)}'s%20Invite.png?theme=light&md=1&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-black.svg`;
    case 'profile':
      return `${baseUrl}/${encodeURIComponent(data.username)}%20on%20BetChat.png?theme=light&md=1&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-black.svg`;
    default:
      return `${baseUrl}/BetChat%20-%20Social%20Betting%20Platform.png?theme=light&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-black.svg`;
  }
}

export async function generateEventOGMeta(eventId: string, baseUrl: string): Promise<OGMetaData> {
  try {
    console.log(`[OG META] Getting event ${eventId}`);
    const event = await storage.getEventById(parseInt(eventId));
    console.log(`[OG META] Event found:`, event ? event.title : 'null');

    if (!event) {
      throw new Error('Event not found');
    }

    const participants = await storage.getEventParticipants(parseInt(eventId));
    console.log(`[OG META] Participants count: ${participants.length}`);

    return {
      title: `${event.title} | Bantah`,
      description: `🎲 EVENT: "${event.title}" - Join ${participants.length} participants predicting this ${event.category || 'prediction'} event. Entry: ₦${event.entryFee}`,
      image: `${baseUrl}/api/og/event/${eventId}`,
      url: `${baseUrl}/events/${eventId}`,
      type: 'article',
      siteName: 'Bantah',
      twitterCard: 'summary_large_image',
      twitterSite: '@BantahApp'
    };
  } catch (error) {
    console.log(`[OG META] Error generating event OG meta:`, error);
    return getDefaultOGMeta(baseUrl);
  }
}

export async function generateChallengeOGMeta(challengeId: string, baseUrl: string): Promise<OGMetaData> {
  try {
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const challenger = await storage.getUser(challenge.challengerId);
    const challenged = challenge.challengedId ? await storage.getUser(challenge.challengedId) : null;

    const statusText = challenge.status === 'pending' ? 'Open Challenge' : 
                     challenge.status === 'active' ? 'Active Challenge' : 
                     challenge.status === 'completed' ? 'Completed Challenge' : 'Challenge';

    const description = challenged 
      ? `${challenger?.firstName || 'Someone'} challenged ${challenged.firstName || 'someone'} with ₦${challenge.stakeAmount} at stake. ${challenge.description || ''}`.slice(0, 160)
      : `${challenger?.firstName || 'Someone'} created an open challenge with ₦${challenge.stakeAmount} at stake. ${challenge.description || ''}`.slice(0, 160);

    return {
      title: `${statusText}: ${challenge.title} | Bantah`,
      description,
      image: `${baseUrl}/api/og/challenge/${challengeId}`,
      url: `${baseUrl}/challenges/${challengeId}`,
      type: 'article',
      siteName: 'Bantah',
      twitterCard: 'summary_large_image',
      twitterSite: '@BantahApp'
    };
  } catch (error) {
    return getDefaultOGMeta(baseUrl);
  }
}

export async function generateReferralOGMeta(referralCode: string, baseUrl: string): Promise<OGMetaData> {
  try {
    const user = await storage.getUserByReferralCode(referralCode);
    if (!user) {
      throw new Error('Referral code not found');
    }

    return {
      title: `Join Bantah with ${user.firstName || user.username}'s invite | Bantah`,
      description: `${user.firstName || user.username} invited you to join Bantah - the social betting platform! Get bonus points when you sign up with this referral link. Start betting on events and challenging friends!`,
      image: generateOGImage('referral', { username: user.firstName || user.username }),
      url: `${baseUrl}?ref=${referralCode}`,
      type: 'website',
      siteName: 'Bantah',
      twitterCard: 'summary_large_image',
      twitterSite: '@BantahApp'
    };
  } catch (error) {
    return getDefaultOGMeta(baseUrl);
  }
}

export async function generateProfileOGMeta(userId: string, baseUrl: string): Promise<OGMetaData> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stats = await storage.getUserStats(userId);
    const level = user.level || 1;
    const points = user.points || 0;

    return {
      title: `${user.firstName || user.username} | Bantah Profile`,
      description: `Check out ${user.firstName || user.username}'s profile on Bantah! Level ${level} • ${points} points • Join the social betting platform and start challenging friends!`,
      image: generateOGImage('profile', { username: user.firstName || user.username }),
      url: `${baseUrl}/profile/${userId}`,
      type: 'profile',
      siteName: 'Bantah',
      twitterCard: 'summary_large_image',
      twitterSite: '@BantahApp'
    };
  } catch (error) {
    return getDefaultOGMeta(baseUrl);
  }
}

export function getDefaultOGMeta(baseUrl: string): OGMetaData {
  return {
    title: 'Bantah - Social Betting Platform',
    description: 'Join Bantah, the ultimate social betting platform! Create predictions, challenge friends, and earn rewards. Start betting on events and build your reputation in our vibrant community.',
    image: generateOGImage('default', {}),
    url: baseUrl,
    type: 'website',
    siteName: 'Bantah',
    twitterCard: 'summary_large_image',
    twitterSite: '@BantahApp'
  };
}

export function generateOGMetaTags(meta: OGMetaData): string {
  return `
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${meta.type}" />
    <meta property="og:url" content="${meta.url}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image" content="${meta.image}" />
    <meta property="og:site_name" content="${meta.siteName}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="${meta.twitterCard}" />
    <meta name="twitter:url" content="${meta.url}" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta name="twitter:image" content="${meta.image}" />
    ${meta.twitterSite ? `<meta name="twitter:site" content="${meta.twitterSite}" />` : ''}

    <!-- General -->
    <meta name="title" content="${meta.title}" />
    <meta name="description" content="${meta.description}" />

    <!-- Additional SEO -->
    <link rel="canonical" href="${meta.url}" />
    <meta name="robots" content="index, follow" />
  `.trim();
}