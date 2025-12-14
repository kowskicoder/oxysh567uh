import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Mail, Lock, ArrowLeft, Check, Save } from "lucide-react";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileFormData {
  firstName: string;
  username: string;
  bio: string;
  avatarUrl: string;
}

export default function ProfileEdit() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    username: "",
    bio: "",
    avatarUrl: "",
  });

  const [originalFormData, setOriginalFormData] = useState<ProfileFormData>({
    firstName: "",
    username: "",
    bio: "",
    avatarUrl: "",
  });

  // Load user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  useEffect(() => {
    if (profileData) {
      const userData = {
        firstName: (profileData as any).firstName || "",
        username: (profileData as any).username || "",
        bio: (profileData as any).bio || "",
        avatarUrl: (profileData as any).avatarUrl || generateDicebearAvatar((profileData as any).firstName || "User"),
      };
      setFormData(userData);
      setOriginalFormData(userData);
    }
  }, [profileData]);

  // Track changes to show unsaved indicator
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, originalFormData]);

  const generateDicebearAvatar = (name: string) => {
    const avatar = createAvatar(initials, {
      seed: name,
      backgroundColor: ["b6e3f4", "c084fc", "f87171", "fbbf24", "34d399"],
      backgroundType: ["gradientLinear"],
    });
    return avatar.toDataUri();
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PUT", "/api/profile", {
        firstName: data.firstName,
        username: data.username,
        bio: data.bio,
        avatarUrl: data.avatarUrl
      });
    },
    onSuccess: () => {
      setShowSaveSuccess(true);
      setHasUnsavedChanges(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Show success animation then redirect
      setTimeout(() => {
        setLocation("/profile");
      }, 1500);
    },
    onError: (error: Error) => {
      // Check if it's an authentication error
      if (error.message?.includes('401') || error.message?.includes('Not authenticated')) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to update your profile",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 1500);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = "Name is required";
    }
    
    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = "Only letters, numbers, and underscores allowed";
    }
    
    if (formData.bio.length > 160) {
      errors.bio = "Bio must be 160 characters or less";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setImageLoading(true);
    
    try {
      // For now, convert to base64 data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormData(prev => ({ ...prev, avatarUrl: dataUrl }));
        setImageLoading(false);
        toast({
          title: "Avatar Updated",
          description: "Your new profile photo has been uploaded!",
        });
      };
      reader.onerror = () => {
        toast({
          title: "Upload Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
        setImageLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setImageLoading(false);
    }
  };

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/profile")}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Edit Profile
            </h1>
            <AnimatePresence>
              {hasUnsavedChanges && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-2 h-2 bg-orange-500 rounded-full"
                  title="Unsaved changes"
                />
              )}
            </AnimatePresence>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </motion.div>

      {profileLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </motion.div>
      ) : (
        <motion.form 
          onSubmit={handleSubmit} 
          className="p-4 space-y-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Avatar */}
          <motion.div 
            className="flex flex-col items-center mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 text-center">
              Profile Photo
            </label>
            <div className="flex justify-center">
              <motion.div 
                className="relative"
                onHoverStart={() => setIsAvatarHovered(true)}
                onHoverEnd={() => setIsAvatarHovered(false)}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.img
                  src={formData.avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                  animate={{ 
                    filter: isAvatarHovered ? "brightness(0.8)" : "brightness(1)",
                  }}
                  transition={{ duration: 0.2 }}
                />
                
                <AnimatePresence>
                  {isAvatarHovered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Edit icon positioned directly on the edge of the avatar */}
                <motion.label 
                  className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full cursor-pointer shadow-lg border-2 border-white dark:border-slate-800"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    backgroundColor: imageLoading ? "#94a3b8" : undefined,
                  }}
                >
                  {imageLoading ? (
                    <motion.div 
                      className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={imageLoading || updateProfileMutation.isPending}
                  />
                </motion.label>
              </motion.div>
            </div>
          </motion.div>

          {/* Name */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Name
            </label>
            <motion.div
              animate={{
                borderColor: fieldErrors.firstName ? "#ef4444" : undefined,
              }}
              className="relative"
            >
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Your name"
                disabled={updateProfileMutation.isPending}
                maxLength={50}
                className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all duration-200 focus:scale-[1.02] ${
                  fieldErrors.firstName ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
              />
              <AnimatePresence>
                {fieldErrors.firstName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-500 mt-1"
                  >
                    {fieldErrors.firstName}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Username */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Username
            </label>
            <motion.div
              animate={{
                borderColor: fieldErrors.username ? "#ef4444" : undefined,
              }}
              className="relative"
            >
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="@username"
                disabled={updateProfileMutation.isPending}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all duration-200 focus:scale-[1.02] ${
                  fieldErrors.username ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
              />
              <AnimatePresence>
                {fieldErrors.username ? (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-500 mt-1"
                  >
                    {fieldErrors.username}
                  </motion.p>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-sm text-slate-500 dark:text-slate-400"
                  >
                    Only letters, numbers, and underscores allowed
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Bio
            </label>
            <motion.div
              animate={{
                borderColor: fieldErrors.bio ? "#ef4444" : undefined,
              }}
              className="relative"
            >
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself"
                rows={3}
                disabled={updateProfileMutation.isPending}
                maxLength={160}
                className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 min-h-[80px] transition-all duration-200 focus:scale-[1.02] resize-none ${
                  fieldErrors.bio ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
              />
              <AnimatePresence>
                {fieldErrors.bio ? (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-500 mt-1"
                  >
                    {fieldErrors.bio}
                  </motion.p>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-1 text-sm transition-colors ${
                      formData.bio.length > 140 
                        ? 'text-orange-500' 
                        : formData.bio.length > 120 
                          ? 'text-yellow-600' 
                          : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {formData.bio.length}/160 characters
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Email (read-only) */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Email
            </label>
            <motion.div 
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                {user.email || 'No email set'}
              </span>
            </motion.div>
          </motion.div>

          {/* Password Change Link */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.button
              type="button"
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2 text-primary hover:text-primary/80 p-0 h-auto font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </motion.button>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="sticky bottom-4 pt-4"
          >
            <AnimatePresence mode="wait">
              {showSaveSuccess ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-full py-3 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                  <span>Profile Saved!</span>
                </motion.div>
              ) : (
                <motion.button
                  key="submit"
                  type="submit"
                  disabled={updateProfileMutation.isPending || !hasUnsavedChanges}
                  className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    hasUnsavedChanges 
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-lg' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                  whileHover={hasUnsavedChanges ? { scale: 1.02 } : {}}
                  whileTap={hasUnsavedChanges ? { scale: 0.98 } : {}}
                  animate={{
                    backgroundColor: updateProfileMutation.isPending 
                      ? "#94a3b8" 
                      : hasUnsavedChanges 
                        ? undefined 
                        : "#e2e8f0"
                  }}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <motion.div 
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{hasUnsavedChanges ? 'Save Changes' : 'No Changes'}</span>
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.form>
      )}
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {updateProfileMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  Updating your profile...
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}