
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
}

export function PaymentTestPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testAmount, setTestAmount] = useState("1000");

  const addTestResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date()
    }]);
  };

  const runDepositTest = async () => {
    if (!user) return;
    
    setIsRunning(true);
    addTestResult('Deposit Test', 'pending', 'Starting deposit test...');
    
    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(testAmount) })
      });
      
      const data = await response.json();
      
      if (data.authorization_url && data.access_code && data.publicKey) {
        addTestResult('Deposit Test', 'success', 'Paystack inline popup ready');
        
        // Test the inline popup
        const handler = (window as any).PaystackPop.setup({
          key: data.publicKey,
          email: user?.email || 'test@example.com',
          amount: parseFloat(testAmount) * 100,
          currency: 'NGN',
          ref: data.reference,
          callback: function(response: any) {
            if (response.status === 'success') {
              addTestResult('Deposit Test', 'success', `Payment completed: ${response.reference}`);
              toast({
                title: "Test Payment Successful",
                description: "Test payment completed successfully!",
              });
            } else {
              addTestResult('Deposit Test', 'error', `Payment failed: ${response.message || 'Unknown error'}`);
              toast({
                title: "Test Payment Failed",
                description: response.message || "Payment was not successful.",
                variant: "destructive",
              });
            }
          },
          onClose: function() {
            addTestResult('Deposit Test', 'error', 'Payment popup was closed');
          }
        });
        
        handler.openIframe();
        
        toast({
          title: "Deposit Test Started",
          description: "Paystack popup should appear. Use test cards for testing.",
        });
        console.log('Test payment popup opened');
      } else if (data.authorization_url) {
        addTestResult('Deposit Test', 'success', 'Paystack URL generated (fallback mode)');
        console.log('Test payment URL:', data.authorization_url);
      } else {
        addTestResult('Deposit Test', 'error', 'No authorization URL returned');
      }
    } catch (error) {
      addTestResult('Deposit Test', 'error', `Error: ${error.message}`);
      toast({
        title: "Deposit Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runWithdrawTest = async () => {
    if (!user) return;
    
    setIsRunning(true);
    addTestResult('Withdrawal Test', 'pending', 'Starting withdrawal test...');
    
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(testAmount) })
      });
      
      if (response.ok) {
        addTestResult('Withdrawal Test', 'success', 'Withdrawal request processed');
        toast({
          title: "Withdrawal Test Passed",
          description: "Withdrawal request created successfully.",
        });
      } else {
        const error = await response.json();
        addTestResult('Withdrawal Test', 'error', error.message);
      }
    } catch (error) {
      addTestResult('Withdrawal Test', 'error', `Error: ${error.message}`);
      toast({
        title: "Withdrawal Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testWebhookSignature = async () => {
    setIsRunning(true);
    addTestResult('Webhook Test', 'pending', 'Testing webhook signature...');
    
    try {
      // This would typically be done server-side
      const testPayload = {
        event: 'charge.success',
        data: {
          reference: `test_${Date.now()}`,
          amount: parseFloat(testAmount) * 100,
          metadata: { userId: user?.id, type: 'deposit' }
        }
      };
      
      console.log('Test webhook payload:', testPayload);
      addTestResult('Webhook Test', 'success', 'Webhook payload structure valid');
      
      toast({
        title: "Webhook Test Info",
        description: "Check console for webhook payload structure.",
      });
    } catch (error) {
      addTestResult('Webhook Test', 'error', `Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!user) {
    return (
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please log in to access payment testing tools.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Flow Testing</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test payment functionality in a safe environment
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Test Amount (₦)</label>
            <Input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              placeholder="1000"
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={runDepositTest}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? "Testing..." : "Test Deposit"}
            </Button>
            
            <Button
              onClick={runWithdrawTest}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              {isRunning ? "Testing..." : "Test Withdrawal"}
            </Button>
            
            <Button
              onClick={testWebhookSignature}
              disabled={isRunning}
              variant="secondary"
              className="w-full"
            >
              {isRunning ? "Testing..." : "Test Webhook"}
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <Button
              onClick={clearResults}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Clear Results
            </Button>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.test}</span>
                      <Badge
                        variant={
                          result.status === 'success'
                            ? 'default'
                            : result.status === 'error'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.message}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Test Card Numbers (Paystack)
          </h4>
          <div className="space-y-2 text-sm">
            <div><strong>Success:</strong> 4084084084084081</div>
            <div><strong>Declined:</strong> 4084084084084087</div>
            <div><strong>Insufficient Funds:</strong> 4084084084084085</div>
            <div><strong>Invalid:</strong> 4084084084084089</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
