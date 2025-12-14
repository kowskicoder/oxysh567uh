// Helper functions for integrating sharing functionality into existing components

import { shareEvent, shareChallenge, shareReferral, shareProfile } from './sharing';

// Helper to add sharing to existing components without breaking their structure
export function withEventSharing(eventId: string | number, title: string, description?: string) {
  return shareEvent(eventId.toString(), title, description);
}

export function withChallengeSharing(challengeId: string | number, title: string, stakeAmount?: string) {
  return shareChallenge(challengeId.toString(), title, stakeAmount);
}

export function withReferralSharing(referralCode: string, userName?: string) {
  return shareReferral(referralCode, userName);
}

export function withProfileSharing(userId: string, userName?: string) {
  return shareProfile(userId, userName);
}

// Generate share URLs for direct use in links or buttons
export function getEventShareUrl(eventId: string | number): string {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}` 
    : 'https://betchat.com';
  return `${baseUrl}/event/${eventId}`;
}

export function getChallengeShareUrl(challengeId: string | number): string {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}` 
    : 'https://betchat.com';
  return `${baseUrl}/challenge/${challengeId}`;
}

export function getReferralShareUrl(referralCode: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}` 
    : 'https://betchat.com';
  return `${baseUrl}/invite/${referralCode}`;
}

export function getProfileShareUrl(userId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}` 
    : 'https://betchat.com';
  return `${baseUrl}/profile/${userId}`;
}

// Quick share functions for common social platforms
export function shareOnTwitter(shareData: { title: string; description: string; url: string; hashtags?: string[] }) {
  const text = `${shareData.title}\n\n${shareData.description}`;
  const hashtags = shareData.hashtags?.join(',') || '';
  
  const params = new URLSearchParams({
    text,
    url: shareData.url,
    hashtags
  });
  
  window.open(`https://twitter.com/intent/tweet?${params.toString()}`, '_blank', 'width=600,height=400');
}

export function shareOnWhatsApp(shareData: { title: string; description: string; url: string }) {
  const text = `${shareData.title}\n\n${shareData.description}\n\n${shareData.url}`;
  
  const params = new URLSearchParams({
    text
  });
  
  window.open(`https://wa.me/?${params.toString()}`, '_blank');
}

export function shareOnTelegram(shareData: { title: string; description: string; url: string }) {
  const text = `${shareData.title}\n\n${shareData.description}`;
  
  const params = new URLSearchParams({
    text,
    url: shareData.url
  });
  
  window.open(`https://t.me/share/url?${params.toString()}`, '_blank');
}

// Copy share link to clipboard with user feedback
export async function copyShareLink(url: string, toastFunction?: (message: { title: string; description: string; variant?: string }) => void): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    if (toastFunction) {
      toastFunction({
        title: 'Link copied!',
        description: 'Share link has been copied to your clipboard.'
      });
    }
    return true;
  } catch (error) {
    if (toastFunction) {
      toastFunction({
        title: 'Copy failed',
        description: 'Unable to copy link. Please try manually.',
        variant: 'destructive'
      });
    }
    return false;
  }
}