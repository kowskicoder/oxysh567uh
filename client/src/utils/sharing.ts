// Sharing utilities for social platforms with OG meta support

interface ShareData {
  title: string;
  description: string;
  url: string;
  hashtags?: string[];
}

// Get the current domain for sharing URLs
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return 'https://betchat.com'; // Fallback for SSR
};

// Event sharing functions
export function shareEvent(eventId: string, eventTitle: string, eventDescription?: string) {
  const baseUrl = getBaseUrl();
  const shareUrl = `${baseUrl}/event/${eventId}`;
  
  return {
    shareUrl,
    shareData: {
      title: `${eventTitle} | BetChat`,
      description: eventDescription || `Join this prediction on BetChat! ${eventTitle}`,
      url: shareUrl,
      hashtags: ['BetChat', 'Prediction', 'SocialBetting']
    }
  };
}

// Challenge sharing functions
export function shareChallenge(challengeId: string, challengeTitle: string, stakeAmount?: string) {
  const baseUrl = getBaseUrl();
  const shareUrl = `${baseUrl}/challenge/${challengeId}`;
  
  return {
    shareUrl,
    shareData: {
      title: `Challenge: ${challengeTitle} | BetChat`,
      description: `Accept this challenge on BetChat! ${challengeTitle}${stakeAmount ? ` - ₦${stakeAmount} at stake` : ''}`,
      url: shareUrl,
      hashtags: ['BetChat', 'Challenge', 'SocialBetting']
    }
  };
}

// Referral sharing functions
export function shareReferral(referralCode: string, userName?: string) {
  const baseUrl = getBaseUrl();
  const shareUrl = `${baseUrl}/invite/${referralCode}`;
  
  return {
    shareUrl,
    shareData: {
      title: `Join BetChat with ${userName || 'my'} invite!`,
      description: `${userName || 'I'} invited you to join BetChat - the social betting platform! Get bonus points when you sign up.`,
      url: shareUrl,
      hashtags: ['BetChat', 'Referral', 'JoinNow']
    }
  };
}

// Profile sharing functions
export function shareProfile(userId: string, userName?: string) {
  const baseUrl = getBaseUrl();
  const shareUrl = `${baseUrl}/profile/${userId}`;
  
  return {
    shareUrl,
    shareData: {
      title: `${userName || 'User'} | BetChat Profile`,
      description: `Check out ${userName || 'this user'}'s profile on BetChat! Join the social betting platform.`,
      url: shareUrl,
      hashtags: ['BetChat', 'Profile', 'SocialBetting']
    }
  };
}

// Platform-specific sharing URLs
export function getTwitterShareUrl(shareData: ShareData): string {
  const text = `${shareData.title}\n\n${shareData.description}`;
  const hashtags = shareData.hashtags?.join(',') || '';
  
  const params = new URLSearchParams({
    text,
    url: shareData.url,
    hashtags
  });
  
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function getFacebookShareUrl(shareData: ShareData): string {
  const params = new URLSearchParams({
    u: shareData.url,
    quote: `${shareData.title} - ${shareData.description}`
  });
  
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function getWhatsAppShareUrl(shareData: ShareData): string {
  const text = `${shareData.title}\n\n${shareData.description}\n\n${shareData.url}`;
  
  const params = new URLSearchParams({
    text
  });
  
  return `https://wa.me/?${params.toString()}`;
}

export function getTelegramShareUrl(shareData: ShareData): string {
  const text = `${shareData.title}\n\n${shareData.description}`;
  
  const params = new URLSearchParams({
    text,
    url: shareData.url
  });
  
  return `https://t.me/share/url?${params.toString()}`;
}

export function getLinkedInShareUrl(shareData: ShareData): string {
  const params = new URLSearchParams({
    url: shareData.url,
    title: shareData.title,
    summary: shareData.description
  });
  
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

// Native Web Share API (for mobile devices)
export async function shareNative(shareData: ShareData): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.description,
        url: shareData.url
      });
      return true;
    } catch (error) {
      console.log('Error sharing:', error);
      return false;
    }
  }
  return false;
}

// Copy to clipboard fallback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    return result;
  }
}

// Generate shareable text with all platform links
export function generateShareText(shareData: ShareData): string {
  return `🎯 ${shareData.title}

${shareData.description}

🔗 ${shareData.url}

📱 Share on:
• Twitter: ${getTwitterShareUrl(shareData)}
• Facebook: ${getFacebookShareUrl(shareData)}
• WhatsApp: ${getWhatsAppShareUrl(shareData)}
• Telegram: ${getTelegramShareUrl(shareData)}

${shareData.hashtags ? '#' + shareData.hashtags.join(' #') : ''}`;
}