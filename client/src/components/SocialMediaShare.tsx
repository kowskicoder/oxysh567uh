import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChallengeIntentCard } from "@/components/ChallengeIntentCard";
import { 
  Share2, 
  Copy, 
  MessageCircle, 
  Send,
  ExternalLink,
  Check,
  Eye,
  Smartphone,
  Monitor
} from "lucide-react";
import { 
  SiX, 
  SiFacebook, 
  SiWhatsapp, 
  SiTelegram, 
  SiInstagram,
  SiTiktok
} from "react-icons/si";

interface SocialMediaShareProps {
  challenge: {
    id: number;
    title: string;
    description?: string;
    category: string;
    amount: string;
    challengerUser: {
      username?: string;
      firstName?: string;
    };
    challengedUser: {
      username?: string;
      firstName?: string;
    };
    status: string;
    dueDate?: string;
  };
  trigger?: React.ReactNode;
}

export function SocialMediaShare({ challenge, trigger }: SocialMediaShareProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const challengeUrl = `${window.location.origin}/challenges/${challenge.id}`;
  
  const getChallengerName = () => {
    return challenge.challengerUser.username || challenge.challengerUser.firstName || 'User';
  };

  const getChallengedName = () => {
    return challenge.challengedUser.username || challenge.challengedUser.firstName || 'User';
  };

  const generateShareText = (platform: string) => {
    const challengerName = getChallengerName();
    const challengedName = getChallengedName();
    const amount = challenge.amount;
    const title = challenge.title;
    const category = challenge.category;

    const baseText = `🎯 CHALLENGE ALERT!\n\n"${title}"\n\n${challengerName} vs ${challengedName}\n💰 Stake: ₦${amount}\n📂 Category: ${category}\n\n`;
    
    switch (platform) {
      case 'twitter':
        return `${baseText}Who do you think will win? 🏆\n\n#BetChat #Challenge #Gaming #Nigeria\n\n${challengeUrl}`;
      case 'facebook':
        return `${baseText}Join the excitement and place your predictions! 🚀\n\nWho's your pick to win this challenge?\n\n${challengeUrl}`;
      case 'whatsapp':
        return `${baseText}Join BetChat to watch this epic showdown! 🔥\n\n${challengeUrl}`;
      case 'telegram':
        return `${baseText}Don't miss this epic battle! Join BetChat now! ⚡\n\n${challengeUrl}`;
      case 'instagram':
        return `${baseText}Epic challenge happening now! 🎮\n\n#BetChat #Challenge #Gaming #Nigeria\n\n${challengeUrl}`;
      case 'tiktok':
        return `${baseText}Who's winning this one? 🤔\n\n#BetChat #Challenge #Gaming #FYP\n\n${challengeUrl}`;
      default:
        return `${baseText}Check out this challenge on BetChat!\n\n${challengeUrl}`;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopied(true);
      toast({
        title: "Link Copied! 📋",
        description: "Challenge link has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    const text = generateShareText(platform);
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(challengeUrl);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, so we copy the text
        handleCopyLink();
        toast({
          title: "Text Copied for Instagram! 📱",
          description: "Paste this in your Instagram story or post",
        });
        return;
      case 'tiktok':
        // TikTok doesn't support direct sharing via URL, so we copy the text
        handleCopyLink();
        toast({
          title: "Text Copied for TikTok! 🎵",
          description: "Paste this in your TikTok caption",
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      toast({
        title: "Sharing to " + platform.charAt(0).toUpperCase() + platform.slice(1),
        description: "Opening share dialog...",
      });
    }
  };

  const socialPlatforms = [
    { 
      name: 'Twitter', 
      key: 'twitter', 
      icon: SiX, 
      color: 'text-blue-400 hover:text-blue-300',
      bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    { 
      name: 'Facebook', 
      key: 'facebook', 
      icon: SiFacebook, 
      color: 'text-blue-600 hover:text-blue-500',
      bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    { 
      name: 'WhatsApp', 
      key: 'whatsapp', 
      icon: SiWhatsapp, 
      color: 'text-green-500 hover:text-green-400',
      bgColor: 'hover:bg-green-50 dark:hover:bg-green-900/20'
    },
    { 
      name: 'Telegram', 
      key: 'telegram', 
      icon: SiTelegram, 
      color: 'text-blue-500 hover:text-blue-400',
      bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    { 
      name: 'Instagram', 
      key: 'instagram', 
      icon: SiInstagram, 
      color: 'text-pink-500 hover:text-pink-400',
      bgColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/20'
    },
    { 
      name: 'TikTok', 
      key: 'tiktok', 
      icon: SiTiktok, 
      color: 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300',
      bgColor: 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share Challenge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Challenge
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Challenge Preview with Different Formats */}
          <Tabs defaultValue="social" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Social
              </TabsTrigger>
              <TabsTrigger value="compact" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Compact
              </TabsTrigger>
              <TabsTrigger value="full" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Full
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="social" className="mt-4">
              <div className="flex justify-center">
                <ChallengeIntentCard 
                  challenge={challenge} 
                  variant="social" 
                  showActions={false}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="compact" className="mt-4">
              <div className="flex justify-center">
                <ChallengeIntentCard 
                  challenge={challenge} 
                  variant="compact" 
                  showActions={false}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="full" className="mt-4">
              <ChallengeIntentCard 
                challenge={challenge} 
                variant="default" 
                showActions={false}
              />
            </TabsContent>
          </Tabs>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Challenge Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={challengeUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm"
              />
              <Button onClick={handleCopyLink} size="sm" variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Social Media Platforms */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share on Social Media</label>
            <div className="grid grid-cols-2 gap-3">
              {socialPlatforms.map((platform) => (
                <Button
                  key={platform.key}
                  variant="outline"
                  className={`justify-start gap-3 h-12 ${platform.bgColor}`}
                  onClick={() => handleShare(platform.key)}
                >
                  <platform.icon className={`w-5 h-5 ${platform.color}`} />
                  <span className="font-medium">{platform.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Additional Actions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">More Options</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: challenge.title,
                      text: generateShareText('general'),
                      url: challengeUrl,
                    });
                  } else {
                    handleCopyLink();
                  }
                }}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Native Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(challengeUrl, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Challenge
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}