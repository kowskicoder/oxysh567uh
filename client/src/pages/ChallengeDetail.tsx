import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import { ChallengeIntentCard } from "@/components/ChallengeIntentCard";
import { SocialMediaShare } from "@/components/SocialMediaShare";
import { ChallengeChat } from "@/components/ChallengeChat";
import { DynamicMetaTags } from "@/components/DynamicMetaTags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayfulLoading } from "@/components/ui/playful-loading";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MessageCircle, 
  Share2, 
  Users, 
  Trophy,
  Clock,
  Eye
} from "lucide-react";

export default function ChallengeDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [showChat, setShowChat] = useState(false);

  const { data: challenge, isLoading, error } = useQuery({
    queryKey: [`/api/challenges/${id}`],
    enabled: !!id,
    retry: false,
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to load challenge details",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <PlayfulLoading type="general" title="Loading Challenge" />
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Challenge Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                The challenge you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  const isParticipant = user?.id === challenge.challenger || user?.id === challenge.challenged;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Dynamic Meta Tags for Social Sharing */}
      <DynamicMetaTags 
        challenge={challenge}
        pageType="challenge"
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Challenges
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Challenge Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Intent Card */}
            <ChallengeIntentCard 
              challenge={challenge} 
              variant="default" 
              showActions={true}
            />

            {/* Challenge Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Challenge Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₦{parseInt(challenge.amount).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Stake</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {challenge.status === 'active' ? 'Live' : challenge.status}
                    </div>
                    <div className="text-sm text-gray-500">Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {challenge.category}
                    </div>
                    <div className="text-sm text-gray-500">Category</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      <Clock className="w-6 h-6 mx-auto" />
                    </div>
                    <div className="text-sm text-gray-500">Time Left</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Sharing & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-500" />
                  Share This Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <SocialMediaShare
                    challenge={challenge}
                    trigger={
                      <Button variant="outline" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Share Challenge
                      </Button>
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowChat(!showChat)}
                    className="gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {showChat ? 'Hide' : 'Show'} Chat
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Users className="w-4 h-4" />
                    Invite Friends
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Spectate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Challenge Description */}
            {challenge.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {challenge.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {(challenge.challengerUser?.username || challenge.challengerUser?.firstName || 'C').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {challenge.challengerUser?.username || challenge.challengerUser?.firstName || 'Challenger'}
                        </div>
                        <div className="text-sm text-gray-500">Challenger</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Challenger</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {(challenge.challengedUser?.username || challenge.challengedUser?.firstName || 'C').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {challenge.challengedUser?.username || challenge.challengedUser?.firstName || 'Challenged'}
                        </div>
                        <div className="text-sm text-gray-500">Challenged</div>
                      </div>
                    </div>
                    <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">Challenged</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Challenge Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Challenge Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-medium">1.</span>
                    <span>Challenge stakes are held in escrow until completion</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-medium">2.</span>
                    <span>Both parties must agree to the challenge terms</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-medium">3.</span>
                    <span>Results are verified by the admin panel</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-medium">4.</span>
                    <span>Winner takes the full stake amount</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Section */}
        {showChat && isParticipant && (
          <div className="mt-8">
            <ChallengeChat 
              challengeId={challenge.id}
              isParticipant={isParticipant}
            />
          </div>
        )}
      </div>
      <MobileNavigation />
    </div>
  );
}