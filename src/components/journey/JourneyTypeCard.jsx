import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";

// Map travel types to background images
const travelTypeImages = {
  ski_trip: 'https://i.imgur.com/1uBC9LQ.jpeg',
  rv_trip: 'https://i.imgur.com/qSQX7OO.jpeg',
  motorcycle: 'https://i.imgur.com/Baw06yl.jpeg',
  destination: 'https://i.imgur.com/kKDvvfd.jpeg',
  driving: 'https://i.imgur.com/D1B6A69.jpeg'
};

export default function JourneyTypeCard({ 
  id,
  title, 
  description, 
  features, 
  icon: Icon, 
  gradient, 
  onClick,
  user,
  isLoadingUser,
  premium = false,
  compact = false
}) {
  const handleClick = () => {
    if (onClick) {
      onClick(id, premium);
    }
  };

  // Get background image for this travel type
  const backgroundImage = travelTypeImages[id];

  if (compact) {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative"
      >
        <Card className="overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-500 h-full group cursor-pointer">
          {premium && (!user || user.subscription_tier === 'free') && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-amber-500 text-white shadow-lg text-xs">
                <Star className="w-2 h-2 mr-1" />
                Premium
              </Badge>
            </div>
          )}
          
          <div 
            className="relative h-20 overflow-hidden"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#e0fff9' // fallback color
            }}
          >
            {/* Overlay for better text readability */}
            {backgroundImage && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <div className="absolute bottom-2 left-2 z-10">
              <div className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-lg">
                <Icon className="w-4 h-4 text-slate-700" />
              </div>
            </div>
            <div className="absolute top-2 right-2 opacity-10 z-10">
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          <CardContent className="p-4">
            <div className="mb-3">
              <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{description}</p>
            </div>

            <Button 
              onClick={handleClick}
              size="sm"
              disabled={premium && (!user || user.subscription_tier === 'free')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {premium && (!user || user.subscription_tier === 'free') ? 'Premium Only' : 'Select'}
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Original full-size card for other uses
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative"
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 h-full group cursor-pointer" onClick={handleClick}>
        {premium && (!user || user.subscription_tier === 'free') && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-amber-500 text-white shadow-lg">
              <Star className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
        )}
        
        <div 
          className="relative h-32 overflow-hidden"
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#e0fff9' // fallback color
          }}
        >
          {/* Overlay for better text readability */}
          {backgroundImage && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <div className="absolute bottom-4 left-4 z-10">
            <div className="w-12 h-12 bg-white/90 rounded-xl flex items-center justify-center shadow-lg">
              <Icon className="w-6 h-6 text-slate-700" />
            </div>
          </div>
          <div className="absolute top-4 right-4 opacity-10 z-10">
            <Icon className="w-16 h-16 text-white" />
          </div>
        </div>

        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
          </div>

          {features && features.length > 0 && (
            <div className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  <span className="text-sm text-slate-600">{feature}</span>
                </div>
              ))}
            </div>
          )}

          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            disabled={premium && (!user || user.subscription_tier === 'free')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {premium && (!user || user.subscription_tier === 'free') ? 'Upgrade for Access' : 'Plan This Journey'}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}