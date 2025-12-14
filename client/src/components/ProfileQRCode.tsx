
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Share2, Download, Copy, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import QRCode from 'qrcode';
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl } from "@/utils/avatarUtils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileQRCodeProps {
  trigger?: React.ReactNode;
  username?: string;
  fullName?: string;
  profileImageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfileQRCode({ 
  trigger, 
  username, 
  fullName, 
  profileImageUrl,
  size = 'md' 
}: ProfileQRCodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Use provided props or fall back to current user
  const displayUsername = username || user?.username;
  const displayName = fullName || user?.firstName || user?.username;
  const displayProfileImage = profileImageUrl || user?.profileImageUrl;
  const userId = user?.id;

  const profileUrl = `${window.location.origin}/@${displayUsername}`;

  useEffect(() => {
    if (isOpen && displayUsername) {
      generateCustomQRCode();
    }
  }, [isOpen, displayUsername]);

  const generateCustomQRCode = async () => {
    if (!displayUsername) return;
    
    setIsGenerating(true);
    try {
      // Generate QR code with custom styling
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 800; // Higher resolution for better quality
      const qrSize = 600;
      const borderSize = (size - qrSize) / 2;
      canvas.width = size;
      canvas.height = size;
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Create premium gradient background with multiple stops
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#7440ff');
      gradient.addColorStop(0.3, '#8b5cf6');
      gradient.addColorStop(0.7, '#a3e635');
      gradient.addColorStop(1, '#ccff00');
      
      // Draw rounded background with larger radius for modern look
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, 48);
      ctx.fill();
      
      // Add subtle inner shadow effect
      const shadowGradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      shadowGradient.addColorStop(0, 'rgba(0,0,0,0)');
      shadowGradient.addColorStop(0.8, 'rgba(0,0,0,0)');
      shadowGradient.addColorStop(1, 'rgba(0,0,0,0.1)');
      
      ctx.fillStyle = shadowGradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, 48);
      ctx.fill();

      // Generate base QR code with rounded design
      const qrDataUrl = await QRCode.toDataURL(profileUrl, {
        width: qrSize,
        margin: 1,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H', // High error correction for logo overlay
      });

      // Load QR code image
      const qrImage = new Image();
      qrImage.onload = async () => {
        // Draw white background for QR code with rounded corners
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(borderSize, borderSize, qrSize, qrSize, 16);
        ctx.fill();

        // Draw QR code
        ctx.drawImage(qrImage, borderSize, borderSize, qrSize, qrSize);

        // Custom corner frames with rounded design
        const cornerSize = 48;
        const cornerRadius = 12;
        const frameWidth = 3;

        // Function to draw rounded corner frame with modern design
        const drawRoundedCornerFrame = (x: number, y: number) => {
          // Outer rounded frame
          ctx.fillStyle = '#7440ff';
          ctx.beginPath();
          ctx.roundRect(x, y, cornerSize, cornerSize, cornerRadius);
          ctx.fill();
          
          // Inner white rounded space
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(x + frameWidth, y + frameWidth, cornerSize - frameWidth * 2, cornerSize - frameWidth * 2, cornerRadius - 2);
          ctx.fill();
          
          // Inner rounded dot
          const dotSize = 16;
          const dotX = x + (cornerSize - dotSize) / 2;
          const dotY = y + (cornerSize - dotSize) / 2;
          ctx.fillStyle = '#7440ff';
          ctx.beginPath();
          ctx.roundRect(dotX, dotY, dotSize, dotSize, 4);
          ctx.fill();
        };

        // Draw custom corner frames
        drawRoundedCornerFrame(borderSize + 20, borderSize + 20); // Top left
        drawRoundedCornerFrame(borderSize + qrSize - cornerSize - 20, borderSize + 20); // Top right
        drawRoundedCornerFrame(borderSize + 20, borderSize + qrSize - cornerSize - 20); // Bottom left

        // Enhanced central logo area
        const logoSize = 90;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        // Draw outer glow effect
        const outerGlow = ctx.createRadialGradient(
          logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 10,
          logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5
        );
        outerGlow.addColorStop(0, 'rgba(116, 64, 255, 0.3)');
        outerGlow.addColorStop(1, 'rgba(116, 64, 255, 0)');
        
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5, 0, 2 * Math.PI);
        ctx.fill();

        // Draw background circle with brand gradient
        const logoGradient = ctx.createRadialGradient(
          logoX + logoSize / 2, logoY + logoSize / 2, 0,
          logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2
        );
        logoGradient.addColorStop(0, '#ccff00');
        logoGradient.addColorStop(1, '#7440ff');
        
        ctx.fillStyle = logoGradient;
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, 2 * Math.PI);
        ctx.fill();

        // Draw inner white circle for contrast
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 8, 0, 2 * Math.PI);
        ctx.fill();

        // Draw inner brand circle
        ctx.fillStyle = '#7440ff';
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 12, 0, 2 * Math.PI);
        ctx.fill();

        // Load and draw Bantah logo or fallback
        try {
          const logoImage = new Image();
          logoImage.onload = () => {
            const logoDrawSize = 54;
            const logoDrawX = logoX + (logoSize - logoDrawSize) / 2;
            const logoDrawY = logoY + (logoSize - logoDrawSize) / 2;
            
            // Create circular clipping mask for logo
            ctx.save();
            ctx.beginPath();
            ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoDrawSize / 2, 0, 2 * Math.PI);
            ctx.clip();
            
            // Draw logo
            ctx.drawImage(logoImage, logoDrawX, logoDrawY, logoDrawSize, logoDrawSize);
            ctx.restore();

            // Convert final canvas to data URL
            setQrCodeDataUrl(canvas.toDataURL('image/png', 0.95));
          };
          logoImage.onerror = () => {
            // Fallback: draw stylized "B" if logo fails to load
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('B', logoX + logoSize / 2, logoY + logoSize / 2);
            
            // Add small text below
            ctx.font = 'bold 8px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('BANTAH', logoX + logoSize / 2, logoY + logoSize / 2 + 16);
            
            setQrCodeDataUrl(canvas.toDataURL('image/png', 0.95));
          };
          logoImage.src = '/assets/bantahlogo.png';
        } catch (error) {
          // Ultimate fallback
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('B', logoX + logoSize / 2, logoY + logoSize / 2);
          ctx.font = 'bold 8px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('BANTAH', logoX + logoSize / 2, logoY + logoSize / 2 + 16);
          setQrCodeDataUrl(canvas.toDataURL('image/png', 0.95));
        }
      };
      qrImage.src = qrDataUrl;

    } catch (error) {
      console.error('Error generating custom QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl || !displayUsername) return;

    const link = document.createElement('a');
    link.download = `${displayUsername}-bantah-profile-qr.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded!",
      description: "Custom QR code saved to your downloads.",
    });
  };

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link Copied!",
        description: "Profile link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Bantah Profile`,
          text: `Check out my profile on Bantah!`,
          url: profileUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        copyProfileLink();
      }
    } else {
      copyProfileLink();
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      className="flex items-center gap-2 rounded-xl"
    >
      <QrCode className={sizeClasses[size]} />
      {size !== 'sm' && 'QR Code'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px] p-0 bg-white dark:bg-slate-900 border-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            Share Profile
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Compact Profile Preview */}
          <div className="flex items-center gap-3 justify-center">
            <Avatar className="w-12 h-12">
              <AvatarImage 
                src={getAvatarUrl(userId, displayProfileImage, displayName)} 
                alt={displayName || 'User'} 
              />
              <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {(displayName?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {displayName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                @{displayUsername}
              </p>
            </div>
          </div>

          {/* Custom Branded QR Code Display */}
          <div className="text-center">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-56 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-300 border-t-[#7440ff]"></div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 font-medium">
                  Creating your branded QR code...
                </p>
              </div>
            ) : qrCodeDataUrl ? (
              <div className="space-y-4">
                <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mx-auto inline-block">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Custom Bantah Profile QR Code" 
                    className="w-56 h-56 mx-auto rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Scan to visit my Bantah profile
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    @{displayUsername}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-56 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl">
                <QrCode className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Failed to generate QR code
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Please try again
                </p>
              </div>
            )}
          </div>

          {/* Compact Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadQRCode}
              disabled={!qrCodeDataUrl || isGenerating}
              className="flex-1 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3 h-3 mr-1" />
              Save
            </Button>
            
            <Button
              variant="outline"
              onClick={copyProfileLink}
              className="flex-1 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-700"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            
            <Button
              onClick={shareProfile}
              className="flex-1 h-9 text-xs rounded-lg text-white"
              style={{ backgroundColor: '#7440ff' }}
            >
              <Share2 className="w-3 h-3 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProfileQRCode;
