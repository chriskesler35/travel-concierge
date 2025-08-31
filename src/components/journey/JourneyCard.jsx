
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Calendar, Users, ArrowRight, Trash2, UserCheck, Edit, Info, Lock, Share2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from "framer-motion";
import PremiumGate from '../premium/PremiumGate';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
};

const statusConfig = {
  planning: { label: 'Planning', color: 'bg-yellow-200 text-yellow-900' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-800' }
};

// Map travel types to background images
const travelTypeImages = {
  ski_trip: 'https://i.imgur.com/1uBC9LQ.jpeg',
  rv_trip: 'https://i.imgur.com/qSQX7OO.jpeg',
  motorcycle: 'https://i.imgur.com/Baw06yl.jpeg',
  destination: 'https://i.imgur.com/kKDvvfd.jpeg',
  driving: 'https://i.imgur.com/D1B6A69.jpeg'
};

export default function JourneyCard({
  journey,
  user,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  onDelete,
  onEditStatus,
  onShareClick
}) {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const normalizeEmail = (email) => email?.trim().toLowerCase() || null;

  // Corrected Logic: Separate true ownership from admin permissions.
  const isCreator = user && journey && (
  journey.user_id && journey.user_id === user.id ||
  normalizeEmail(journey.created_by) === normalizeEmail(user.email));

  const isAdmin = user && user.role === 'admin';
  const canPerformActions = isCreator || isAdmin;

  const isSharedWithUser = !isCreator && user && journey?.shares?.some((s) => normalizeEmail(s.email) === normalizeEmail(user.email) && s.status === 'accepted');

  const needsUpgradeToView = isSharedWithUser && user?.subscription_tier === 'free';

  const pendingShares = journey?.shares?.filter((s) => s.status === 'pending').length || 0;
  const acceptedShares = journey?.shares?.filter((s) => s.status === 'accepted').length || 0;

  const handleViewDetails = () => {
    if (needsUpgradeToView) {
      setShowUpgradeModal(true);
      return;
    }
    if (!isSelectionMode && journey?.id) {
      navigate(createPageUrl(`JourneyDetails?id=${journey.id}`));
    }
  };

  const handleCardClick = () => {
    if (isSelectionMode && journey?.id) {
      onSelect(journey.id);
    } else {
      handleViewDetails();
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (journey && onDelete) {
      onDelete(journey);
    }
  };

  const handleEditStatusClick = (e) => {
    e.stopPropagation();
    if (journey && onEditStatus) {
      onEditStatus(journey);
    }
  };

  const handleShareBadgeClick = (e) => {
    e.stopPropagation();
    if (onShareClick) {
      onShareClick(journey);
    }
  };

  if (!journey) {
    return null;
  }

  const status = statusConfig[journey.status] || statusConfig.planning;
  const isConfirmed = journey.status === 'confirmed';
  
  // Get background image for this travel type
  const backgroundImage = travelTypeImages[journey.traveling_type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative">

      <Card
        className={`overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50/80' : ''}`
        }
        onClick={handleCardClick}>

        {/* Top Section: Status Badge + Action Buttons with Background Image */}
        <div 
          className="relative p-4 border-b flex justify-between items-center min-h-[80px]"
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
          
          <div className="flex items-center gap-2 relative z-10">
            {isSharedWithUser &&
            <div className="p-1 bg-blue-100 text-blue-800 rounded-full" title={`Shared with you`}>
                <Share2 className="w-4 h-4" />
              </div>
            }
            
            {isSelectionMode &&
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => journey?.id && onSelect(journey.id)}
              onClick={(e) => e.stopPropagation()} />
            }
            
            <Badge className={`${status.color} px-2.5 py-0.5 text-xs font-semibold inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-lg`}>
              {status.label}
            </Badge>
            
            {isSharedWithUser && <Badge variant="outline" className="bg-white/90 text-slate-700 px-2.5 py-0.5 text-xs font-normal inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm">Shared</Badge>}
          </div>
          
          {!isSelectionMode && canPerformActions &&
          <div className="flex gap-1 relative z-10">
              {isConfirmed &&
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEditStatusClick}
              className="text-white hover:text-blue-200 hover:bg-white/20 backdrop-blur-sm"
              title="Change status to Planning">
                  <Edit className="w-4 h-4" />
                </Button>
            }
              <Button
              size="icon"
              variant="ghost"
              onClick={handleDeleteClick}
              className="text-white hover:text-red-200 hover:bg-white/20 backdrop-blur-sm"
              title="Delete Journey">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          }
        </div>
        
        {/* Header Section: Journey Title and Description */}
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-bold text-slate-800 mb-1">
            {journey.destination || 'Unnamed Journey'}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 capitalize">
            {journey.traveling_type?.replace('_', ' ') || 'Unknown'}
          </CardDescription>

          {isSharedWithUser && journey.created_by &&
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
               <UserCheck className="w-3 h-3" />
               Shared by {journey.created_by || 'Unknown'}
             </div>
          }
        </CardHeader>
        
        {/* Content Section: Journey Details */}
        <CardContent className="p-4 pt-0 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>
              {journey.origin ?
              `${journey.origin} to ${journey.destination || 'Unknown'}` :
              `Exploring ${journey.destination || 'Unknown'}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{formatDate(journey.start_date)} for {journey.preferred_duration || 0} days</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{journey.travelers || 0} traveler(s)</span>
          </div>
        </CardContent>
        
        {/* Main Action Button */}
        {!isSelectionMode &&
        <CardFooter className="p-4 bg-slate-50 border-t">
            {needsUpgradeToView ?
          <Button onClick={handleViewDetails} className="w-full bg-amber-500 hover:bg-amber-600">
                <Lock className="w-4 h-4 mr-2" />
                Upgrade to View
              </Button> :

          <Button onClick={handleViewDetails} className="w-full bg-blue-600 hover:bg-blue-700">
                {isConfirmed ? 'View Itinerary' : 'Continue Planning'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
          }
          </CardFooter>
        }

        {/* Bottom Section: Share Status Badges (only for owners) */}
        {isCreator && (pendingShares > 0 || acceptedShares > 0) &&
        <div className="px-4 pb-4">
            <button
            onClick={handleShareBadgeClick}
            className="w-full text-left bg-slate-50 rounded-lg p-3 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Manage sharing">

              <div className="flex items-center gap-2 flex-wrap pointer-events-none">
                {pendingShares > 0 &&
              <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50">
                    <Mail className="w-3 h-3 mr-1" />
                    {pendingShares} Pending
                  </Badge>
              }
                {acceptedShares > 0 &&
              <Badge variant="outline" className="text-green-800 border-green-300 bg-green-50">
                    <Users className="w-3 h-3 mr-1" />
                    {acceptedShares} Collaborator{acceptedShares !== 1 ? 's' : ''}
                  </Badge>
              }
              </div>
            </button>
          </div>
        }
      </Card>
      
      {showUpgradeModal &&
      <PremiumGate
        showUpgradeDialog={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="viewing shared journeys" />
      }
    </motion.div>);
}
