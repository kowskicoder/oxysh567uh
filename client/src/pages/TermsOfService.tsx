import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, Shield, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
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
              <FileText className="w-6 h-6 mr-2" />
              Terms of Service
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Last updated: January 28, 2025
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Important Notice
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  By using Bantah, you agree to these terms. Please read them carefully as they contain important information about your rights and obligations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Content */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                By accessing and using Bantah ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">2. Use License</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Permission is granted to temporarily use Bantah for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the Platform</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">3. User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>Safeguarding your password and all activities under your account</li>
                <li>Ensuring you are at least 18 years old or the legal age in your jurisdiction</li>
                <li>Providing accurate and truthful information</li>
                <li>Complying with all applicable laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">4. Betting and Gaming Rules</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Bantah facilitates peer-to-peer betting and challenges. By participating, you agree that:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>You understand the risks involved in betting activities</li>
                <li>You will not engage in fraudulent or manipulative behavior</li>
                <li>Dispute resolution decisions by our team are final</li>
                <li>Winnings are subject to our payout terms and conditions</li>
                <li>We reserve the right to void bets in case of technical errors</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">5. Financial Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                All financial transactions are processed securely. Please note:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>Deposits and withdrawals may be subject to processing fees</li>
                <li>Withdrawal requests are processed within 1-3 business days</li>
                <li>We may request identity verification for large transactions</li>
                <li>Refunds are only available in specific circumstances outlined in our policy</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">6. Prohibited Activities</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>Creating multiple accounts to circumvent limits</li>
                <li>Using automated systems or bots</li>
                <li>Harassment, abuse, or inappropriate behavior toward other users</li>
                <li>Money laundering or other illegal financial activities</li>
                <li>Sharing account credentials with third parties</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">7. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                In no event shall Bantah or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use Bantah, even if Bantah or a Bantah authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">8. Modifications</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Bantah may revise these terms of service at any time without notice. By using this Platform, you are agreeing to be bound by the then current version of these terms of service. We will notify users of significant changes via email or platform notifications.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">9. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Email: legal@bantah.com<br />
                  Address: [Company Address]<br />
                  Phone: +1 (234) 567-890
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>Last updated: January 28, 2025</span>
          </div>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}