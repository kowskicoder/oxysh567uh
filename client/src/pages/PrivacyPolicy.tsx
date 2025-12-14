import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Eye, Lock, Database, Mail, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

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
              <Shield className="w-6 h-6 mr-2" />
              Privacy Policy
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Last updated: January 28, 2025
            </p>
          </div>
        </div>

        {/* Privacy Promise */}
        <Card className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">
                  Our Privacy Promise
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your privacy is fundamental to us. We use industry-standard encryption and never sell your personal data to third parties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Content */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                We collect information you provide directly to us, such as when you create an account, participate in betting activities, or contact us for support.
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Personal Information:</h4>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                    <li>Name, email address, and contact information</li>
                    <li>Profile picture and bio (optional)</li>
                    <li>Payment information (securely processed)</li>
                    <li>Identity verification documents when required</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Usage Information:</h4>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                    <li>Betting history and preferences</li>
                    <li>Device information and IP address</li>
                    <li>App usage patterns and interactions</li>
                    <li>Location data (if enabled)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Database className="w-5 h-5 mr-2" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>Process betting transactions and payouts</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Send you important notifications and updates</li>
                <li>Improve our platform and user experience</li>
                <li>Provide customer support</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                We do not sell or rent your personal information to third parties. We may share your information only in these limited circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>With payment processors to handle transactions</li>
                <li>With service providers who assist us in operating the platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transaction (merger, acquisition, etc.)</li>
                <li>With your explicit consent</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure data centers with physical protection</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information on a need-to-know basis</li>
                <li>Two-factor authentication for account security</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                You have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Restriction:</strong> Request limitation of data processing</li>
              </ul>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                To exercise these rights, please contact us at privacy@bantah.com or use our data deletion request form.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>Essential cookies for platform functionality</li>
                <li>Analytics cookies to understand usage patterns</li>
                <li>Preference cookies to remember your settings</li>
              </ul>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                You can manage cookie preferences in your browser settings or through our cookie consent banner.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Betting transaction records are kept for 7 years as required by financial regulations. You can request earlier deletion of non-essential data.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Our services are not directed to individuals under 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Changes to Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and sending you an email notification. Your continued use of our services after such modifications constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>Privacy Officer</strong><br />
                  Email: privacy@bantah.com<br />
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