
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/index";
import { motion } from "framer-motion";
import {
  Globe,
  // MapPin, // MapPin is no longer used after combining travel types
  Car,
  Bike,
  Crown,
  Shield,
  MessageSquare,
  Snowflake,
  Compass,
  Star
} from "lucide-react";
import { User } from "@/api/entities";
import { Feedback } from "@/api/entities";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import JourneyTypeCard from "../components/journey/JourneyTypeCard";
import UsageLimits from "../components/premium/UsageLimits";
import PremiumGate from "../components/premium/PremiumGate";

const travelingTypes = [
  {
    id: "driving",
    title: "Road Trip",
    description: "Explore amazing destinations by car with flexible stops along the way.",
    icon: Car,
    gradient: "bg-gradient-to-br from-blue-400 to-cyan-500"
  },
  {
    id: "motorcycle",
    title: "Motorcycle Adventure",
    description: "Experience the freedom of the open road on two wheels.",
    icon: Bike,
    gradient: "bg-gradient-to-br from-slate-600 to-gray-800"
  },
  {
    id: "rv_trip",
    title: "RV Adventure",
    description: "Travel in comfort with your home on wheels, staying at RV parks and campgrounds.",
    icon: Car,
    gradient: "bg-gradient-to-br from-orange-500 to-red-500"
  },
  {
    id: "destination",
    title: "Destination Travel",
    description: "Explore incredible destinations worldwide, from nearby getaways to international adventures.",
    icon: Globe,
    gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
    premium: true
  },
  {
    id: "ski_trip",
    title: "Ski Adventures",
    description: "Hit the slopes at world-class ski resorts and mountain destinations.",
    icon: Snowflake,
    gradient: "bg-gradient-to-br from-sky-400 to-blue-600"
  }
];

const initialFeedbackState = {
  name: "",
  email: "",
  rating: 0,
  navigation_feedback: "",
  ease_of_use_feedback: "",
  itinerary_feedback: "",
  additional_comments: ""
};

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(initialFeedbackState);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  useEffect(() => {
    loadUser();

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change in Home:', event, session?.user?.email);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setFeedback(initialFeedbackState);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      console.log('Loading user...');
      const userData = await User.me();
      console.log('User data loaded:', userData);
      setUser(userData);
      if (userData) {
        console.log('User role:', userData.role, 'Subscription:', userData.subscription_tier);
        setFeedback(prev => ({ 
          ...prev, 
          name: userData.full_name || '', 
          email: userData.email || '' 
        }));
      } else {
        console.log('No user data returned');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleJourneyTypeClick = (typeId, isPremium) => {
    if (isPremium && (!user || user.subscription_tier === 'free')) {
      setShowPremiumGate(true);
      return;
    }
    navigate(createPageUrl(`Plan?traveling_type=${typeId}`));
  };

  const handleFeedbackSubmit = async () => {
    if (feedback.rating === 0) {
      alert("Please provide a rating.");
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await Feedback.create(feedback);
      setShowFeedback(false);
      setFeedback(initialFeedbackState);
      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("There was an error submitting your feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden py-24 sm:py-32"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">Your Journey, Reimagined</h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto">
              Select your travel style and let our AI-powered concierge craft your perfect, personalized itinerary.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Choose Your Adventure</h2>
          <p className="text-slate-600">Start by selecting the type of journey you're dreaming of.</p>
        </div>

        {user && <UsageLimits user={user} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {travelingTypes.map((type) => (
            <JourneyTypeCard
              key={type.id}
              {...type}
              onClick={handleJourneyTypeClick}
              user={user}
              isLoadingUser={isLoadingUser}
              compact={true}
            />
          ))}
        </div>
      </div>

      {/* Feedback Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setShowFeedback(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg h-14 w-14 flex items-center justify-center"
          aria-label="Give Feedback"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              We value your feedback to improve Travel Concierge.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Overall Rating</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 cursor-pointer transition-colors ${
                      (hoverRating || feedback.rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'
                    }`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setFeedback({ ...feedback, rating: star })}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                placeholder="What did you like? What could be better?"
                value={feedback.additional_comments}
                onChange={(e) => setFeedback({ ...feedback, additional_comments: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedback(false)}>Cancel</Button>
            <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback}>
              {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium Gate Dialog */}
      {showPremiumGate && (
        <PremiumGate
          showUpgradeDialog={showPremiumGate}
          onUpgradeComplete={() => {
            setShowPremiumGate(false);
            loadUser();
          }}
          onClose={() => setShowPremiumGate(false)}
        />
      )}
    </div>
  );
}
