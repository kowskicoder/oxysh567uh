
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Eye,
  Clock,
  Star,
  TrendingUp,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  duration: number; // in seconds
  viewCount: number;
  createdAt: string;
  isActive: boolean;
  category: 'announcement' | 'update' | 'tip' | 'celebration' | 'general';
}

interface StoryView {
  id: number;
  storyId: number;
  userId: string;
  viewedAt: string;
}

export default function Stories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: stories = [], isLoading, error } = useQuery({
    queryKey: ["/api/stories"],
    retry: false,
  });

  // Ensure stories is always an array
  const storiesArray = Array.isArray(stories) ? stories : [];
  const activeStories = storiesArray.filter((story: Story) => story.isActive);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying && selectedStory) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (selectedStory.duration * 10));
          if (newProgress >= 100) {
            handleNextStory();
            return 0;
          }
          return newProgress;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, selectedStory]);

  const handleStoryClick = (story: Story, index: number) => {
    setSelectedStory(story);
    setCurrentStoryIndex(index);
    setProgress(0);
    setIsPlaying(true);
    
    // Mark as viewed (API call would go here)
    // markStoryAsViewed(story.id);
  };

  const handleNextStory = () => {
    if (currentStoryIndex < activeStories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setSelectedStory(activeStories[nextIndex]);
      setCurrentStoryIndex(nextIndex);
      setProgress(0);
    } else {
      setSelectedStory(null);
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setSelectedStory(activeStories[prevIndex]);
      setCurrentStoryIndex(prevIndex);
      setProgress(0);
    }
  };

  const closeStoryViewer = () => {
    setSelectedStory(null);
    setIsPlaying(false);
    setProgress(0);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement': return <Zap className="w-4 h-4" />;
      case 'update': return <TrendingUp className="w-4 h-4" />;
      case 'tip': return <Star className="w-4 h-4" />;
      case 'celebration': return <Star className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement': return 'from-red-500 to-pink-500';
      case 'update': return 'from-blue-500 to-cyan-500';
      case 'tip': return 'from-yellow-500 to-orange-500';
      case 'celebration': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Bantah Stories
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Please log in to view the latest updates and announcements
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Bantah Stories 📱
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Latest updates, announcements, and tips from the Bantah team
          </p>
        </div>

        {/* Stories Grid */}
        {activeStories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Eye className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No Stories Available
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Check back later for new updates and announcements!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeStories.map((story: Story, index: number) => (
              <Card
                key={story.id}
                className="cursor-pointer hover:scale-105 transition-transform duration-200 overflow-hidden"
                onClick={() => handleStoryClick(story, index)}
              >
                <div className={`h-48 bg-gradient-to-br ${getCategoryColor(story.category)} relative`}>
                  {story.imageUrl ? (
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: story.backgroundColor || undefined,
                        color: story.textColor || 'white'
                      }}
                    >
                      <div className="text-center p-4">
                        <div className="mb-2">
                          {getCategoryIcon(story.category)}
                        </div>
                        <h3 className="font-bold text-sm leading-tight">
                          {story.title}
                        </h3>
                      </div>
                    </div>
                  )}
                  
                  {/* Story overlay */}
                  <div className="absolute inset-0 bg-black/20" />
                  
                  {/* Category badge */}
                  <Badge 
                    className="absolute top-2 right-2 text-xs"
                    variant="secondary"
                  >
                    {story.category}
                  </Badge>
                  
                  {/* View count */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                    <Eye className="w-3 h-3" />
                    {story.viewCount}
                  </div>
                  
                  {/* Time */}
                  <div className="absolute bottom-2 right-2 text-white text-xs">
                    {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Progress Bar */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={closeStoryViewer}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Navigation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevStory}
            disabled={currentStoryIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextStory}
            disabled={currentStoryIndex === activeStories.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>

          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>

          {/* Story Content */}
          <div className="max-w-md w-full mx-4">
            <div 
              className={`h-[70vh] rounded-lg overflow-hidden ${
                selectedStory.imageUrl 
                  ? 'bg-cover bg-center' 
                  : `bg-gradient-to-br ${getCategoryColor(selectedStory.category)}`
              }`}
              style={{ 
                backgroundImage: selectedStory.imageUrl ? `url(${selectedStory.imageUrl})` : undefined,
                backgroundColor: selectedStory.backgroundColor || undefined,
              }}
            >
              <div className="h-full flex flex-col justify-between p-6 bg-black/20">
                {/* Header */}
                <div className="flex items-center gap-3 text-white">
                  <Avatar className="w-10 h-10 border-2 border-white">
                    <AvatarImage src="/assets/bantahblue.svg" />
                    <AvatarFallback>BA</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">Bantah Official</p>
                    <p className="text-sm opacity-80">
                      {formatDistanceToNow(new Date(selectedStory.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="text-center text-white">
                  <h2 
                    className="text-2xl font-bold mb-4"
                    style={{ color: selectedStory.textColor || 'white' }}
                  >
                    {selectedStory.title}
                  </h2>
                  <p 
                    className="text-lg leading-relaxed"
                    style={{ color: selectedStory.textColor || 'white' }}
                  >
                    {selectedStory.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-white text-sm">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(selectedStory.category)}
                    <span className="capitalize">{selectedStory.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedStory.viewCount} views
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
