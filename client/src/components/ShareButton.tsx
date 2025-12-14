import React, { useState } from 'react';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  MessageCircle, 
  Send, 
  Linkedin, 
  Copy, 
  Check,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  getTwitterShareUrl,
  getFacebookShareUrl,
  getWhatsAppShareUrl,
  getTelegramShareUrl,
  getLinkedInShareUrl,
  shareNative,
  copyToClipboard
} from '@/utils/sharing';

interface ShareButtonProps {
  shareData: {
    title: string;
    description: string;
    url: string;
    hashtags?: string[];
    type?: string; // Added to track content type
    id?: string;   // Added to track content ID
  };
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
  className?: string;
}

export function ShareButton({ 
  shareData, 
  size = 'default', 
  variant = 'outline',
  showLabel = true,
  className 
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async (platform: string, url: string) => {
    try {
      if (platform === 'native') {
        const shared = await shareNative(shareData);
        if (!shared) {
          // Fallback to copy link
          handleCopyLink();
        }
      } else if (platform === 'copy') {
        handleCopyLink();
      } else {
        window.open(url, '_blank', 'width=600,height=400');
      }
    } catch (error) {
      toast({
        title: 'Sharing failed',
        description: 'Unable to share at this time. Please try again.',
        variant: 'destructive'
      });
    }

    // Track sharing action and notify user
    try {
      await fetch('/api/track-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platform,
          contentType: shareData.type || 'general',
          contentId: shareData.id,
          url: shareData.url
        })
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareData.url);
    if (success) {
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy link. Please try manually.',
        variant: 'destructive'
      });
    }
  };

  const shareOptions = [
    {
      label: 'Twitter',
      icon: Twitter,
      url: getTwitterShareUrl(shareData),
      color: 'text-blue-400'
    },
    {
      label: 'Facebook',
      icon: Facebook,
      url: getFacebookShareUrl(shareData),
      color: 'text-blue-600'
    },
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      url: getWhatsAppShareUrl(shareData),
      color: 'text-green-500'
    },
    {
      label: 'Telegram',
      icon: Send,
      url: getTelegramShareUrl(shareData),
      color: 'text-blue-500'
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      url: getLinkedInShareUrl(shareData),
      color: 'text-blue-700'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4" />
          {showLabel && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Share this content</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Native share (mobile) */}
        {navigator.share && (
          <>
            <DropdownMenuItem
              onClick={() => handleShare('native', '')}
              className="cursor-pointer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Share...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Social platforms */}
        {shareOptions.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onClick={() => handleShare(option.label.toLowerCase(), option.url)}
            className="cursor-pointer"
          >
            <option.icon className={`mr-2 h-4 w-4 ${option.color}`} />
            {option.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Copy link */}
        <DropdownMenuItem
          onClick={() => handleShare('copy', '')}
          className="cursor-pointer"
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact share button for mobile/small spaces
export function CompactShareButton({ shareData, className }: { shareData: ShareButtonProps['shareData'], className?: string }) {
  return (
    <ShareButton 
      shareData={shareData}
      size="sm"
      variant="ghost"
      showLabel={false}
      className={className}
    />
  );
}

// Share button with custom trigger
interface CustomShareButtonProps extends ShareButtonProps {
  children: React.ReactNode;
}

export function CustomShareButton({ shareData, children }: CustomShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async (platform: string, url: string) => {
    try {
      if (platform === 'native') {
        const shared = await shareNative(shareData);
        if (!shared) {
          const success = await copyToClipboard(shareData.url);
          if (success) {
            setCopied(true);
            toast({
              title: 'Link copied!',
              description: 'Share link has been copied to your clipboard.',
            });
            setTimeout(() => setCopied(false), 2000);
          }
        }
      } else if (platform === 'copy') {
        const success = await copyToClipboard(shareData.url);
        if (success) {
          setCopied(true);
          toast({
            title: 'Link copied!',
            description: 'Share link has been copied to your clipboard.',
          });
          setTimeout(() => setCopied(false), 2000);
        }
      } else {
        window.open(url, '_blank', 'width=600,height=400');
      }
    } catch (error) {
      toast({
        title: 'Sharing failed',
        description: 'Unable to share at this time. Please try again.',
        variant: 'destructive'
      });
    }

    // Track sharing action and notify user
    try {
      await fetch('/api/track-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platform,
          contentType: shareData.type || 'general',
          contentId: shareData.id,
          url: shareData.url
        })
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  const shareOptions = [
    {
      label: 'Twitter',
      icon: Twitter,
      url: getTwitterShareUrl(shareData),
      color: 'text-blue-400'
    },
    {
      label: 'Facebook',
      icon: Facebook,
      url: getFacebookShareUrl(shareData),
      color: 'text-blue-600'
    },
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      url: getWhatsAppShareUrl(shareData),
      color: 'text-green-500'
    },
    {
      label: 'Telegram',
      icon: Send,
      url: getTelegramShareUrl(shareData),
      color: 'text-blue-500'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Share this content</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Native share (mobile) */}
        {navigator.share && (
          <>
            <DropdownMenuItem
              onClick={() => handleShare('native', '')}
              className="cursor-pointer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Share...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Social platforms */}
        {shareOptions.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onClick={() => handleShare(option.label.toLowerCase(), option.url)}
            className="cursor-pointer"
          >
            <option.icon className={`mr-2 h-4 w-4 ${option.color}`} />
            {option.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Copy link */}
        <DropdownMenuItem
          onClick={() => handleShare('copy', '')}
          className="cursor-pointer"
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}