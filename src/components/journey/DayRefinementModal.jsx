import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';

export default function DayRefinementModal({ 
  isOpen, 
  dayData, 
  journeyContext,
  onRefinementSubmit, 
  isRefining, 
  onClose 
}) {
  const [refinementText, setRefinementText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!refinementText.trim()) {
      setError("Please describe how you'd like to refine this day.");
      return;
    }
    setError('');
    onRefinementSubmit(refinementText);
    setRefinementText('');
  };

  const handleLucky = () => {
    setError('');
    const luckyPrompt = `I feel lucky! Please enhance this entire day with extraordinary experiences that perfectly complement the theme "${dayData?.title}". Add unique local gems, elevated dining options, exclusive activities, and special touches that make this day unforgettable while staying true to the original concept and location flow. Make it feel like a premium, insider experience!`;
    onRefinementSubmit(luckyPrompt);
    setRefinementText('');
  };

  const handleClose = () => {
    setRefinementText('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            Refine Day {dayData?.day}: {dayData?.title}
          </DialogTitle>
          <DialogDescription>
            Tell me how you'd like to enhance this day's itinerary. I'll preserve the core theme and flow while adding your requested improvements.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">Current Plan:</h4>
            <p className="text-sm text-slate-600 line-clamp-3">
              {dayData?.description || 'No description available'}
            </p>
          </div>

          <div>
            <Label htmlFor="refinement-request">How would you like to enhance this day?</Label>
            <Textarea
              id="refinement-request"
              placeholder="Example: Add more luxury dining options, include unique local experiences, suggest VIP activities, add cultural attractions..."
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
              className="h-24 mt-1"
              disabled={isRefining}
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div className="text-sm text-purple-900">
              <strong>Or try "I Feel Lucky"</strong> - I'll automatically enhance this day with extraordinary local experiences while preserving the original theme!
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isRefining}>
            Cancel
          </Button>
          
          <Button
            variant="outline"
            onClick={handleLucky}
            disabled={isRefining}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
          >
            {isRefining ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            I Feel Lucky
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isRefining || !refinementText.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRefining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Refining...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Refine Day
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}