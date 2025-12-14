import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  HelpCircle,
  Book,
  Video,
  FileText,
} from "lucide-react";
import { useLocation } from "wouter";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  popularity: number;
}

interface SupportOption {
  title: string;
  description: string;
  icon: any;
  action: () => void;
  availability?: string;
}

export default function HelpSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqs: FAQItem[] = [
    {
      id: "1",
      question: "How do I deposit money into my account?",
      answer:
        "You can deposit money by going to the Wallet page and clicking 'Deposit'. We support bank transfers, cards, and mobile money payments through Paystack.",
      category: "payments",
      popularity: 95,
    },
    {
      id: "2",
      question: "How long do withdrawals take?",
      answer:
        "Withdrawals typically take 1-3 business days to process. The exact time depends on your payment method and bank processing times.",
      category: "payments",
      popularity: 90,
    },
    {
      id: "3",
      question: "How do I create an event?",
      answer:
        "To create an event, go to the Events page and click 'Create Event'. Fill in the details, set your betting options, and publish your event for others to participate.",
      category: "events",
      popularity: 85,
    },
    {
      id: "4",
      question: "What are coins and how do I earn them?",
      answer:
        "Coins are our virtual currency used for challenges and games. You can earn coins by winning challenges, daily sign-ins, referrals, and special promotions.",
      category: "coins",
      popularity: 80,
    },
    {
      id: "5",
      question: "How do I challenge a friend?",
      answer:
        "Go to the Challenges page, click 'Create Challenge', select your friend from your friends list, set the challenge details, and send it. They'll receive a notification to accept or decline.",
      category: "challenges",
      popularity: 75,
    },
    {
      id: "6",
      question: "How do I verify my account?",
      answer:
        "Account verification is automatic for most users. If additional verification is needed, we'll send you an email with instructions. You can also contact support for help.",
      category: "account",
      popularity: 70,
    },
    {
      id: "7",
      question: "Can I cancel a bet or challenge?",
      answer:
        "Bets and challenges can only be cancelled before they start or if the other party hasn't accepted yet. Once active, they cannot be cancelled.",
      category: "events",
      popularity: 65,
    },
    {
      id: "8",
      question: "How do I add friends?",
      answer:
        "You can add friends by searching for their username in the Friends page, or by sharing your referral code. You can also import contacts if they're already on BetChat.",
      category: "social",
      popularity: 60,
    },
  ];

  const categories = [
    { id: "all", name: "All Categories", count: faqs.length },
    {
      id: "payments",
      name: "Payments & Wallet",
      count: faqs.filter((f) => f.category === "payments").length,
    },
    {
      id: "events",
      name: "Events & Betting",
      count: faqs.filter((f) => f.category === "events").length,
    },
    {
      id: "challenges",
      name: "Challenges",
      count: faqs.filter((f) => f.category === "challenges").length,
    },
    {
      id: "coins",
      name: "Coins & Rewards",
      count: faqs.filter((f) => f.category === "coins").length,
    },
    {
      id: "account",
      name: "Account & Profile",
      count: faqs.filter((f) => f.category === "account").length,
    },
    {
      id: "social",
      name: "Social Features",
      count: faqs.filter((f) => f.category === "social").length,
    },
  ];

  const supportOptions: SupportOption[] = [
    {
      title: "Live Chat Support",
      description: "Chat with our support team in real-time",
      icon: MessageCircle,
      action: () => navigate("/support-chat"),
      availability: "24/7 Available",
    },
    {
      title: "Email Support",
      description: "Send us an email for detailed assistance",
      icon: Mail,
      action: () => (window.location.href = "mailto:support@betchat.com"),
      availability: "Response within 24hrs",
    },
    {
      title: "Phone Support",
      description: "Call our support hotline",
      icon: Phone,
      action: () => (window.location.href = "tel:+2348123456789"),
      availability: "Mon-Fri, 9AM-6PM",
    },
  ];

  const quickLinks = [
    {
      title: "User Guide",
      description: "Complete guide to using BetChat",
      icon: Book,
      action: () => window.open("/user-guide", "_blank"),
    },
    {
      title: "Video Tutorials",
      description: "Watch how-to videos",
      icon: Video,
      action: () => window.open("/tutorials", "_blank"),
    },
    {
      title: "Terms of Service",
      description: "Read our terms and conditions",
      icon: FileText,
      action: () => navigate("/terms-of-service"),
    },
    {
      title: "Privacy Policy",
      description: "Learn about our privacy practices",
      icon: FileText,
      action: () => navigate("/privacy-policy"),
    },
  ];

  const filteredFAQs = faqs
    .filter(
      (faq) => selectedCategory === "all" || faq.category === selectedCategory,
    )
    .filter(
      (faq) =>
        searchQuery === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => b.popularity - a.popularity);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      <div className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
              About Us & FAQ
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Find answers to common questions or get help from our team
            </p>
          </div>
        </div>

        {/* Search */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help topics..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Support Options */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-blue-500" />
              Get Immediate Help
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {supportOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={option.action}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <option.icon className="w-5 h-5 mr-2 text-blue-500" />
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                      {option.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {option.description}
                  </p>
                  {option.availability && (
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {option.availability}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
          <CardHeader>
            <CardTitle>Browse by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-xs"
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredFAQs.length} questions found
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center justify-between w-full mr-4">
                      <span>{faq.question}</span>
                      <Badge variant="outline" className="text-xs">
                        {faq.popularity}% helpful
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2 pb-4">
                      <p className="text-slate-600 dark:text-slate-400">
                        {faq.answer}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-500">
                          Was this helpful?
                        </span>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" className="text-xs">
                            👍 Yes
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs">
                            👎 No
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickLinks.map((link, index) => (
                <div
                  key={index}
                  onClick={link.action}
                  className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <link.icon className="w-5 h-5 mr-3 text-slate-500" />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                      {link.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {link.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNavigation />
    </div>
  );
}