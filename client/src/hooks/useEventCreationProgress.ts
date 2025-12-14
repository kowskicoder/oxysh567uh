import { useState, useEffect } from 'react';
import { Type, Image, Calendar, Users, DollarSign, FileText } from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  current: boolean;
  points: number;
  validator: (formData: any) => boolean;
}

interface EventFormData {
  title?: string;
  description?: string;
  category?: string;
  entryFee?: string | number;
  endDate?: string;
  bannerUrl?: string;
  maxParticipants?: string | number;
  isPrivate?: boolean;
}

export const useEventCreationProgress = (formData: EventFormData) => {
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'title',
      title: 'Event Title',
      description: 'Give your event a catchy name',
      icon: Type,
      completed: false,
      current: true,
      points: 10,
      validator: (data) => Boolean(data.title && data.title.trim().length >= 3)
    },
    {
      id: 'description',
      title: 'Description',
      description: 'Describe what your event is about',
      icon: FileText,
      completed: false,
      current: false,
      points: 15,
      validator: (data) => Boolean(data.description && data.description.trim().length >= 10)
    },
    {
      id: 'category',
      title: 'Category',
      description: 'Choose the event category',
      icon: Users,
      completed: false,
      current: false,
      points: 10,
      validator: (data) => Boolean(data.category)
    },
    {
      id: 'banner',
      title: 'Event Banner',
      description: 'Upload an eye-catching banner image',
      icon: Image,
      completed: false,
      current: false,
      points: 20,
      validator: (data) => Boolean(data.bannerUrl && data.bannerUrl.trim().length > 0)
    },
    {
      id: 'entry_fee',
      title: 'Entry Fee',
      description: 'Set the participation cost',
      icon: DollarSign,
      completed: false,
      current: false,
      points: 15,
      validator: (data) => {
        const fee = typeof data.entryFee === 'string' ? parseInt(data.entryFee) : data.entryFee;
        return Boolean(fee && fee > 0);
      }
    },
    {
      id: 'end_date',
      title: 'End Date',
      description: 'When will the event end?',
      icon: Calendar,
      completed: false,
      current: false,
      points: 10,
      validator: (data) => Boolean(data.endDate && new Date(data.endDate) > new Date())
    }
  ]);

  const totalPoints = steps.reduce((sum, step) => sum + step.points, 0);
  const earnedPoints = steps.filter(step => step.completed).reduce((sum, step) => sum + step.points, 0);

  // Update step completion based on form data
  useEffect(() => {
    setSteps(prevSteps => {
      const updatedSteps = prevSteps.map(step => ({
        ...step,
        completed: step.validator(formData)
      }));

      // Update current step to first incomplete step
      const firstIncompleteIndex = updatedSteps.findIndex(step => !step.completed);
      const allCompleted = firstIncompleteIndex === -1;

      return updatedSteps.map((step, index) => ({
        ...step,
        current: !allCompleted && index === firstIncompleteIndex
      }));
    });
  }, [formData]);

  const getCompletionStatus = () => {
    const completedCount = steps.filter(step => step.completed).length;
    const totalCount = steps.length;
    const isComplete = completedCount === totalCount;
    const progressPercentage = (completedCount / totalCount) * 100;

    return {
      completedCount,
      totalCount,
      isComplete,
      progressPercentage,
      nextStep: steps.find(step => !step.completed)
    };
  };

  const getNextStepHint = () => {
    const nextStep = steps.find(step => !step.completed);
    if (!nextStep) return "All steps completed! 🎉";
    
    const hints = {
      title: "Try something creative and memorable!",
      description: "Explain what participants will be predicting or competing on.",
      category: "Choose the category that best fits your event topic.",
      banner: "A good image makes your event stand out and attract more participants.",
      entry_fee: "Consider what's fair for your target audience - not too high, not too low.",
      end_date: "Give participants enough time to join, but not too long that they lose interest."
    };
    
    return hints[nextStep.id as keyof typeof hints] || nextStep.description;
  };

  return {
    steps,
    totalPoints,
    earnedPoints,
    getCompletionStatus,
    getNextStepHint,
    isComplete: earnedPoints === totalPoints
  };
};