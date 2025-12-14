import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import MobileLayout, { MobileCard, MobileButton } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Upload, X, Image } from "lucide-react";

export default function EventCreate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerInputType, setBannerInputType] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);


  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "error",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
      }

      const endDateTime = new Date(`${endDate}T${endTime}`);
      return await apiRequest("POST", "/api/events", {
        ...eventData,
        endDate: endDateTime.toISOString(),
        entryFee: parseInt(entryFee),
        imageUrl,
      });
    },
    onSuccess: () => {
      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      // Navigate back to events page
      window.location.href = "/events";
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !endDate || !endTime || !entryFee) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Determine banner URL based on input type
    let finalBannerUrl = '';
    if (bannerInputType === 'upload' && selectedImage) {
      // Upload the image first and get the URL
      const imageUrl = await uploadImage(selectedImage);
      if (imageUrl) {
        finalBannerUrl = imageUrl;
      }
    } else if (bannerInputType === 'url' && bannerUrl) {
      finalBannerUrl = bannerUrl;
    }

    createEventMutation.mutate({
      title,
      description,
      category,
      entryFee: parseFloat(entryFee),
      bannerUrl: finalBannerUrl,
    });
  };

  const categories = [
    { value: "crypto", label: "Crypto", icon: "/assets/cryptosvg.svg" },
    { value: "sports", label: "Sports", icon: "/assets/sportscon.svg" },
    { value: "politics", label: "Politics", icon: "/assets/poltiii.svg" },
    { value: "entertainment", label: "Entertainment", icon: "/assets/popcorn.svg" },
    { value: "gaming", label: "Gaming", icon: "/assets/gamessvg.svg" },
    { value: "news", label: "News", icon: "/assets/news.svg" },
  ];

  if (!user) return null;

  return (
    <MobileLayout>


      <div className="max-w-2xl mx-auto">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create New Event</h1>
          <p className="text-slate-600 dark:text-slate-400">Set up a new prediction event for the community</p>
        </div>


        <form onSubmit={handleSubmit} className="mobile-form-container md:space-y-6">
          {/* Desktop Card with proper styling */}
          <div className="mobile-compact-card md:bg-white md:dark:bg-slate-800 md:rounded-xl md:shadow-lg md:border md:border-slate-200 md:dark:border-slate-700 md:p-8">
            <div className="mobile-form-field md:mb-6">
              <Label htmlFor="title" className="mobile-form-label md:text-base md:font-semibold md:text-slate-700 md:dark:text-slate-300">Event Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="What will people predict?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mobile-form-input md:h-12 md:text-base md:bg-slate-50 md:dark:bg-slate-800 md:border-0 md:shadow-none md:rounded-xl focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            <div className="mobile-form-field md:mb-6">
              <Label htmlFor="description" className="mobile-form-label md:text-base md:font-semibold md:text-slate-700 md:dark:text-slate-300">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide details about the event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mobile-form-textarea md:min-h-[100px] md:text-base md:bg-slate-50 md:dark:bg-slate-800 md:border-0 md:shadow-none md:rounded-xl focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            <div className="mobile-form-field md:mb-6">
              <Label htmlFor="category" className="mobile-form-label md:text-base md:font-semibold md:text-slate-700 md:dark:text-slate-300">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="mobile-form-select md:h-12 md:text-base md:bg-slate-50 md:dark:bg-slate-800 md:border-0 md:shadow-none md:rounded-xl focus:ring-2 focus:ring-primary/30 bg-white dark:bg-slate-700 border-0">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                  <SelectContent className="md:bg-slate-50 md:dark:bg-slate-800 md:border-0 md:rounded-xl bg-white dark:bg-slate-700 border-0">
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center space-x-2">
                        <img src={cat.icon} alt={cat.label} className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-6 md:mb-6">
              <div className="mobile-form-field">
                <Label htmlFor="endDate" className="mobile-form-label md:text-base md:font-semibold md:text-slate-700 md:dark:text-slate-300">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mobile-form-input md:h-12 md:text-base md:bg-slate-50 md:dark:bg-slate-800 md:border-0 md:shadow-none md:rounded-xl focus:ring-2 focus:ring-primary/30"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="mobile-form-field">
                <Label htmlFor="endTime" className="mobile-form-label md:text-base md:font-semibold md:text-slate-700 md:dark:text-slate-300">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mobile-form-input md:h-12 md:text-base md:bg-slate-50 md:dark:bg-slate-800 md:border-0 md:shadow-none md:rounded-xl focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
            </div>

            <div className="mobile-form-field md:mb-6">
              <Label htmlFor="entryFee" className="mobile-form-label md:text-base md:font-semibold md:text-slate-700 md:dark:text-slate-300">
                Entry Fee (Coins) *
              </Label>
              <Input
                id="entryFee"
                type="number"
                placeholder="100"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="mobile-form-input md:h-12 md:text-base md:bg-slate-50 md:dark:bg-slate-800 md:border-0 md:shadow-none md:rounded-xl focus:ring-2 focus:ring-primary/30"
                min="1"
                step="1"
                required
              />
              <p className="text-xs text-slate-500 mt-1 md:text-sm">
                All participants will bet exactly this amount
              </p>
            </div>

            <div className="mobile-form-field md:mb-6">
              <Label className="mobile-form-label md:text-base md:font-semibold md:text-slate-700 md:dark:text-slate-300">
                Event Banner (Optional)
              </Label>
              
              {/* Banner Input Type Toggle */}
              <div className="flex space-x-2 mt-2 mb-3">
                <button
                  type="button"
                  onClick={() => setBannerInputType('upload')}
                  className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                    bannerInputType === 'upload'
                      ? 'bg-primary text-primary-foreground'
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
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Image URL
                </button>
              </div>

              {bannerInputType === 'upload' ? (
                // Image Upload Section
                !imagePreview ? (
                  <div className="mt-2">
                    <label htmlFor="banner-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-primary/50 transition-colors md:bg-slate-50 md:dark:bg-slate-800">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <Upload className="h-6 w-6 text-primary" />
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
                  <div className="mt-2 relative">
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex items-center">
                      <Image className="h-3 w-3 mr-1" />
                      {selectedImage?.name}
                    </p>
                  </div>
                )
              ) : (
                // Banner URL Section
                <div className="mt-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/your-banner-image.jpg"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="mobile-form-input md:h-12 md:text-base md:bg-slate-50 md:dark:bg-slate-800 md:border-0 md:shadow-none md:rounded-xl focus:ring-2 focus:ring-primary/30"
                  />
                  {bannerUrl && (
                    <div className="mt-3 relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={bannerUrl}
                        alt="Banner preview"
                        className="w-full h-48 object-cover"
                        onError={() => {
                          toast({
                            title: "Invalid Image URL",
                            description: "Please enter a valid image URL",
                            variant: "destructive"
                          });
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Enter a direct link to your banner image
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Button Container - Fixed for mobile, static for desktop */}
          <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 -mx-4 mt-6 md:static md:bg-transparent md:dark:bg-transparent md:border-none md:p-0 md:mx-0 md:mt-8">
            <div className="flex space-x-3 md:space-x-4 md:justify-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => window.location.href = "/events"}
                className="flex-1 h-12 md:flex-none md:px-8 md:bg-slate-100 md:dark:bg-slate-800 md:hover:bg-slate-200 md:dark:hover:bg-slate-700 md:text-slate-700 md:dark:text-slate-200 md:shadow-none md:border-0"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending || isUploading}
                className="flex-1 h-12 bg-[#7440ff] text-white hover:bg-[#7440ff]/90 font-semibold md:flex-none md:px-8 md:shadow-none md:border-0 md:rounded-xl"
              >
                {createEventMutation.isPending || isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {isUploading ? "Uploading..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

    </MobileLayout>
  );
}