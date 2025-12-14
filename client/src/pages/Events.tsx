import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { MobileNavigation } from "@/components/MobileNavigation";
import { EventCard } from "@/components/EventCard";
import { OnboardingTooltip } from "@/components/OnboardingTooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEventsSearch } from "@/context/EventsSearchContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PlayfulLoading } from "@/components/ui/playful-loading";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ModernCard } from "@/components/ui/modern-card";
import { ModernInput } from "@/components/ui/modern-input";
import { ModernSelect } from "@/components/ui/modern-select";
import { ModernButton } from "@/components/ui/modern-button";
import { Upload, X, Calendar, Users, Trophy, DollarSign, Eye, EyeOff, Tag, Type, FileText } from "lucide-react";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required").optional(),
  category: z.string().min(1, "Category is required"),
  eventType: z.string().min(1, "Event type is required").optional(),
  bannerUrl: z.string().optional(),
  entryFee: z.string().min(1, "Entry fee is required"),
  endDate: z.string().min(1, "End date is required"),
  isPrivate: z.boolean().default(false),
  maxParticipants: z.string().default("100"),
});

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const { searchTerm, setSearchTerm } = useEventsSearch();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [visibleEvents, setVisibleEvents] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerInputType, setBannerInputType] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);

  // Check if user should see onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenEventsOnboarding");
    if (!hasSeenOnboarding && user) {
      setShowOnboarding(true);
    }
  }, [user]);

  // Listen for create dialog open event from mobile navigation
  useEffect(() => {
    const handleOpenCreateDialog = () => {
      setIsCreateDialogOpen(true);
    };

    window.addEventListener("open-create-dialog", handleOpenCreateDialog);
    return () => {
      window.removeEventListener("open-create-dialog", handleOpenCreateDialog);
    };
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenEventsOnboarding", "true");
    setShowOnboarding(false);
  };

  const handleOnboardingClose = () => {
    localStorage.setItem("hasSeenEventsOnboarding", "true");
    setShowOnboarding(false);
  };

  const form = useForm<z.infer<typeof createEventSchema>>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      eventType: "",
      bannerUrl: "",
      entryFee: "",
      endDate: "",
      isPrivate: false,
      maxParticipants: "100",
    },
  });


  const {
    data: events = [],
    isLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  // Personalized recommendations query
  const { data: recommendedEvents, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ["/api/recommendations/events"],
    enabled: !!user && selectedCategory === "all",
    retry: false,
  });

  // Track user interactions for recommendation learning
  const trackInteractionMutation = useMutation({
    mutationFn: async (interactionData: {
      eventId: number;
      interactionType: string;
      timeSpent?: number;
      deviceType?: string;
      referralSource?: string;
    }) => {
      await apiRequest("POST", "/api/recommendations/track", interactionData);
    },
    onError: (error: Error) => {
      console.error("Failed to track interaction:", error);
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createEventSchema>) => {
      // Convert form data to proper format
      const eventData = {
        title: data.title,
        description: data.description,
        category: data.category,
        eventType: data.eventType || 'yes_no',
        entryFee: parseInt(data.entryFee),
        endDate: new Date(data.endDate).toISOString(),
        bannerUrl: data.bannerUrl || '',
        isPrivate: data.isPrivate || false,
        maxParticipants: parseInt(data.maxParticipants) || 100,
      };

      return await apiRequest("POST", "/api/events", eventData);
    },
    onSuccess: () => {
      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      });
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
      setBannerInputType('upload');
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const categories = [
    {
      id: "create",
      label: "Create Event",
      icon: "/assets/create.png",
      gradient: "from-green-400 to-emerald-500",
      isCreate: true,
    },
    {
      id: "all",
      label: "All Events",
      icon: "/assets/eventssvg.svg",
      gradient: "from-blue-400 to-purple-500",
    },

    {
      id: "stories",
      label: "Stories",
      icon: "/assets/news.svg",
      gradient: "from-purple-400 to-pink-500",
      isPage: true,
    },
    {
      id: "pop-culture",
      label: "Pop Culture",
      icon: "/assets/popcorn.svg",
      gradient: "from-pink-400 to-red-500",
    },
    {
      id: "sports",
      label: "Sports",
      icon: "/assets/sportscon.svg",
      gradient: "from-green-400 to-blue-500",
    },
    {
      id: "music",
      label: "Music",
      icon: "/assets/musicsvg.svg",
      gradient: "from-blue-400 to-purple-500",
    },
    {
      id: "gaming",
      label: "Gaming",
      icon: "/assets/gamingsvg.svg",
      gradient: "from-gray-400 to-gray-600",
    },
    {
      id: "crypto",
      label: "Crypto",
      icon: "/assets/cryptosvg.svg",
      gradient: "from-yellow-400 to-orange-500",
    },
    {
      id: "politics",
      label: "Politics",
      icon: "/assets/poltiii.svg",
      gradient: "from-green-400 to-teal-500",
    },
  ];

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === "create") {
       setIsCreateDialogOpen(true);
      return;
    }
    if (categoryId === "bantzz") {
      setLocation('/bantzz');
      return;
    }
    if (categoryId === "stories") {
      setLocation('/stories');
      return;
    }
    setSelectedCategory(categoryId);
    setCategoryFilter(categoryId);
  };

  // Track user interaction helper
  const trackInteraction = (eventId: number, interactionType: 'view' | 'like' | 'share' | 'join' | 'skip', timeSpent?: number) => {
    if (user) {
      trackInteractionMutation.mutate({
        eventId,
        interactionType,
        timeSpent,
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
        referralSource: selectedCategory === 'all' ? 'recommendation' : 'category_filter'
      });
    }
  };

  const filteredEvents = useMemo(() => {
    return (events as any[]).filter((event: any) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        event.title.toLowerCase().includes(searchLower) ||
        (event.description || "").toLowerCase().includes(searchLower) ||
        event.category.toLowerCase().includes(searchLower);
      const matchesCategory =
        categoryFilter === "all" || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, categoryFilter]);

  const displayedEvents = filteredEvents.slice(0, visibleEvents);
  const hasMoreEvents = visibleEvents < filteredEvents.length;

  const loadMoreEvents = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleEvents((prev: number) =>
        Math.min(prev + 12, filteredEvents.length),
      );
      setIsLoadingMore(false);
    }, 500);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof createEventSchema>) => {
    if (!data.title || !data.description || !data.category || !data.entryFee || !data.endDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    let finalBannerUrl = data.bannerUrl || "";

    // If user selected an image, upload it first
    if (selectedImage) {
      const uploadedImageUrl = await uploadImage(selectedImage);
      if (uploadedImageUrl) {
        finalBannerUrl = uploadedImageUrl;
      }
    }

    createEventMutation.mutate({
      ...data,
      bannerUrl: finalBannerUrl,
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      <div className="max-w-7xl mx-auto px-3 md:px-4 sm:px-6 lg:px-8 py-3 md:py-8">
        <div className="mb-6">
          {/* Category Bar */}
          <div className="sticky top-16 bg-slate-50 dark:bg-slate-900 z-40 py-2.5">
            <div className="container mx-auto px-4">
              <div className="flex md:justify-center overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/20 gap-3">
                <div className="flex gap-2 md:max-w-[800px]">
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className="flex-shrink-0 flex flex-col items-center relative pt-1"
                    >
                      <div className="relative">
                        {/* Gradient outline container */}
                        <div
                          className={`w-14 h-14 rounded-full relative
                            ${selectedCategory === category.id ? "opacity-100" : "opacity-100"}
                            transition-all duration-300`}
                        >
                          {/* Gradient border */}
                          <div
                            className={`absolute inset-0 rounded-full bg-gradient-to-r ${category.gradient}`}
                          />

                          {/* Inner circle with icon */}
                          <div
                            className={`absolute inset-[1px] rounded-full
                              flex items-center justify-center
                              bg-slate-50 dark:bg-slate-900
                              ${selectedCategory === category.id ? "scale-105" : "scale-100"}
                              transition-all duration-300`}
                          >
                            <img
                              src={category.icon}
                              alt={category.label}
                              className="w-7 h-7"
                            />
                          </div>
                        </div>

                        {/* Category Label Badge */}
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 z-10">
                          <div
                            className={`px-2 py-0.5 rounded-full text-[8px] font-sans font-medium whitespace-nowrap
                              bg-white dark:bg-slate-800
                              ${selectedCategory === category.id ? "text-black dark:text-white" : "text-black/60 dark:text-white/60"}
                              transition-all duration-300`}
                          >
                            {category.label}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Personalized Recommendations Section */}
        {selectedCategory === "all" && recommendedEvents && recommendedEvents.length > 0 && !searchTerm && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <i className="fas fa-magic text-white text-xs"></i>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recommended for You
              </h2>
              <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  Smart Picks
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-2 mb-6">
              {recommendedEvents.slice(0, 4).map((event: any) => (
                <div key={event.id} onClick={() => trackInteraction(event.id, 'view')}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>

            {recommendedEvents.length > 4 && (
              <div className="text-center mb-4">
                <button
                  onClick={() => {
                    // Show all recommendations
                    const allRecommended = recommendedEvents.slice(4);
                    // Track interaction
                    trackInteraction(recommendedEvents[0]?.id || 0, 'view');
                  }}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                >
                  View {recommendedEvents.length - 4} more personalized picks →
                </button>
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                <i className="fas fa-fire text-white text-xs"></i>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                All Events
              </h2>
            </div>
          </div>
        )}

        {/* Events Grid */}
        {isLoading ? (
          <PlayfulLoading
            type={"events" as any}
            title="Loading Events"
            description="Finding exciting prediction challenges..."
            className="py-12"
          />
        ) : filteredEvents.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="text-center py-10 flex flex-col items-center justify-center">
              <img
                src="/assets/noti-lonely.svg"
                alt="Calend"
                className="w-12 h-12 mb-3"
              />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
                No events found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your filters to see more events."
                  : "Be the first to create an event!"}
              </p>
              {!searchTerm && categoryFilter === "all" && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-[#7440ff] text-white hover:bg-[#7440ff] mt-1"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create Event
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              id="events-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-2"
            >
              {displayedEvents.map((event: any, index: number) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMoreEvents && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMoreEvents}
                  disabled={isLoadingMore}
                  className="bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-2xl"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Load More Events ({filteredEvents.length -
                        visibleEvents}{" "}
                      remaining)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <MobileNavigation onCreateClick={() => setIsCreateDialogOpen(true)} />

      {/* Onboarding Tooltip */}
      <OnboardingTooltip
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-bold text-center">
                  Create New Event
                </DialogTitle>
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </DialogHeader>


              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs font-medium text-gray-600 dark:text-gray-400">Event Title *</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      placeholder="What will people predict?"
                      className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 placeholder:text-xs dark:placeholder:text-gray-500"
                    />
                    {form.formState.errors.title && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-medium text-gray-600 dark:text-gray-400">Description *</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Provide details about the event..."
                      className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 min-h-[80px] resize-none text-sm placeholder:text-gray-400 placeholder:text-xs dark:placeholder:text-gray-500"
                    />
                    {form.formState.errors.description && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-xs font-medium text-gray-600 dark:text-gray-400">Category *</Label>
                      <Select onValueChange={(value) => form.setValue("category", value)}>
                        <SelectTrigger className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm">
                          <SelectValue placeholder="Select category" className="text-gray-400 text-xs dark:text-gray-500" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                          <SelectItem value="crypto">
                            <div className="flex items-center space-x-2">
                              <img src="/assets/cryptosvg.svg" alt="Crypto" className="w-4 h-4" />
                              <span>Crypto</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="sports">
                            <div className="flex items-center space-x-2">
                              <img src="/assets/sportscon.svg" alt="Sports" className="w-4 h-4" />
                              <span>Sports</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="politics">
                            <div className="flex items-center space-x-2">
                              <img src="/assets/poltiii.svg" alt="Politics" className="w-4 h-4" />
                              <span>Politics</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="entertainment">
                            <div className="flex items-center space-x-2">
                              <img src="/assets/popcorn.svg" alt="Entertainment" className="w-4 h-4" />
                              <span>Entertainment</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gaming">
                            <div className="flex items-center space-x-2">
                              <img src="/assets/gamessvg.svg" alt="Gaming" className="w-4 h-4" />
                              <span>Gaming</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="news">
                            <div className="flex items-center space-x-2">
                              <img src="/assets/news.svg" alt="News" className="w-4 h-4" />
                              <span>News</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.category && (
                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.category.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eventType" className="text-xs font-medium text-gray-600 dark:text-gray-400">Type *</Label>
                      <Select onValueChange={(value) => form.setValue("eventType", value)}>
                        <SelectTrigger className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm">
                          <SelectValue placeholder="Select type" className="text-gray-400 text-xs dark:text-gray-500" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                          <SelectItem value="yes_no">Yes/No</SelectItem>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="over_under">Over/Under</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.eventType && (
                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.eventType.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="entryFee" className="text-xs font-medium text-gray-600 dark:text-gray-400">Entry Fee (Coins) *</Label>
                      <Input
                        id="entryFee"
                        {...form.register("entryFee")}
                        type="number"
                        placeholder="100"
                        min="1"
                        step="1"
                        className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 placeholder:text-xs dark:placeholder:text-gray-500"
                      />
                      <p className="text-xs text-slate-500">All participants will bet exactly this amount</p>
                      {form.formState.errors.entryFee && (
                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.entryFee.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-xs font-medium text-gray-600 dark:text-gray-400">End Date & Time *</Label>
                      <Input
                        id="endDate"
                        {...form.register("endDate")}
                        type="datetime-local"
                        className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 placeholder:text-xs dark:placeholder:text-gray-500"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      {form.formState.errors.endDate && (
                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.endDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Event Banner (Optional)</Label>

                    {/* Banner Input Type Toggle */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setBannerInputType('upload')}
                        className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                          bannerInputType === 'upload'
                            ? 'bg-[#7440ff] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        Upload Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setBannerInputType('url')}
                        className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                          bannerInputType === 'url'
                            ? 'bg-[#7440ff] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>

                    {bannerInputType === 'upload' ? (
                      // Image Upload Section
                      !imagePreview ? (
                        <div>
                          <label htmlFor="banner-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center hover:border-[#7440ff]/50 transition-colors bg-slate-50 dark:bg-slate-800">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="p-2 bg-[#7440ff]/10 rounded-full">
                                  <Upload className="h-5 w-5 text-[#7440ff]" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Upload event banner
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    PNG, JPG up to 5MB
                                  </p>
                                </div>
                              </div>
                            </div>
                          </label>
                          <input
                            id="banner-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <img
                              src={imagePreview}
                              alt="Event preview"
                              className="w-full h-32 object-cover"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      // URL Input Section
                      <div>
                        <Input
                          {...form.register("bannerUrl")}
                          type="url"
                          placeholder="https://example.com/your-banner-image.jpg"
                          className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3"
                        />
                        <p className="text-xs text-slate-500 mt-1">Enter a direct link to your banner image</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      {...form.register("isPrivate")}
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="isPrivate" className="text-sm font-medium">Make this event private</Label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        form.reset();
                        setSelectedImage(null);
                        setImagePreview(null);
                        setBannerInputType('upload');
                      }}
                      className="flex-1 rounded-xl border-slate-200 dark:border-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createEventMutation.isPending}
                      className="flex-1 bg-[#7440ff] hover:bg-[#7440ff]/90 text-white rounded-xl shadow-lg"
                    >
                      {createEventMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Event
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
    </div>
  );
}