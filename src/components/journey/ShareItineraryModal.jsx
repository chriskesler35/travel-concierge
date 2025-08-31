import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Share2, Mail, Users, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { manageJourneyShare } from '@/api/functions';

export default function ShareItineraryModal({ open, journey, onClose, onShareSuccess }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const [isRevoking, setIsRevoking] = useState(null);

  const handleShare = async () => {
    if (!recipientEmail || !journey) {
        console.error("[ShareItineraryModal] Aborting share: Missing recipient email or journey object.");
        return;
    }
    
    console.log(`[ShareItineraryModal] Attempting to share journey ${journey.id} with ${recipientEmail}`);
    setIsSharing(true);
    setError('');
    
    try {
      console.log("[ShareItineraryModal] Calling backend function 'manageJourneyShare'...");
      const { data } = await manageJourneyShare({
        action: 'invite',
        journeyId: journey.id,
        recipientEmail: recipientEmail
      });
      console.log("[ShareItineraryModal] Backend function response:", data);

      if (data && data.success) {
        console.log("[ShareItineraryModal] Share successful. Clearing email and calling onShareSuccess.");
        setRecipientEmail('');
        if (onShareSuccess) onShareSuccess();
      } else {
        const errorMessage = data?.error || 'An unexpected error occurred during sharing.';
        console.error("[ShareItineraryModal] Share failed:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("[ShareItineraryModal] CATCH BLOCK: An error occurred.", err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      console.log("[ShareItineraryModal] Finalizing share attempt.");
      setIsSharing(false);
    }
  };

  const handleRevoke = async (email) => {
    console.log(`[ShareItineraryModal] Starting revoke for ${email} from journey ${journey.id}`);
    setIsRevoking(email);
    setError('');
    
    try {
      console.log("[ShareItineraryModal] Calling manageJourneyShare with revoke action...");
      const { data } = await manageJourneyShare({
        action: 'revoke',
        journeyId: journey.id,
        recipientEmail: email
      });
      
      console.log("[ShareItineraryModal] Revoke response:", data);
      
      if (data && data.success) {
        console.log("[ShareItineraryModal] Revoke successful, calling onShareSuccess");
        if (onShareSuccess) onShareSuccess();
      } else {
        const errorMessage = data?.error || 'Failed to revoke access.';
        console.error("[ShareItineraryModal] Revoke failed:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("[ShareItineraryModal] Revoke error:", err);
      setError(err.message || 'An unknown error occurred while revoking access.');
    } finally {
      console.log("[ShareItineraryModal] Finalizing revoke attempt");
      setIsRevoking(null);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            Share Your Itinerary
          </DialogTitle>
          <DialogDescription>
            Invite other premium users to view and collaborate on this trip.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient Email</Label>
            <div className="flex gap-2">
              <Input
                id="recipient"
                type="email"
                placeholder="friend@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
              <Button onClick={handleShare} disabled={isSharing || !recipientEmail}>
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {journey?.shares?.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Shared With
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {journey.shares.map((share) => (
                  <div key={share.email} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{share.email}</span>
                       <Badge className={`text-xs capitalize w-fit mt-1 ${statusColors[share.status] || 'bg-slate-100'}`}>
                          {share.status}
                        </Badge>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-8 h-8 text-red-500 hover:bg-red-100"
                      onClick={() => handleRevoke(share.email)}
                      disabled={isRevoking === share.email}
                      title="Revoke access"
                    >
                      {isRevoking === share.email ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}