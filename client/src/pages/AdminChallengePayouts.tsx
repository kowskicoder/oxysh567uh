import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import AdminLayout from "@/components/AdminLayout";
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Trophy,
  Users,
  Eye,
  Clock,
  Target
} from 'lucide-react';

interface ChallengeUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

interface Challenge {
  id: number;
  challenger: string;
  challenged: string;
  title: string;
  description: string;
  category: string;
  amount: string;
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
  evidence: any;
  result: 'challenger_won' | 'challenged_won' | 'draw' | null;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
  challengerUser: ChallengeUser;
  challengedUser: ChallengeUser;
}

export default function AdminChallengePayouts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: challenges = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/challenges"],
    retry: false,
  });

  const { data: selectedEscrowData, isLoading: escrowLoading } = useQuery({
    queryKey: ["/api/admin/challenges", selectedChallengeId, "escrow"],
    enabled: !!selectedChallengeId,
    retry: false,
  });

  const setResultMutation = useMutation({
    mutationFn: async ({ challengeId, result }: { challengeId: number; result: string }) => {
      return apiRequest('POST', `/api/admin/challenges/${challengeId}/result`, { result });
    },
    onSuccess: (data) => {
      toast({
        title: "Challenge Resolved ✅",
        description: data.message,
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      setSelectedChallengeId(null); // Clear selection after successful payout
    },
    onError: (error: Error) => {
      toast({
        title: "Payout Failed ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSetResult = (challengeId: number, result: string) => {
    const challenge = challenges.find((c: Challenge) => c.id === challengeId);
    if (!challenge) return;

    const resultText = result === 'challenger_won' ? 'Challenger Wins' : 
                      result === 'challenged_won' ? 'Challenged Wins' : 'Draw';

    const totalAmount = parseFloat(challenge.amount) * 2;
    const platformFee = totalAmount * 0.05;
    const winnerPayout = totalAmount - platformFee;

    const confirmMessage = result === 'draw' 
      ? `Set challenge result to DRAW? Both participants will receive their stakes back (₦${challenge.amount} each).`
      : `Set challenge result to ${resultText}? Winner will receive ₦${winnerPayout.toLocaleString()}, platform fee: ₦${platformFee.toLocaleString()}`;

    if (confirm(confirmMessage)) {
      setResultMutation.mutate({ challengeId, result });
    }
  };

  const getStatusColor = (status: string, result: string | null) => {
    if (status === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (status === 'disputed') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    if (status === 'active') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const getResultColor = (result: string | null) => {
    if (result === 'challenger_won') return 'bg-green-600 text-white';
    if (result === 'challenged_won') return 'bg-blue-600 text-white';
    if (result === 'draw') return 'bg-gray-600 text-white';
    return 'bg-gray-400 text-gray-700';
  };

  const needsAdminAction = (challenge: Challenge) => {
    return challenge.status === 'active' && challenge.dueDate && 
           new Date(challenge.dueDate) <= new Date() && !challenge.result;
  };

  const filteredChallenges = challenges.filter((challenge: Challenge) =>
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.challengerUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.challengedUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingChallenges = filteredChallenges.filter((c: Challenge) => needsAdminAction(c));
  const completedChallenges = filteredChallenges.filter((c: Challenge) => c.status === 'completed');
  const activeChallenges = filteredChallenges.filter((c: Challenge) => c.status === 'active' && !needsAdminAction(c));
  const disputedChallenges = filteredChallenges.filter((c: Challenge) => c.status === 'disputed');

  const totalStaked = challenges.reduce((sum: number, c: Challenge) => 
    sum + (parseFloat(c.amount) * 2), 0); // Each challenge has 2 participants
  const totalPlatformFees = completedChallenges.reduce((sum: number, c: Challenge) => 
    sum + (parseFloat(c.amount) * 2 * 0.05), 0); // 5% platform fee

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Challenge Payouts</h1>
          <p className="text-slate-400">Manage challenge results and fund distribution</p>
        </div>
        <Input
          placeholder="Search challenges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-64 bg-slate-800 border-slate-700"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Actions</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingChallenges.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Staked</p>
                <p className="text-2xl font-bold text-green-400">₦{totalStaked.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Platform Fees</p>
                <p className="text-2xl font-bold text-blue-400">₦{totalPlatformFees.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-emerald-400">{completedChallenges.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Disputed</p>
                <p className="text-2xl font-bold text-orange-400">{disputedChallenges.length}</p>
              </div>
              <Target className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Challenges Needing Action */}
      {pendingChallenges.length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
              Challenges Requiring Admin Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingChallenges.map((challenge: Challenge) => (
                <div key={challenge.id} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{challenge.title}</h3>
                      <p className="text-slate-400 text-sm">
                        Due {formatDistanceToNow(new Date(challenge.dueDate), { addSuffix: true })}
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-slate-300">
                          Stake: ₦{parseFloat(challenge.amount).toLocaleString()} each
                        </span>
                        <span className="text-sm text-blue-400">
                          {challenge.challengerUser?.username || challenge.challengerUser?.firstName || 'Unknown'} vs {challenge.challengedUser?.username || challenge.challengedUser?.firstName || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSetResult(challenge.id, 'challenger_won')}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={setResultMutation.isPending}
                      >
                        {challenge.challengerUser.username} Wins
                      </Button>
                      <Button
                        onClick={() => handleSetResult(challenge.id, 'challenged_won')}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={setResultMutation.isPending}
                      >
                        {challenge.challengedUser.username} Wins
                      </Button>
                      <Button
                        onClick={() => handleSetResult(challenge.id, 'draw')}
                        className="bg-gray-600 hover:bg-gray-700"
                        disabled={setResultMutation.isPending}
                      >
                        Draw
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedChallengeId(challenge.id)}
                        className="border-slate-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Challenges */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3 text-slate-400">Challenge</th>
                  <th className="text-left p-3 text-slate-400">Participants</th>
                  <th className="text-left p-3 text-slate-400">Status</th>
                  <th className="text-left p-3 text-slate-400">Stake</th>
                  <th className="text-left p-3 text-slate-400">Result</th>
                  <th className="text-left p-3 text-slate-400">Due Date</th>
                  <th className="text-left p-3 text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChallenges.map((challenge: Challenge) => (
                  <tr key={challenge.id} className="border-b border-slate-800 hover:bg-slate-800">
                    <td className="p-3">
                      <div className="font-medium text-white">{challenge.title}</div>
                      <div className="text-xs text-slate-400">{challenge.category}</div>
                    </td>
                    <td className="p-3 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">
                          {challenge.challengerUser?.username || challenge.challengerUser?.firstName || 'Unknown'} vs {challenge.challengedUser?.username || challenge.challengedUser?.firstName || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(challenge.status, challenge.result)}>
                        {challenge.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-300">
                      ₦{parseFloat(challenge.amount).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {challenge.result ? (
                        <Badge className={getResultColor(challenge.result)}>
                          {challenge.result === 'challenger_won' ? 'Challenger' : 
                           challenge.result === 'challenged_won' ? 'Challenged' : 'Draw'}
                        </Badge>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">
                      {challenge.dueDate ? (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">
                            {new Date(challenge.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {needsAdminAction(challenge) && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSetResult(challenge.id, 'challenger_won')}
                              className="bg-green-600 hover:bg-green-700 text-xs"
                            >
                              C
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSetResult(challenge.id, 'challenged_won')}
                              className="bg-blue-600 hover:bg-blue-700 text-xs"
                            >
                              P
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSetResult(challenge.id, 'draw')}
                              className="bg-gray-600 hover:bg-gray-700 text-xs"
                            >
                              D
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedChallengeId(challenge.id)}
                          className="border-slate-600 text-xs"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Details Modal */}
      {selectedChallengeId && selectedEscrowData && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              Challenge Escrow Details
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedChallengeId(null)}
                className="border-slate-600"
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {escrowLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="text-slate-400 text-sm">Total Escrow</div>
                  <div className="text-xl font-bold text-white">
                    ₦{selectedEscrowData.totalEscrow.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="text-slate-400 text-sm">Escrow Status</div>
                  <div className="text-xl font-bold text-blue-400">
                    {selectedEscrowData.status}
                  </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="text-slate-400 text-sm">Platform Fee (5%)</div>
                  <div className="text-xl font-bold text-green-400">
                    ₦{(selectedEscrowData.totalEscrow * 0.05).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </AdminLayout>
  );
}