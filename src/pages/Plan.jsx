
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Journey } from '@/api/entities';
import { User } from '@/api/entities';
import { getUserUsageStats } from '@/api/functions';
import { createJourney } from '@/api/functions'; // Corrected import
import { getRouteInfo } from '@/api/functions'; // New import
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import AirportLookup from '../components/forms/AirportLookup';
import PremiumGate from '../components/premium/PremiumGate';

import { CalendarIcon, ArrowLeft, ArrowRight, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const steps = ["Details", "Dates", "Preferences", "Review"];

// --- Simplified Frontend Ski Location Validation Logic ---
const skiLocations = [
    "vail", "aspen", "breckenridge", "keystone", "beaver creek", "telluride", "winter park", "copper mountain",
    "steamboat", "park city", "deer valley", "alta", "snowbird", "brighton", "solitude", "jackson hole",
    "sun valley", "big sky", "whistler blackcomb", "mammoth mountain", "palisades tahoe", "heavenly",
    "northstar", "kirkwood", "snowbasin", "powderville", "crystal mountain", "mt. bachelor", "killington",
    "stowe", "sugarbush", "sunday river", "loon mountain", "snowshoe", "tremblant", "denver", "salt lake city", 
    "reno", "bozeman", "burlington", "portland", "seattle", "sacramento", "revelstoke", "kicking horse", 
    "lake louise", "sunshine village", "banff", "whistler", "chamonix", "courchevel", "val d'isère", "tignes", 
    "les arcs", "alpe d'huez", "zermatt", "st. moritz", "verbier", "interlaken", "st. anton", "kitzbühel", 
    "ischgl", "sölden", "cortina d'ampezzo", "dolomites", "niseko", "hakuba", "rusutsu", "furano", "valle nevado", 
    "portillo", "cerro catedral", "crested butte", "red river", "taos", "angel fire"
].map(l => l.toLowerCase());

const quickValidateSkiLocation = (destination) => {
    if (!destination) return false;
    const lowerCaseDestination = destination.toLowerCase().trim();
    return skiLocations.some(loc => lowerCaseDestination.includes(loc));
};
// --- End of Validation Logic ---

const accommodationOptions = [
    { value: 'standard', label: 'Hotel' },
    { value: 'resorts', label: 'Resort' },
    { value: 'boutique', label: 'Boutique Hotel' },
    { value: 'condos', label: 'Condo / Apartment' },
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'vrbo', label: 'VRBO' },
    { value: 'luxury', label: 'Luxury Hotel' },
    { value: 'budget', label: 'Budget / Hostel' },
    { value: 'rv_park', label: 'RV Park' },
    { value: 'camp_grounds', label: 'Campground' },
];

const interestsOptions = [
  "nature", "history", "art_culture", "food_drink", "adventure_sports",
  "relaxation", "nightlife", "shopping", "family_friendly", "romantic_getaway"
];

const skiLevels = [
  "beginner", "intermediate", "advanced", "expert"
];

const preferredTerrainOptions = [
  "groomed", "moguls", "powder", "gladed", "terrain_park"
];

const budgetOptions = [
    { value: 'budget', label: 'Budget (~$150/day)' },
    { value: 'mid-range', label: 'Mid-range (~$300/day)' },
    { value: 'luxury', label: 'Luxury (~$600/day)' },
    { value: 'ultra-luxury', label: 'Ultra-Luxury (~$1200+/day)' },
];

const getInitialJourneyData = (travelingType) => ({
  traveling_type: travelingType || 'destination',
  destination: '',
  origin: '',
  type: 'adventure', // General trip vibe/purpose
  start_date: null,
  preferred_duration: 3,
  travelers: 2,
  budget_range: 'mid-range',
  notes: '',
  add_flight: false,
  flight_details: {
    origin: '',
    destination: '',
    class: 'economy'
  },
  preferences: {
    accommodation_booked: false,
    accommodation_details: '', // New field for accommodation details
    accommodation: ['standard'],
    interests: [],
  },
  ski_days: 2,
  stops_of_interest: '',
});

const tripTypeDisplayNames = {
  driving: "Road Trip",
  motorcycle: "Motorcycle Adventure",
  rv_trip: "RV Trip",
  ski_trip: "Ski Adventure",
  destination: "Destination Travel",
};

const visualMap = {
  ski_trip: "https://imgur.com/4Cn8zdm.png?q=80&w=1974&auto=format&fit=crop",
  rv_trip: "https://imgur.com/qSQX7OO.jpeg?q=80&w=2070&auto=format&fit=crop",
  driving: "https://imgur.com/D1B6A69.png?q=80&w=2070&auto=format&fit=crop",
  motorcycle: "https://imgur.com/Baw06yl.png?q=80&w=2070&auto=format&fit=crop",
  // international removed as it's now a 'type' under 'destination'
  destination: "https://imgur.com/IHFMfsV.jpeg?q=80&w=2070&auto=format&fit=crop"
};

export default function Plan() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const travelingType = urlParams.get('traveling_type');

  const [currentStep, setCurrentStep] = useState(0);
  const [journeyData, setJourneyData] = useState(() => getInitialJourneyData(travelingType));
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState({ journeys_created: 0, limit: 5 });
  const [isLoading, setIsLoading] = useState(true);
  
  // States related to creating the journey record
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from isCreatingJourney
  const [submissionError, setSubmissionError] = useState(null); // Renamed from creationError

  // States for validation errors and generic error modal
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isKnownSkiResort, setIsKnownSkiResort] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);

        const { data: usageData } = await getUserUsageStats();
        setUsage(usageData || { journeys_created: 0, limit: 5 });
      } catch (error) {
        console.error("Error loading user data:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    setIsKnownSkiResort(quickValidateSkiLocation(journeyData.destination));
  }, [journeyData.destination]);


  const handleInputChange = (key, value) => {
    setJourneyData(prev => ({ ...prev, [key]: value }));
  };

  const handleNestedInputChange = (parent, key, value) => {
    setJourneyData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  const handleMultiSelectChange = (parent, key, option) => {
    setJourneyData(prev => {
      const currentOptions = prev[parent][key] || [];
      const newOptions = currentOptions.includes(option)
        ? currentOptions.filter(item => item !== option)
        : [...currentOptions, option];
      return {
        ...prev,
        [parent]: { ...prev[parent], [key]: newOptions }
      };
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const shouldShowFlightOption = useCallback(() => {
    return ['destination', 'ski_trip'].includes(travelingType);
  }, [travelingType]);

  const shouldShowOriginField = useCallback(() => {
    return ['driving', 'motorcycle', 'rv_trip'].includes(travelingType) ||
           (travelingType === 'ski_trip' && !journeyData.add_flight);
  }, [travelingType, journeyData.add_flight]);

  const validateForm = () => {
    const errors = {};
    
    if (!journeyData.destination?.trim()) {
      errors.destination = "Destination is required";
    }
    
    if (shouldShowOriginField() && !journeyData.origin?.trim()) {
      errors.origin = travelingType === 'ski_trip' ? "Departure city is required" : "Origin is required";
    }
    
    // Only require start date if adding flight
    if (journeyData.add_flight && !journeyData.start_date) {
      errors.start_date = "Start date is required when booking flights";
    }
    
    if (!journeyData.travelers || journeyData.travelers < 1) {
      errors.travelers = "At least 1 traveler is required";
    }
    
    if (!journeyData.preferred_duration || journeyData.preferred_duration < 1 || journeyData.preferred_duration > 14) {
      errors.preferred_duration = "Duration must be between 1 and 14 nights.";
    }

    if (travelingType === 'ski_trip') {
      if (!journeyData.ski_days || journeyData.ski_days < 1) {
        errors.ski_days = "At least 1 ski day is required";
      }
      if (journeyData.preferred_duration && journeyData.ski_days && journeyData.ski_days > journeyData.preferred_duration - 1) {
        errors.ski_days = "Ski days cannot exceed total trip duration minus arrival/departure days";
      }
    }
    
    if (journeyData.add_flight) {
      if (!journeyData.flight_details?.origin?.trim()) {
        errors.flight_origin = "Departure airport is required";
      }
      if (!journeyData.flight_details?.destination?.trim()) {
        errors.flight_destination = "Arrival airport is required";
      }
    }
    
    setValidationErrors(errors);
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setValidationErrors({});
    setSubmissionError(null);
    setErrorMessage('');
    setShowErrorModal(false);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      if (errors.destination || errors.origin || errors.flight_origin || errors.flight_destination) {
        setCurrentStep(0);
      } else if (errors.start_date || errors.preferred_duration || errors.ski_days) {
        setCurrentStep(1);
      } else if (errors.travelers) {
        setCurrentStep(2);
      }
      setErrorMessage("Please correct the highlighted errors before proceeding.");
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      let effectiveOriginForGeneration = journeyData.origin;
      if (travelingType === 'ski_trip' && journeyData.add_flight) {
          effectiveOriginForGeneration = journeyData.flight_details?.origin || '';
      } else if (journeyData.add_flight && !journeyData.origin) {
          effectiveOriginForGeneration = journeyData.flight_details?.origin || '';
      }

      const cleanedJourneyData = {
        traveling_type: travelingType,
        type: journeyData.type || null,
        origin: effectiveOriginForGeneration || null,
        destination: journeyData.destination,
        waypoints: [],
        start_date: journeyData.start_date ? format(journeyData.start_date, 'yyyy-MM-dd') : null,
        end_date: null,
        preferred_duration: journeyData.preferred_duration,
        ski_days: travelingType === 'ski_trip' ? journeyData.ski_days : undefined,
        add_flight: journeyData.add_flight || false,
        flight_details: journeyData.add_flight ? journeyData.flight_details : undefined,
        budget_range: journeyData.budget_range,
        travelers: journeyData.travelers,
        preferences: {
          accommodation_booked: journeyData.preferences.accommodation_booked,
          accommodation: journeyData.preferences.accommodation_booked ? [] : (journeyData.preferences.accommodation || []),
          accommodation_details: journeyData.preferences.accommodation_booked ? journeyData.preferences.accommodation_details : null,
          dining: [],
          activities: journeyData.preferences.interests || [],
          transportation: null,
          cruise_lines: []
        },
        status: 'planning',
        notes: journeyData.notes || '',
        estimated_drive_time: null,
        itinerary_proposals_generated: false,
        itinerary_proposals: null,
        confirmed_itinerary: null,
        shares: []
      };
      
      if (['driving', 'motorcycle', 'rv_trip'].includes(travelingType)) {
        cleanedJourneyData.stops_of_interest = journeyData.stops_of_interest || '';
      }

      console.log('Sending cleaned journey data to create journey record:', cleanedJourneyData);

      const response = await createJourney({ journeyData: cleanedJourneyData }); // Corrected function call
      
      if (!response.data.success) { // Updated success check
        const errorMsg = response.data.error || "An unknown error occurred during journey creation.";
        console.error('Failed to create journey record:', errorMsg);
        throw new Error(errorMsg);
      }

      if (response.data.journeyId) {
        console.log('Journey record created successfully:', response.data.journeyId);
        navigate(createPageUrl(`JourneyDetails?id=${response.data.journeyId}&new=true`)); // Changed triggerAI to new=true
      } else {
          throw new Error("Journey created successfully, but no ID received for navigation.");
      }

    } catch (e) {
      console.error("Error creating journey record:", e);
      setSubmissionError(e.message || "An unexpected error occurred during journey creation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0:
        let baseValid = !!journeyData.destination?.trim();
        
        if (shouldShowOriginField()) {
            baseValid = baseValid && !!journeyData.origin?.trim();
        }
        if (journeyData.add_flight) {
            baseValid = baseValid && !!journeyData.flight_details?.origin?.trim() && !!journeyData.flight_details?.destination?.trim();
        }
        return baseValid;
      case 1:
        // Only require start date if adding flight, always require duration
        const dateValid = journeyData.add_flight ? !!journeyData.start_date : true;
        return dateValid && journeyData.preferred_duration >= 1;
      case 2:
        return journeyData.travelers >= 1;
      case 3:
        return true;
      default:
        return true;
    }
  }, [currentStep, journeyData, shouldShowOriginField]);

  const isSkiTrip = travelingType === 'ski_trip';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabledSkiDate = (date) => {
    if (!isSkiTrip) return false;
    const month = date.getMonth();
    // const year = date.getFullYear(); // Not used
    // const currentYear = new Date().getFullYear(); // Not used

    const isWinterMonth = month >= 10 || month <= 3; // Nov (10) to April (3)
    
    return !isWinterMonth;
  };


  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  const hasExceededLimit = user && user.subscription_tier === 'free' && usage.journeys_created >= usage.limit;

  if (hasExceededLimit) {
    return (
      <div className="p-6">
        <PremiumGate featureName="planning additional journeys" showUpgradeDialog={true} onUpgradeComplete={() => window.location.reload()} />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {shouldShowOriginField() && (
              <div className="space-y-2">
                <Label htmlFor="origin">
                  {travelingType === 'ski_trip' ? 'Driving From' : 'Starting From'}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="origin"
                  value={journeyData.origin || ''}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  placeholder={travelingType === 'ski_trip' ? 'e.g., Denver, CO' : 'e.g., Los Angeles, CA'}
                  className={validationErrors.origin ? 'border-red-500' : ''}
                />
                {validationErrors.origin && <p className="text-red-500 text-sm mt-1">{validationErrors.origin}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="destination">
                {travelingType === 'ski_trip' ? 'Ski Destination' : 'Destination'}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="destination"
                  value={journeyData.destination || ''}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder={
                    travelingType === 'ski_trip'
                      ? 'e.g., Aspen, Vail, Jackson Hole'
                      : 'Enter destination'
                  }
                  className={`${validationErrors.destination ? 'border-red-500' : ''} ${isKnownSkiResort ? 'border-green-500' : ''}`}
                />
              </div>
              
              {validationErrors.destination && <p className="text-red-500 text-sm mt-1">{validationErrors.destination}</p>}
              
              {travelingType === 'ski_trip' && (
                  <p className="text-xs text-slate-500 mt-1">
                      {isKnownSkiResort ? '✓ Known ski destination' : 'Destination will be verified by our AI upon submission.'}
                  </p>
              )}
            </div>

            {travelingType !== 'ski_trip' && (
              <div>
                <Label>What's the vibe?</Label>
                <Select value={journeyData.type} onValueChange={(val) => handleInputChange('type', val)}>
                  <SelectTrigger><SelectValue placeholder="Select trip type" /></SelectTrigger>
                  <SelectContent container={document.body}>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {shouldShowFlightOption() && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold text-slate-900">
                      {travelingType === 'ski_trip' ? 'Fly to Ski Destination?' : 'Add Flight?'}
                    </Label>
                    <p className="text-sm text-slate-600">
                      {travelingType === 'ski_trip'
                        ? 'Choose to fly to your ski destination or drive there'
                        : 'Include flight booking recommendations in your itinerary'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={journeyData.add_flight || false}
                    onCheckedChange={(checked) => setJourneyData(prev => ({
                      ...prev,
                      add_flight: checked,
                      flight_details: checked ? (prev.flight_details || { origin: '', destination: '', class: 'economy' }) : undefined
                    }))}
                  />
                </div>

                <AnimatePresence>
                  {journeyData.add_flight && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                        <div className="space-y-2">
                          <Label htmlFor="flight_origin">
                            {travelingType === 'ski_trip' ? 'Departure Airport' : 'From Airport'} <span className="text-red-500">*</span>
                          </Label>
                          <AirportLookup
                            initialValue={journeyData.flight_details?.origin || ''}
                            onSelect={(airport) => handleNestedInputChange('flight_details', 'origin', airport.iata)}
                            placeholder="Search departure airport..."
                            isInvalid={!!validationErrors.flight_origin}
                          />
                          {validationErrors.flight_origin && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.flight_origin}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="flight_destination">
                            {travelingType === 'ski_trip' ? 'Nearest Airport to Ski Resort' : 'To Airport'} <span className="text-red-500">*</span>
                          </Label>
                          <AirportLookup
                            initialValue={journeyData.flight_details?.destination || ''}
                            onSelect={(airport) => handleNestedInputChange('flight_details', 'destination', airport.iata)}
                            placeholder={
                              travelingType === 'ski_trip'
                                ? 'Search airport near ski resort...'
                                : 'Search destination airport...'
                            }
                            isInvalid={!!validationErrors.flight_destination}
                          />
                          {validationErrors.flight_destination && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.flight_destination}</p>
                          )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="flight_class">Preferred Class</Label>
                          <Select
                            value={journeyData.flight_details?.class || 'economy'}
                            onValueChange={(value) => handleNestedInputChange('flight_details', 'class', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select flight class" />
                            </SelectTrigger>
                            <SelectContent container={document.body}>
                              <SelectItem value="economy">Economy</SelectItem>
                              <SelectItem value="premium_economy">Premium Economy</SelectItem>
                              <SelectItem value="business">Business Class</SelectItem>
                              <SelectItem value="first_class">First Class</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">When and for how long?</h3>
            <div>
              <Label>Start Date {journeyData.add_flight && <span className="text-red-500">*</span>}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start text-left font-normal ${validationErrors.start_date ? 'border-red-500' : ''}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {journeyData.start_date ? format(journeyData.start_date, 'PPP') : <span>Pick a date {journeyData.add_flight ? '' : '(optional)'}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={journeyData.start_date}
                    onSelect={(date) => handleInputChange('start_date', date)}
                    disabled={(date) => date < today || disabledSkiDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {validationErrors.start_date && <p className="text-red-500 text-sm mt-1">{validationErrors.start_date}</p>}
              {isSkiTrip && <p className="text-xs text-slate-500 mt-1">Ski season is typically November to April. Dates outside this range are disabled.</p>}
              {!journeyData.add_flight && (
                <p className="text-xs text-slate-500 mt-1">
                  Start date is optional for this trip type. You can plan your itinerary and choose dates later.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferred_duration">Number of Nights (e.g., 7 nights = 8 days)</Label>
                <Input
                  id="preferred_duration"
                  type="number"
                  value={journeyData.preferred_duration}
                  onChange={(e) => handleInputChange('preferred_duration', parseInt(e.target.value))}
                  placeholder="e.g., 7"
                  min="1"
                  max="14"
                  className={validationErrors.preferred_duration ? 'border-red-500' : ''}
                />
                {validationErrors.preferred_duration && <p className="text-red-500 text-sm mt-1">{validationErrors.preferred_duration}</p>}
              </div>
              
              {travelingType === 'ski_trip' && (
                <div>
                  <Label>Ski Days</Label>
                  <Input
                    type="number"
                    value={journeyData.ski_days || ''}
                    onChange={(e) => handleInputChange('ski_days', parseInt(e.target.value))}
                    min="1"
                    max={journeyData.preferred_duration ? journeyData.preferred_duration - 1 : undefined}
                    className={validationErrors.ski_days ? 'border-red-500' : ''}
                  />
                  {validationErrors.ski_days && <p className="text-red-500 text-sm mt-1">{validationErrors.ski_days}</p>}
                  {!validationErrors.ski_days && (
                    <p className="text-xs text-slate-500 mt-1">
                      Number of days you want to ski (excludes arrival/departure)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Let's get the details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Travelers</Label>
                <Input
                  type="number"
                  value={journeyData.travelers}
                  onChange={(e) => handleInputChange('travelers', parseInt(e.target.value))}
                  min="1"
                  className={validationErrors.travelers ? 'border-red-500' : ''}
                />
                {validationErrors.travelers && <p className="text-red-500 text-sm mt-1">{validationErrors.travelers}</p>}
              </div>
              <div>
                <Label>Budget</Label>
                <Select value={journeyData.budget_range} onValueChange={(val) => handleInputChange('budget_range', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent container={document.body}>
                    {budgetOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="accommodation-booked"
                    checked={journeyData.preferences.accommodation_booked}
                    onCheckedChange={(val) => handleNestedInputChange('preferences', 'accommodation_booked', val)}
                />
                <Label htmlFor="accommodation-booked">I've already booked accommodation</Label>
            </div>

            <AnimatePresence>
              {journeyData.preferences.accommodation_booked ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label htmlFor="accommodation-details">Where are you staying?</Label>
                    <Textarea
                      id="accommodation-details"
                      value={journeyData.preferences.accommodation_details || ''}
                      onChange={(e) => handleNestedInputChange('preferences', 'accommodation_details', e.target.value)}
                      placeholder="e.g., Marriott Downtown, Airbnb on 5th Street, The Ritz-Carlton, family condo at Beaver Creek..."
                      className="h-20"
                    />
                    <p className="text-xs text-slate-500">
                      Include the name and location of your accommodation so we can recommend nearby restaurants, activities, and attractions.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div>
                    <Label>Accommodation Preferences</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {accommodationOptions.map(opt => (
                        <Button
                          key={opt.value}
                          variant={journeyData.preferences.accommodation.includes(opt.value) ? 'default' : 'outline'}
                          onClick={() => handleMultiSelectChange('preferences', 'accommodation', opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  { (journeyData.preferences.accommodation.includes('airbnb') || journeyData.preferences.accommodation.includes('vrbo') || journeyData.preferences.accommodation.includes('condos')) && (
                      <div className="card mt-4 p-4 bg-slate-50 border rounded-lg">
                          <h4 className="text-base mb-2 font-semibold">Vacation Rental Sites</h4>
                          <p className="text-sm mb-3 text-slate-600">Search for rentals in {journeyData.destination || 'your destination'}:</p>
                          <div className="flex flex-wrap gap-2">
                              <Button asChild size="sm" variant="outline">
                                  <a href={`https://www.airbnb.com/s/${encodeURIComponent(journeyData.destination || '')}`} target="_blank" rel="noopener noreferrer">Airbnb</a>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                  <a href={`https://www.vrbo.com/search?q=${encodeURIComponent(journeyData.destination || '')}`} target="_blank" rel="noopener noreferrer">Vrbo</a>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                  <a href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(journeyData.destination || '')}`} target="_blank" rel="noopener noreferrer">Booking.com</a>
                              </Button>
                          </div>
                      </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label>Interests & Activities</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {interestsOptions.map(opt => (
                  <Button
                    key={opt}
                    variant={journeyData.preferences.interests.includes(opt) ? 'default' : 'outline'}
                    onClick={() => handleMultiSelectChange('preferences', 'interests', opt)}
                    className="capitalize"
                  >
                    {opt.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {travelingType === 'ski_trip' && (
              <div className="card p-4 bg-slate-50 space-y-4 border rounded-lg">
                 <h4 className="text-lg font-semibold">Ski Trip Notes</h4>
                 <p className="text-sm text-slate-600">The AI will craft your ski days, include a rest day with other activities, and recommend gear rental shops at your destination.</p>
              </div>
            )}

            {['driving', 'motorcycle', 'rv_trip'].includes(travelingType) && (
              <div className="card p-4 bg-slate-50 space-y-4 border rounded-lg">
                <h4 className="text-lg font-semibold">Route Details</h4>
                <div>
                  <Label>Stops of Interest / Scenic Routes</Label>
                  <Textarea
                    value={journeyData.stops_of_interest}
                    onChange={(e) => handleInputChange('stops_of_interest', e.target.value)}
                    placeholder="e.g., Grand Canyon, Pacific Coast Highway, quaint towns..."
                  />
                   <p className="text-xs text-slate-500 mt-1">
                      Mention any specific places you want to see or roads you want to travel.
                    </p>
                </div>
              </div>
            )}

            <div>
              <Label>Notes & Special Requests</Label>
              <Textarea
                value={journeyData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="e.g., Any allergies, specific activities, must-see places..."
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Review Your Trip</CardTitle>
                <CardDescription>Does this look right? Let our AI craft your perfect journey!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm border">
                  <p><strong>Travel Type:</strong> <span className="capitalize">{tripTypeDisplayNames[travelingType] || travelingType?.replace(/_/g, ' ')}</span></p>
                  {journeyData.add_flight ? (
                    <p><strong>Flight Origin:</strong> {journeyData.flight_details?.origin || 'N/A'}</p>
                  ) : (
                    shouldShowOriginField() && journeyData.origin && <p><strong>Origin:</strong> {journeyData.origin}</p>
                  )}
                  <p><strong>Destination:</strong> {journeyData.destination || 'N/A'}</p>
                  {travelingType !== 'ski_trip' && <p><strong>Trip Vibe:</strong> <span className="capitalize">{journeyData.type?.replace(/_/g, ' ')}</span></p>}
                  <p><strong>Dates:</strong> {journeyData.start_date ? format(journeyData.start_date, 'PPP') : 'Not specified'} for {journeyData.preferred_duration} nights</p>
                  <p><strong>Travelers:</strong> {journeyData.travelers}</p>
                  <p><strong>Budget:</strong> <span className="capitalize">{budgetOptions.find(b => b.value === journeyData.budget_range)?.label || journeyData.budget_range?.replace(/_/g, ' ')}</span></p>
                  {journeyData.add_flight && (
                    <p><strong>Flight:</strong> To {journeyData.flight_details?.destination || 'N/A'} ({journeyData.flight_details?.class} class)</p>
                  )}
                  {journeyData.preferences.accommodation_booked ? (
                    <p><strong>Accommodation:</strong> {journeyData.preferences.accommodation_details || 'Details not provided'}</p>
                  ) : (
                    journeyData.preferences.accommodation.length > 0 && (
                      <p>
                        <strong>Accommodation:</strong> {
                          journeyData.preferences.accommodation
                            .map(val => accommodationOptions.find(opt => opt.value === val)?.label || val.replace(/_/g, ' '))
                            .join(', ')
                        }
                      </p>
                    )
                  )}
                  {journeyData.preferences.interests.length > 0 && (
                    <p><strong>Interests:</strong> {journeyData.preferences.interests.map(i => i.replace(/_/g, ' ')).join(', ')}</p>
                  )}
                  {travelingType === 'ski_trip' && (
                      <p><strong>Ski Days:</strong> {journeyData.ski_days}</p>
                  )}
                  {['driving', 'motorcycle', 'rv_trip'].includes(travelingType) && journeyData.stops_of_interest && (
                    <p><strong>Stops of Interest:</strong> {journeyData.stops_of_interest}</p>
                  )}
                  {journeyData.notes && (
                    <p><strong>Notes:</strong> {journeyData.notes}</p>
                  )}
                </div>
                
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white mt-6"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating Your Journey...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate My Itinerary
                        </>
                    )}
                </Button>
                {submissionError && <p className="text-red-500 text-sm mt-4">{submissionError}</p>}
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  const cardTitle = currentStep === 0
      ? tripTypeDisplayNames[travelingType] || 'Trip Details'
      : steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Plan Your {tripTypeDisplayNames[travelingType] || travelingType?.replace(/_/g, ' ')}
          </h1>
          <p className="text-lg text-gray-600">
            Let our AI help you craft the perfect adventure.
          </p>
        </div>

        <div className="space-y-8">
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <Progress value={(currentStep + 1) / steps.length * 100} className="mb-4" />
              <div className="text-center mb-6">
                <p className="text-sm font-medium text-blue-600">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <h2 className="text-xl sm:text-2xl mt-1 capitalize font-semibold text-slate-800">{cardTitle}</h2>
              </div>

              <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button onClick={handleNext} disabled={!canProceed}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </div>

      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-500"/>Oops!
            </DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowErrorModal(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
