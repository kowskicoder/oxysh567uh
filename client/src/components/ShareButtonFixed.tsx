import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  shareData: {
    title: string;
    description: string;
    url: string;
    hashtags?: string[];
  };
  className?: string;
}

export function CompactShareButton({ shareData, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Try native sharing first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.description,
          url: shareData.url
        });
        return;
      } catch (error) {
        // User cancelled or sharing failed, fall back to copy
      }
    }

    // Fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy link. Please try manually.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className={`h-8 w-8 p-0 hover:bg-white/20 ${className}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-400" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}