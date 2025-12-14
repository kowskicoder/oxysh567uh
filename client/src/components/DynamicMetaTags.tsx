import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface Challenge {
  id: number;
  title: string;
  description?: string;
  category: string;
  amount: string;
  challengerUser: {
    username?: string;
    firstName?: string;
    profileImageUrl?: string;
  };
  challengedUser: {
    username?: string;
    firstName?: string;
    profileImageUrl?: string;
  };
  status: string;
  dueDate?: string;
  createdAt?: string;
}

interface DynamicMetaTagsProps {
  challenge?: Challenge;
  event?: any;
  pageType?: 'challenge' | 'event' | 'profile' | 'default';
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
}

export function DynamicMetaTags({ 
  challenge, 
  event, 
  pageType = 'default',
  customTitle,
  customDescription,
  customImage
}: DynamicMetaTagsProps) {
  const [location] = useLocation();
  
  useEffect(() => {
    const updateMetaTags = () => {
      const baseUrl = window.location.origin;
      let title = customTitle || 'Bantah - Social Betting Platform';
      let description = customDescription || 'Join the ultimate social betting platform. Predict events, challenge friends, and win big.';
      let image = customImage || `${baseUrl}/assets/bantahlogo.png`;
      let url = `${baseUrl}${location}`;

      // Challenge-specific meta tags
      if (pageType === 'challenge' && challenge) {
        const challengerName = challenge.challengerUser.username || challenge.challengerUser.firstName || 'User';
        const challengedName = challenge.challengedUser.username || challenge.challengedUser.firstName || 'User';
        
        title = `${challenge.title} - ${challengerName} vs ${challengedName} | Bantah`;
        description = `🎯 CHALLENGE: "${challenge.title}" - ${challengerName} challenges ${challengedName} for ₦${challenge.amount} in ${challenge.category}. Join Bantah to see the action!`;
        
        // Generate a dynamic challenge image URL (this would be handled by a backend service)
        image = `${window.location.origin}/api/og/challenge/${challenge.id}`;
      }
      
      // Event-specific meta tags
      if (pageType === 'event' && event) {
        title = `${event.title} - Predict & Win | Bantah`;
        description = `🎲 EVENT: "${event.title}" - Join ${event.participantCount || 0} participants predicting this ${event.category} event. Entry: ₦${event.entryFee}`;
        image = `${window.location.origin}/api/og/event/${event.id}`;
      }

      // Update document title
      document.title = title;

      // Update or create meta tags
      const metaTags = [
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: image },
        { property: 'og:url', content: url },
        { property: 'og:type', content: pageType === 'challenge' ? 'article' : 'website' },
        { property: 'og:site_name', content: 'BetChat' },
        { name: 'description', content: description },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: image },
        // Additional tags for better sharing
        { property: 'og:locale', content: 'en_US' },
        { property: 'article:author', content: 'BetChat' },
        { property: 'article:publisher', content: 'BetChat' },
      ];

      metaTags.forEach(({ property, name, content }) => {
        const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
        let meta = document.querySelector(selector) as HTMLMetaElement;
        
        if (!meta) {
          meta = document.createElement('meta');
          if (property) meta.setAttribute('property', property);
          if (name) meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        
        meta.setAttribute('content', content);
      });

      // Add structured data for challenges
      if (pageType === 'challenge' && challenge) {
        const structuredData = {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: challenge.title,
          description: challenge.description || `${challengerName} vs ${challengedName}`,
          startDate: challenge.createdAt,
          endDate: challenge.dueDate,
          location: {
            '@type': 'VirtualLocation',
            name: 'BetChat Platform'
          },
          competitor: [
            {
              '@type': 'Person',
              name: challengerName
            },
            {
              '@type': 'Person',
              name: challengedName
            }
          ],
          offers: {
            '@type': 'Offer',
            price: challenge.amount,
            priceCurrency: 'NGN'
          }
        };

        let script = document.querySelector('script[type="application/ld+json"]');
        if (!script) {
          script = document.createElement('script');
          script.type = 'application/ld+json';
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(structuredData);
      }
    };

    updateMetaTags();
  }, [challenge, event, pageType, customTitle, customDescription, customImage, location]);

  return null; // This component doesn't render anything
}

// Helper function to generate OG image URLs
export const generateOGImageUrl = (type: 'challenge' | 'event', id: number, params?: any) => {
  const baseUrl = `${window.location.origin}/api/og`;
  const queryParams = new URLSearchParams(params || {});
  
  return `${baseUrl}/${type}/${id}?${queryParams.toString()}`;
};

// Default meta tags for the app
export const defaultMetaTags = {
  title: 'BetChat - Social Betting Platform',
  description: 'Join the ultimate social betting platform. Predict events, challenge friends, and win big with real-time chat and gamification features.',
  image: `${window.location.origin}/assets/bantahlogo.png`,
  type: 'website'
};