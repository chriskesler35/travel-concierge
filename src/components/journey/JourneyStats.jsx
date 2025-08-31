import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Shield, Map, Edit, Check, X, Loader2 } from 'lucide-react';

export default function JourneyStats({ journey, proposal, onUpdate }) {
  const [isEditingTravelers, setIsEditingTravelers] = useState(false);
  const [tempTravelers, setTempTravelers] = useState(journey?.travelers || 1);

  useEffect(() => {
    if (journey) {
      setTempTravelers(journey.travelers);
    }
  }, [journey?.travelers]);

  const handleSaveTravelers = () => {
    const newTravelers = parseInt(tempTravelers, 10);
    if (!isNaN(newTravelers) && newTravelers > 0) {
      onUpdate({ travelers: newTravelers });
      setIsEditingTravelers(false);
    }
  };
  
  if (!journey) return null;

  // Calculate actual duration based on itinerary length
  const getActualDuration = () => {
    const itinerary = proposal?.daily_itinerary || journey?.confirmed_itinerary?.daily_itinerary || journey?.itinerary_proposals?.[0]?.daily_itinerary;
    if (itinerary && itinerary.length > 0) {
      const nights = itinerary.length - 1; // Days minus 1 = nights
      return nights > 0 ? nights : 0;
    }
    return journey?.preferred_duration || 0;
  };

  const actualNights = getActualDuration();

  const stats = [
    {
      icon: Users,
      label: "Travelers",
      value: journey.travelers || "N/A",
      color: "text-blue-500",
      isEditable: true,
    },
    {
      icon: Calendar,
      label: "Duration",
      value: `${actualNights} night${actualNights !== 1 ? 's' : ''}`,
      color: "text-green-500",
    },
    {
      icon: Shield,
      label: "Budget",
      value: journey.budget_range?.replace("_", " ") || "N/A",
      color: "text-purple-500",
    },
    {
      icon: Map,
      label: "Style",
      value: journey.traveling_type?.replace("_", " ") || "N/A",
      color: "text-orange-500",
    },
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-around sm:items-center">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-4 sm:flex-col sm:gap-2 text-center p-2 rounded-lg transition-colors group ${stat.isEditable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
              onClick={() => stat.isEditable && !isEditingTravelers && setIsEditingTravelers(true)}
            >
              <div className={`w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="relative">
                <p className="text-sm text-slate-500">{stat.label}</p>
                {stat.isEditable && isEditingTravelers && stat.label === "Travelers" ? (
                  <div className="flex items-center gap-2 mt-1 -ml-8">
                    <Input
                      type="number"
                      value={tempTravelers}
                      onChange={(e) => setTempTravelers(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTravelers();
                        if (e.key === 'Escape') setIsEditingTravelers(false);
                      }}
                      onBlur={handleSaveTravelers}
                      className="w-20 h-8 text-center"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className="font-bold text-slate-900 capitalize">
                    {stat.value}
                    {stat.isEditable && (
                      <Edit className="w-3 h-3 absolute -right-4 top-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}