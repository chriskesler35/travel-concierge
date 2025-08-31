
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';

const getTimeSlotIcon = (timeSlot) => {
  if (!timeSlot) return '📍';
  if (timeSlot.toLowerCase().includes('morning')) return '🌅';
  if (timeSlot.toLowerCase().includes('lunch')) return '🍽️';
  if (timeSlot.toLowerCase().includes('afternoon')) return '☀️';
  if (timeSlot.toLowerCase().includes('dinner')) return '🌙';
  if (timeSlot.toLowerCase().includes('additional')) return '💡';
  return '📍';
};

export default function TimeSlotRefinementModal({ 
  isOpen, 
  dayData, 
  timeSlot, 
  activityName, 
  currentDescription,
  onRefinementSubmit, 
  onClose, 
  isRefining 
}) {
  const [refinementText, setRefinementText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Reset state when the modal opens
    if (isOpen) {
      setRefinementText("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!refinementText.trim()) {
      setError("Please enter your refinement request.");
      return;
    }
    
    // Pass the user's request directly - the parent will handle the AI prompt construction
    onRefinementSubmit(refinementText);
  };

  const handleLucky = () => {
    // Pass a "feel lucky" request
    onRefinementSubmit("I feel lucky! Make this part of the day extraordinary and unique with amazing local experiences.");
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl max-h-[95vh] overflow-y-auto flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-xl">{getTimeSlotIcon(timeSlot)}</span>
            <Sparkles className="w-4 h-4 text-blue-500" />
            Refine {timeSlot} - Day {dayData.day}
          </DialogTitle>
          <DialogDescription className="text-slate-600 text-sm">
            <span className="font-semibold text-slate-800">{dayData.title}</span>
            <br />
            Tell us how you'd like to improve the {timeSlot.toLowerCase()} portion of this day.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-1 min-h-0 overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar spacing */}
          {/* Current Plan Display */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Current {timeSlot} Plan:</Label>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentDescription || `No specific ${timeSlot.toLowerCase()} activities planned yet.`}
            </p>
          </div>

          {/* Refinement Request Input */}
          <div>
            <Label htmlFor="time-slot-refinement" className="text-sm font-medium text-slate-700">
              Your Request
            </Label>
            <Textarea
              id="time-slot-refinement"
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
              placeholder={`e.g., "Find a rooftop restaurant with great views" or "Add more family-friendly activities" or "Make it more romantic and intimate"`}
              className="mt-2 h-20 text-sm"
              rows={3}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefinementText(`Make the ${timeSlot.toLowerCase()} more adventurous and exciting`)}
              className="text-xs h-8"
            >
              More Adventurous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefinementText(`Find more budget-friendly ${timeSlot.toLowerCase()} options`)}
              className="text-xs h-8"
            >
              Budget-Friendly
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefinementText(`Make the ${timeSlot.toLowerCase()} more romantic and intimate`)}
              className="text-xs h-8"
            >
              More Romantic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefinementText(`Add more family-friendly ${timeSlot.toLowerCase()} activities`)}
              className="text-xs h-8"
            >
              Family-Friendly
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={isRefining} size="sm">
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLucky} 
            disabled={isRefining}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
            size="sm"
          >
            {isRefining ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            I Feel Lucky
          </Button>
          <Button onClick={handleSubmit} disabled={isRefining || !refinementText} size="sm">
            {isRefining ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                Refine {timeSlot}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
