
import React, { useState, useEffect, useCallback } from 'react';
import { Journey } from '@/api/entities';
import { User } from '@/api/entities';
import JourneyCard from '../components/journey/JourneyCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Compass, Trash2, CheckSquare, X, Edit, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { getJourneysForUser } from '@/api/functions';
import { manageJourneyShare } from '@/api/functions';
import { Mail, Check, X as XIcon, Bell, Users, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PremiumGate from '../components/premium/PremiumGate';
import ShareItineraryModal from '../components/journey/ShareItineraryModal';

export default function Journeys() {
  const [createdJourneys, setCreatedJourneys] = useState([]);
  const [sharedJourneys, setSharedJourneys] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedJourneys, setSelectedJourneys] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [journeyToDelete, setJourneyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [journeyToEdit, setJourneyToEdit] = useState(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const [pendingShares, setPendingShares] = useState([]);
  const [isHandlingShare, setIsHandlingShare] = useState(null);
  const [error, setError] = useState('');

  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [journeyToShare, setJourneyToShare] = useState(null);

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
        const userData = await User.me();
        setUser(userData);
        const userEmail = userData.email;

        // Load created journeys (this works fine with RLS)
        const created = await Journey.filter({ created_by: userEmail }, "-created_date");

        // Use backend function to get ALL shared journeys (accepted + pending)
        try {
            const response = await getJourneysForUser();
            const journeyData = response.data;
            
            setSharedJourneys(journeyData?.acceptedShares || []);
            setPendingShares(journeyData?.pendingShares || []);
            
        } catch (sharedError) {
            console.error("[Journeys.js] Error fetching shared journeys:", sharedError);
            setSharedJourneys([]);
            setPendingShares([]);
        }

        // Set created journeys with plan limits
        if (userData.subscription_tier === 'free') {
            if (created.length > 2) setShowLimitMessage(true);
            setCreatedJourneys(created.slice(0, 2));
        } else {
            setShowLimitMessage(false);
            setCreatedJourneys(created);
        }

    } catch (err) {
        console.error("Error loading journeys:", err);
        setUser(null);
        setCreatedJourneys([]);
        setSharedJourneys([]);
        setPendingShares([]);
        setError(err.message || "Failed to load journeys.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectJourney = (journeyId) => {
    const newSelected = new Set(selectedJourneys);
    if (newSelected.has(journeyId)) {
      newSelected.delete(journeyId);
    } else {
      newSelected.add(journeyId);
    }
    setSelectedJourneys(newSelected);
  };

  const handleSelectAll = () => {
    const allJourneyIds = [...createdJourneys, ...sharedJourneys].map(j => j.id);
    if (selectedJourneys.size === allJourneyIds.length) {
      setSelectedJourneys(new Set());
    } else {
      setSelectedJourneys(new Set(allJourneyIds));
    }
  };

  const handleDeleteSingle = (journey) => {
    setJourneyToDelete(journey);
    setShowDeleteModal(true);
  };

  const handleDeleteSelected = () => {
    if (selectedJourneys.size === 0) return;
    setJourneyToDelete(null); 
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (journeyToDelete) {
        await Journey.delete(journeyToDelete.id);
      } else {
        const deletePromises = Array.from(selectedJourneys).map(id => Journey.delete(id));
        await Promise.all(deletePromises);
      }
      await loadData();
    } catch (err) {
      console.error("Error deleting journey(s):", err);
      setError(err.message || "Failed to delete journey(s). Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setJourneyToDelete(null);
      setSelectedJourneys(new Set());
      setIsSelectionMode(false);
    }
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedJourneys(new Set());
  };

  const handleShareClick = (journey) => {
    setJourneyToShare(journey);
    setShowShareModal(true);
  };

  const handleShareSuccess = () => {
    setShowShareModal(false);
    setJourneyToShare(null);
    loadData();
  };

  const handleEditStatus = (journey) => {
    setJourneyToEdit(journey);
    setShowEditStatusModal(true);
  };

  const confirmEditStatus = async () => {
    if (!journeyToEdit) return;
    
    setIsEditingStatus(true);
    try {
      await Journey.update(journeyToEdit.id, { status: 'planning' });
      await loadData();
      setShowEditStatusModal(false);
      setJourneyToEdit(null);
    } catch (err) {
      console.error("Error updating journey status:", err);
      setError(err.message || "Failed to update journey status. Please try again.");
    } finally {
      setIsEditingStatus(false);
    }
  };

  const handleResponseToShare = async (journey, action) => {
    setIsHandlingShare(journey.id);
    setError('');
    try {
      const { data } = await manageJourneyShare({
        action: action,
        journeyId: journey.id
      });

      if (data.success) {
        // Reload all data to get the latest state from the server
        await loadData();
      } else {
        throw new Error(data.error || 'Failed to process share response.');
      }
    } catch (err) {
      console.error(`Error ${action}ing share:`, err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsHandlingShare(null);
    }
  };

  const handlePlanNewJourney = () => {
    if (user?.subscription_tier === 'free' && createdJourneys.length >= 2) {
      setShowUpgradeModal(true);
    } else {
      navigate(createPageUrl('Home'));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-white/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center h-full">
        <Compass className="w-16 h-16 text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Sign in to view your journeys</h2>
        <p className="text-slate-600 mb-4">Log in to see your saved trip plans and continue your adventure.</p>
        <Button onClick={() => User.login()}>Sign In</Button>
      </div>
    );
  }

  const totalJourneys = createdJourneys.length + sharedJourneys.length;

  return (
    <div className="p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Travel Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your journeys and shared itineraries.</p>
        </div>
        
        <div className="flex gap-2 mt-4 sm:mt-0">
          {!isSelectionMode ? (
            <>
              <Button 
                variant="outline" 
                onClick={loadData}
                disabled={isLoading}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                title="Refresh"
              >
                {isLoading ? <Loader2 className="w-4 h-4 md:mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 md:mr-2" />}
                <span className="hidden md:inline">Refresh</span>
              </Button>
              {totalJourneys > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsSelectionMode(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  title="Select Journeys"
                >
                  <CheckSquare className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Select</span>
                </Button>
              )}
              <Button onClick={handlePlanNewJourney} title="Plan New Journey">
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Plan New Journey</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={cancelSelectionMode} title="Cancel Selection">
                <X className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Cancel</span>
              </Button>
              <Button
                onClick={handleDeleteSelected}
                disabled={selectedJourneys.size === 0}
                className="bg-red-600 hover:bg-red-700 text-white"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">
                  Delete {selectedJourneys.size > 0 ? `(${selectedJourneys.size})` : ''}
                </span>
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError('')}>
            <XIcon className="h-6 w-6 text-red-500" />
          </span>
        </motion.div>
      )}

      {showLimitMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900">Free Plan Limit</h4>
                <p className="text-sm text-amber-800 mt-1">
                  You are viewing the 2 most recent journeys you created. Upgrade to Premium to view and create unlimited itineraries.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowUpgradeModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white self-end sm:self-center">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {pendingShares.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Bell className="w-5 h-5" />
                Incoming Share Requests
                <Badge className="bg-blue-600 text-white ml-2">{pendingShares.length}</Badge>
              </CardTitle>
              <CardDescription>
                You've been invited to collaborate on these journeys.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingShares.map(journey => (
                <div key={journey.id} className="p-4 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{journey.destination}</p>
                    <p className="text-sm text-slate-500">
                      Shared by <span className="font-medium">{journey.created_by}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button 
                      size="sm" 
                      onClick={() => handleResponseToShare(journey, 'accept')}
                      disabled={isHandlingShare === journey.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isHandlingShare === journey.id ? (
                        <motion.div 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        </motion.div>
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleResponseToShare(journey, 'decline')}
                      disabled={isHandlingShare === journey.id}
                    >
                      {isHandlingShare === journey.id ? (
                        <motion.div 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700" />
                        </motion.div>
                      ) : (
                        <XIcon className="w-4 h-4 mr-1" />
                      )}
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isSelectionMode && totalJourneys > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedJourneys.size === totalJourneys && totalJourneys > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-blue-900">
                {selectedJourneys.size === 0 
                  ? "Select journeys to delete"
                  : `${selectedJourneys.size} journey${selectedJourneys.size !== 1 ? 's' : ''} selected`
                }
              </span>
            </div>
            {selectedJourneys.size > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {selectedJourneys.size} selected
              </Badge>
            )}
          </div>
        </motion.div>
      )}

      {/* My Created Journeys Section */}
      {createdJourneys.length > 0 && (
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-2">My Journeys</h2>
            <p className="text-slate-600">Itineraries you've created</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {createdJourneys.map((journey) => (
                <JourneyCard 
                  key={journey.id} 
                  journey={journey}
                  user={user}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedJourneys.has(journey.id)}
                  onSelect={handleSelectJourney}
                  onDelete={handleDeleteSingle}
                  onEditStatus={handleEditStatus}
                  onShareClick={handleShareClick}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Shared Journeys Section */}
      {sharedJourneys.length > 0 && (
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-2">Shared with Me</h2>
            <p className="text-slate-600">Itineraries others have shared with you</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sharedJourneys.map((journey) => (
                <JourneyCard 
                  key={journey.id} 
                  journey={journey}
                  user={user}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedJourneys.has(journey.id)}
                  onSelect={handleSelectJourney}
                  onDelete={handleDeleteSingle}
                  onEditStatus={handleEditStatus}
                  onShareClick={handleShareClick}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalJourneys === 0 && pendingShares.length === 0 && (
        <div className="text-center py-16 px-6 bg-white/80 rounded-xl shadow-sm">
          <Compass className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800">No Journeys Yet</h3>
          <p className="text-slate-500 mt-2 mb-4 max-w-md mx-auto">
            You haven't planned any journeys. Let's create your first one!
          </p>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Start Planning
          </Button>
        </div>
      )}

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {journeyToDelete ? 'Delete Journey' : 'Delete Journeys'}
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              {journeyToDelete ? (
                <>
                  Are you sure you want to delete <strong>"{journeyToDelete.destination}"</strong>?
                  <br /><br />
                  This action cannot be undone. All itinerary data will be permanently removed.
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{selectedJourneys.size} journey{selectedJourneys.size !== 1 ? 's' : ''}</strong>?
                  <br /><br />
                  This action cannot be undone. All selected journeys and their itinerary data will be permanently removed.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Deleting...
                </motion.div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {journeyToDelete ? 'Journey' : `${selectedJourneys.size} Journeys`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditStatusModal} onOpenChange={setShowEditStatusModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Journey
            </DialogTitle>
            <DialogDescription className="text-left pt-2 text-slate-700">
              Are you sure you want to change <strong className="text-slate-900">"{journeyToEdit?.destination}"</strong> back to planning mode?
              <br /><br />
              <span className="text-slate-600">
                This will allow you to refine and make changes to your confirmed itinerary. You can confirm it again once you're satisfied with the changes.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditStatusModal(false)}
              disabled={isEditingStatus}
              className="text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEditStatus}
              disabled={isEditingStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditingStatus ? (
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span className="text-white">Updating...</span>
                </motion.div>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  <span className="text-white">Change to Planning</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {journeyToShare && (
        <ShareItineraryModal
            open={showShareModal}
            journey={journeyToShare}
            onClose={() => {
                setShowShareModal(false);
                setJourneyToShare(null);
            }}
            onShareSuccess={handleShareSuccess}
        />
      )}

      {/* Premium Gate Dialog for upgrades */}
      <PremiumGate
        showUpgradeDialog={showUpgradeModal}
        onUpgradeComplete={() => {
          setShowUpgradeModal(false);
          loadData(); // Refresh data after upgrade
        }}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
