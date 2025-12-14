import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Trash2, 
  AlertTriangle, 
  Clock,
  Shield,
  Info,
  CheckCircle
} from "lucide-react";
import { useLocation } from "wouter";

export default function DataDeletionRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [formData, setFormData] = useState({
    email: user?.email || "",
    reason: "",
    additionalInfo: "",
    confirmUnderstanding: false,
    confirmAccountClosure: false,
    confirmDataLoss: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.confirmUnderstanding || !formData.confirmAccountClosure || !formData.confirmDataLoss) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm all checkboxes to proceed with the deletion request.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call for data deletion request
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "Your data deletion request has been submitted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit deletion request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Request Submitted
            </h1>
          </div>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Deletion Request Received
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                We have received your data deletion request. You will receive a confirmation email shortly.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      What happens next?
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• We'll verify your identity within 1-2 business days</li>
                      <li>• You'll receive an email with next steps</li>
                      <li>• Complete deletion will occur within 30 days</li>
                      <li>• You'll receive final confirmation when complete</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate("/profile")} className="w-full">
                Return to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-20 md:pb-0">
      <div className="max-w-2xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Trash2 className="w-6 h-6 mr-2" />
              Data Deletion Request
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Request complete deletion of your personal data
            </p>
          </div>
        </div>

        {/* Warning Alert */}
        <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Warning:</strong> This action is irreversible. Once your data is deleted, you will lose access to your account, betting history, and any remaining balance permanently.
          </AlertDescription>
        </Alert>

        {/* Information Card */}
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-blue-900 dark:text-blue-100">
              <Info className="w-5 h-5 mr-2" />
              Before You Proceed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-medium">Account Balance</p>
                  <p>Ensure you have withdrawn all funds. Any remaining balance will be lost.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-medium">Processing Time</p>
                  <p>Deletion requests are processed within 30 days as required by law.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Trash2 className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-medium">What Gets Deleted</p>
                  <p>Profile, betting history, messages, preferences, and all personal data.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deletion Request Form */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Data Deletion Request Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  required
                  disabled={!!user?.email}
                />
                {user?.email && (
                  <p className="text-xs text-slate-500 mt-1">
                    Using your registered email address
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium mb-2">
                  Reason for Deletion *
                </label>
                <select
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="no_longer_use">I no longer use the service</option>
                  <option value="privacy_concerns">Privacy concerns</option>
                  <option value="too_many_emails">Too many emails/notifications</option>
                  <option value="found_alternative">Found an alternative service</option>
                  <option value="account_compromised">Account may be compromised</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium mb-2">
                  Additional Information (Optional)
                </label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="Any additional details about your deletion request..."
                  rows={3}
                />
              </div>

              {/* Confirmation Checkboxes */}
              <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                  Please confirm your understanding:
                </h3>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="confirmUnderstanding"
                    checked={formData.confirmUnderstanding}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, confirmUnderstanding: !!checked }))
                    }
                  />
                  <label htmlFor="confirmUnderstanding" className="text-sm text-slate-600 dark:text-slate-400">
                    I understand that this action is permanent and irreversible.
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="confirmAccountClosure"
                    checked={formData.confirmAccountClosure}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, confirmAccountClosure: !!checked }))
                    }
                  />
                  <label htmlFor="confirmAccountClosure" className="text-sm text-slate-600 dark:text-slate-400">
                    I confirm that I want to permanently close my account and delete all associated data.
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="confirmDataLoss"
                    checked={formData.confirmDataLoss}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, confirmDataLoss: !!checked }))
                    }
                  />
                  <label htmlFor="confirmDataLoss" className="text-sm text-slate-600 dark:text-slate-400">
                    I acknowledge that I will lose access to all my data, including betting history, messages, and any remaining account balance.
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Deletion Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="mt-6 bg-slate-100 dark:bg-slate-700">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                If you have questions about data deletion or want to explore alternatives, contact our support team.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/support-chat")}
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNavigation />
    </div>
  );
}