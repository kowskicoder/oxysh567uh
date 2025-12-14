import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { Upload, Send, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChallengeChatProps {
  challenge: {
    id: string;
    status: string;
    evidence: 'SCREENSHOT' | 'VIDEO' | 'BOTH';
    challenger_id: string;
    challenged_id: string;
  };
}

export const ChallengeChat: React.FC<ChallengeChatProps> = ({ challenge }) => {
  const { currentUser } = useAuth();
  const { sendMessage } = useChat();
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    await sendMessage(challenge.id, {
      type: 'text',
      content: message
    });
    
    setMessage('');
  };

  const handleEvidenceUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // Upload to storage
      const fileName = `challenges/${challenge.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(fileName, file);
        
      if (error) throw error;

      // Send evidence message
      await sendMessage(challenge.id, {
        type: 'evidence',
        content: {
          fileUrl: data.path,
          fileType: file.type,
          fileName: file.name
        }
      });

      // Notify admins
      await supabase.rpc('notify_admins_evidence', {
        challenge_id: challenge.id,
        evidence_url: data.path
      });

    } catch (error) {
      console.error('Error uploading evidence:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRequestSupport = async () => {
    try {
      // Add support agent to chat
      await supabase.rpc('add_support_to_challenge', {
        challenge_id: challenge.id
      });

      // Send system message
      await sendMessage(challenge.id, {
        type: 'system',
        content: 'Support has been added to the chat'
      });

    } catch (error) {
      console.error('Error requesting support:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Messages rendered here */}
      </div>

      {/* Evidence Upload & Actions */}
      {challenge.status === 'active' && (
        <div className="border-t border-white/10 p-2 flex gap-2">
          <button
            onClick={() => document.getElementById('evidence-upload')?.click()}
            disabled={uploading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <Upload className="w-5 h-5" />
          </button>
          <input
            id="evidence-upload"
            type="file"
            accept={challenge.evidence === 'VIDEO' ? 'video/*' : 'image/*'}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleEvidenceUpload(e.target.files[0])}
          />
          
          <button
            onClick={handleRequestSupport}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <AlertCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-white/10 p-4 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 rounded-lg px-4 py-2"
        />
        <button
          onClick={handleSendMessage}
          className="p-2 rounded-lg bg-[#CCFF00] text-black"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};