
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Journey } from '@/api/entities';
import { User } from '@/api/entities';
import { generatePdf } from '@/api/functions';
import { createPageUrl } from '@/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import _ from 'lodash';
import { fetchJourney } from '@/api/functions';
import { manageJourneyShare } from '@/api/functions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsTrigger, TabsList } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  ArrowLeft, Check, Download, Share2, Loader2, AlertTriangle, Wand2, Sparkles, Pin, Save, ChevronsUpDown, Edit, X,
  CheckCircle, MapPin, Calendar, Users, Home, Trash2, Plus, Star, Pencil, UserCheck
} from 'lucide-react';

import JourneyStats from '../components/journey/JourneyStats';
import DailyItinerary from '../components/journey/DailyItinerary';
import DayRefinementModal from '../components/journey/DayRefinementModal';
import ShareItineraryModal from '../components/journey/ShareItineraryModal';
import TimeSlotRefinementModal from '../components/journey/TimeSlotRefinementModal';
import { InvokeLLM } from '@/api/integrations';
import AIProgressModal from '../components/common/AIProgressModal';
import PremiumFeatureWrapper from '../components/premium/PremiumFeatureWrapper';
import PremiumGate from '../components/premium/PremiumGate';
import { getRouteInfo } from '@/api/functions';
import { getDrivingRoute } from '@/api/functions';

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
};

// Helper function to clean up text
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\\n\\n/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper function to parse LLM response into structured itinerary (multiple days)
const parseMultiDayItineraryResponse = (llmText, totalDays) => {
  const days = [];
  const daySegments = llmText.split(/(\*\*Day \d+:\s*[^\n]+\*\*)/).filter(segment => segment.trim());

  let currentDaySegment = '';
  for (let i = 0; i < daySegments.length; i++) {
    if (daySegments[i].startsWith('**Day')) {
      if (currentDaySegment) {
        days.push(currentDaySegment);
      }
      currentDaySegment = daySegments[i];
    } else {
      currentDaySegment += daySegments[i];
    }
  }
  if (currentDaySegment) {
    days.push(currentDaySegment);
  }

  // Robust cleanTextContent helper for parsing that preserves markdown links
  const cleanTextContent = (text) => {
    if (!text) return '';
    const linkPlaceholder = "___LINK_PLACEHOLDER___";
    const links = [];
    let cleaned = text.replace(/\[([^\]]+?)\]\((https?:\/\/[^\s)]+?)\)/g, (match, p1, p2) => {
      links.push({ text: p1, url: p2 });
      return `${linkPlaceholder}${links.length - 1}___`;
    });

    cleaned = cleaned
      .replace(/\*\*/g, '')        // Remove bold markers
      .replace(/\\n\\n/g, ' ')     // Remove literal "\n\n" strings
      .replace(/\\n/g, ' ')        // Remove literal "\n" strings
      .replace(/\n-\s/g, ' ')      // Convert list items to sentences
      .replace(/[\n\r]/g, ' ')     // Remove actual newline characters
      .replace(/^- /, '')          // Clean up any leading list marker
      .replace(/\s\s+/g, ' ')      // Collapse multiple spaces
      .trim();
    
    return cleaned.replace(new RegExp(`${linkPlaceholder}(\\d+)___`, 'g'), (match, index) => {
      const link = links[parseInt(index, 10)];
      return link ? `[${link.text}](${link.url})` : '';
    });
  };

  const parsedDays = [];
  for (let i = 0; i < days.length && i < totalDays; i++) {
    const segment = days[i];
    const dayNumber = i + 1;

    const titleMatch = segment.match(/\*\*Day \d+:\s*([^\n*]+)\*\*/);
    const title = titleMatch ? titleMatch[1].trim() : `Day ${dayNumber}`;

    const summaryMatch = segment.match(/Summary:\s*([\s\S]*?)(?=Morning:|$)/);
    const morningMatch = segment.match(/Morning:\s*([\s\S]*?)(?=Lunch:|$)/);
    const lunchMatch = segment.match(/Lunch:\s*([\s\S]*?)(?=Afternoon:|$)/);
    const dinnerMatch = segment.match(/Dinner:\s*([\s\S]*?)(?=Additional:|$)/);
    const afternoonMatch = segment.match(/Afternoon:\s*([\sS]*?)(?=Dinner:|$)/);
    const additionalMatch = segment.match(/Additional:\s*([\s\S]*)$/);

    parsedDays.push({
      id: `day-${Date.now()}-${i}`,
      day: dayNumber,
      title: title,
      description: cleanTextContent(summaryMatch?.[1]),
      activities: [
        { time: "Morning", name: "Morning Activities", description: cleanTextContent(morningMatch?.[1]) },
        { time: "Lunch", name: "Lunch", description: cleanTextContent(lunchMatch?.[1]) },
        { time: "Afternoon", name: "Afternoon Adventures", description: cleanTextContent(afternoonMatch?.[1]) },
        { time: "Dinner", name: "Dinner", description: cleanTextContent(dinnerMatch?.[1]) },
        { time: "Additional", name: "Additional Recommendations", description: cleanTextContent(additionalMatch?.[1]) }
      ]
    });
  }
  return parsedDays;
};

// Helper function to parse LLM response for a single day (e.g., for refinement)
const parseSingleDayResponse = (text, dayNumber) => {
  const dayRegex = new RegExp(`\\*\\*Day ${dayNumber}:\\s*([^*\\n]+)\\*\\*([\\s\\S]*?)(?=\\*\\*Day ${dayNumber + 1}:|$)`, 'i');
  const dayMatch = text.match(dayRegex);
  if (!dayMatch) return null;

  const dayContent = dayMatch[2];
  
  const cleanText = (text) => {
      if (!text) return '';
      const linkPlaceholder = "___LINK_PLACEHOLDER___";
      const links = [];
      let cleaned = text.replace(/\[([^\]]+?)\]\((https?:\/\/[^\s)]+?)\)/g, (match, p1, p2) => {
          links.push({ text: p1, url: p2 });
          return `${linkPlaceholder}${links.length - 1}___`;
      });

      cleaned = cleaned
          .replace(/\*\*/g, '')        // Remove bold markers
          .replace(/\\n\\n/g, ' ')     // Remove literal "\n\n" strings
          .replace(/\\n/g, ' ')        // Remove literal "\n" strings
          .replace(/\n-\s/g, ' ')      // Convert list items to sentences
          .replace(/[\n\r]/g, ' ')     // Remove actual newline characters
          .replace(/^- /, '')          // Clean up any leading list marker
          .replace(/\s\s+/g, ' ')      // Collapse multiple spaces
          .trim();
      
      return cleaned.replace(new RegExp(`${linkPlaceholder}(\\d+)___`, 'g'), (match, index) => {
          const link = links[parseInt(index, 10)];
          return link ? `[${link.text}](${link.url})` : '';
      });
  };

  const titleMatch = dayMatch[1].trim();

  const summaryMatch = dayContent.match(/\*\*Summary:\*\*\s*([\s\S]*?)(?=\*\*Morning:|$)/i);
  const morningMatch = dayContent.match(/\*\*Morning:\*\*\s*([\s\S]*?)(?=\*\*Lunch:|$)/i);
  const lunchMatch = dayContent.match(/\*\*Lunch:\*\*\s*([\s\S]*?)(?=\*\*Afternoon:|$)/i);
  const dinnerMatch = dayContent.match(/\*\*Dinner:\*\*\s*([\s\S]*?)(?=\*\*Additional:|$)/i);
  const afternoonMatch = dayContent.match(/\*\*Afternoon:\*\*\s*([\sS]*?)(?=\*\*Dinner:|$)/i);
  const additionalMatch = dayContent.match(/\*\*Additional:\*\*\s*([\s\S]*)$/i);

  const parsedDay = {
      id: `day-${Date.now()}-${dayNumber}`, // Generate a new ID if needed, or use existing one if known
      day: dayNumber,
      title: titleMatch,
      description: cleanText(summaryMatch?.[1]),
      activities: [
          { time: "Morning", name: "Morning Activities", description: cleanText(morningMatch?.[1]) },
          { time: "Lunch", name: "Lunch", description: cleanText(lunchMatch?.[1]) },
          { time: "Afternoon", name: "Afternoon Adventures", description: cleanText(afternoonMatch?.[1]) },
          { time: "Dinner", name: "Dinner", description: cleanText(dinnerMatch?.[1]) },
          { time: "Additional", name: "Additional Recommendations", description: cleanText(additionalMatch?.[1]) }
      ]
  };
  return parsedDay;
};

function generateId() {
  return 'day-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export default function JourneyDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const [journey, setJourney] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeProposalIndex, setActiveProposalIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState("");

  const [expandedDays, setExpandedDays] = useState(new Set());

  const [showRefineDayModal, setShowRefineDayModal] = useState(false);
  const [dayToRefine, setDayToRefine] = useState(null);
  const [isRefiningDay, setIsRefiningDay] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showConfirmedBanner, setShowConfirmedBanner] = useState(false);

  const [saveStatus, setSaveStatus] = useState('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dayToDeleteId, setDayToDeleteId] = useState(null);

  const [editingProposalTitleIndex, setEditingProposalTitleIndex] = useState(null);
  const [tempProposalTitle, setTempProposalTitle] = useState('');
  const [tempProposalSummary, setTempProposalSummary] = useState('');

  // Add new state for time slot refinement modal
  const [showTimeSlotRefinementModal, setShowTimeSlotRefinementModal] = useState(false);
  const [timeSlotToRefine, setTimeSlotToRefine] = useState(null);
  const [timeSlotData, setTimeSlotData] = useState(null);

  const isInitialLoadComplete = useRef(false);

  const [userContext, setUserContext] = useState(null);

  // Use useMemo to reliably extract journeyId and isNew from the URL
  const { journeyId, isNew } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      journeyId: params.get('id'),
      isNew: params.get('new') === 'true',
    };
  }, [location.search]);
  
  // Moved declarations up to fix initialization error and added safety check
  const proposals = useMemo(() => journey?.itinerary_proposals || [], [journey]);
  const isConfirmed = useMemo(() => journey?.status === 'confirmed', [journey]);
  const activeProposal = useMemo(() => {
    return !isConfirmed && proposals.length > activeProposalIndex ? proposals[activeProposalIndex] : null;
  }, [isConfirmed, proposals, activeProposalIndex]);
  const itineraryToDisplay = useMemo(() => {
    return isConfirmed ? journey?.confirmed_itinerary : activeProposal;
  }, [isConfirmed, journey, activeProposal]);


  const isCreator = userContext?.isOwner || false;
  const isSharedWithUser = userContext?.isSharedWithUser || false;

  const getJourneyTypeDisplayName = (journey) => {
    if (!journey) return 'N/A';
    const typeMap = {
      driving: 'Road Trip',
      motorcycle: 'Motorcycle Adventure',
      rv_trip: 'RV Trip',
      ski_trip: 'Ski Adventure',
      destination: 'Destination Travel'
    };
    return typeMap[journey.traveling_type] || 'Journey';
  };

  const getJourneySubtitle = (journey) => {
    if (!journey) return '';

    const getOriginName = (j) => {
      if (j.origin) return j.origin;
      if (j.flight_details?.origin) return `${j.flight_details.origin} Airport`;
      return null;
    };

    const origin = getOriginName(journey);

    // For road trips that have an origin, show "From [Origin] to [Destination]"
    if (['driving', 'motorcycle', 'rv_trip'].includes(journey.traveling_type)) {
      if (origin && journey.destination) {
        return `From ${origin} to ${journey.destination}`;
      } else if (journey.destination) {
        return `To ${journey.destination}`;
      }
    }

    // For destination trips, show destination, optionally with origin
    if (['destination', 'ski_trip'].includes(journey.traveling_type)) {
      if (origin && journey.destination) {
        return `${origin} to ${journey.destination}`;
      } else if (journey.destination) {
        return journey.destination;
      }
    }

    return journey.destination || '';
  };

  const debouncedSave = useCallback(_.debounce(async (updatedJourney) => {
    if (!updatedJourney || !updatedJourney.id) return;

    setSaveStatus('saving');
    try {
      const dataToSave = {
        itinerary_proposals: updatedJourney.itinerary_proposals,
        confirmed_itinerary: updatedJourney.confirmed_itinerary,
        status: updatedJourney.status,
      };
      // Only include preferred_duration if it exists on updatedJourney (the passed in object)
      // The comparison to `journey?.preferred_duration` from closure was removed as `updatedJourney`
      // already contains the latest state passed to the debounced function.
      if (updatedJourney.preferred_duration !== undefined) {
        dataToSave.preferred_duration = updatedJourney.preferred_duration;
      }

      await Journey.update(updatedJourney.id, dataToSave);
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Auto-save failed:", err);
      if (err.response?.status === 429) {
        console.warn("Rate limited, will retry auto-save later");
        setSaveStatus('idle');
        setTimeout(() => setHasUnsavedChanges(true), 5000);
      }
      else {
        setError("Failed to save changes. Please check your connection.");
        setSaveStatus('error');
      }
    }
  }, 2500), []);

  useEffect(() => {
    if (hasUnsavedChanges && journey) {
      debouncedSave(journey);
    }
    return () => {
      debouncedSave.cancel();
    };
  }, [journey, hasUnsavedChanges, debouncedSave]);

  const handleStateChange = useCallback((newJourneyState) => {
    if (isInitialLoadComplete.current) {
      setHasUnsavedChanges(true);
    }
    setJourney(_.cloneDeep(newJourneyState));
  }, [setJourney]);

  const handleJourneyUpdate = useCallback((updateData) => {
    if (!journey) return;
    const newJourneyState = { ...journey, ...updateData };
    handleStateChange(newJourneyState);
  }, [journey, handleStateChange]);

  const generateAndSetProposals = useCallback(async (currentJourney) => {
    if (!currentJourney) return [];

    const { destination, origin, traveling_type, preferred_duration, travelers, budget_range, preferences, type, start_date, ski_days } = currentJourney;
    const totalDays = preferred_duration + 1; // preferred_duration represents nights

    let concisenessInstruction = '';
    if (totalDays > 10) {
      concisenessInstruction = `
      **CRITICAL: BREVITY IS ESSENTIAL FOR THIS LONG ITINERARY.**
      - You are creating a long, **${totalDays}-day plan**. You MUST return a plan for ALL ${totalDays} days.
      - To ensure the full response fits, keep ALL descriptions extremely brief.
      - Use very short bullet points (1-2 per time slot is ideal).
      - Avoid long sentences and any extra conversational text.
      - Prioritize completing all days over providing excessive detail for any single day. This is the most important instruction.
      `;
    }

    let accommodationContext = '';
    if (preferences?.accommodation_booked && preferences?.accommodation_details) {
      accommodationContext = `\n**Accommodation:** User is staying at: ${preferences.accommodation_details}. Please provide recommendations for restaurants, activities, and attractions that are convenient to this location.`;
    } else if (preferences?.accommodation && preferences.accommodation.length > 0) {
      accommodationContext = `\n**Accommodation Preferences:** ${preferences.accommodation.join(', ')}`;
    }

    let stopsOfInterestContext = '';
    if (currentJourney.stops_of_interest && ['driving', 'motorcycle', 'rv_trip'].includes(currentJourney.traveling_type)) {
        stopsOfInterestContext = `
        **CRITICAL ROAD TRIP CONTEXT:** This is a continuous, point-to-point road trip. The plan for each day (Day 2 and onwards) **MUST** start in the location where the previous day concluded. For example, if Day 2 ends in "City A", Day 3's activities **MUST** begin in or around "City A" and progress towards the next destination. Do not backtrack. The journey must progress sequentially from origin to destination.

        **MANDATORY STOPS & SCENIC ROUTES:** The user has provided specific points of interest or scenic routes. You MUST integrate these into the daily plans where they logically fit along the travel route. Do not just list them; make them part of the activities for the relevant days.
        - User's Requested Stops/Routes: ${currentJourney.stops_of_interest}
        `;
    }

    let routePacingContext = '';
    if (['driving', 'motorcycle', 'rv_trip'].includes(traveling_type) && origin && destination) {
      try {
        const { data: routeData } = await getDrivingRoute({ origin, destination, traveling_type });
        const dailyLimits = { rv_trip: 12, driving: 14, motorcycle: 8 };
        const dailyLimit = dailyLimits[traveling_type];
        const totalDistanceMiles = Math.round(routeData.distance_km * 0.621371);

        routePacingContext = `
        **CRITICAL TRAVEL PACING CONTEXT:**
        - This is a **${traveling_type.replace('_', ' ')}**.
        - The total journey is approximately **${totalDistanceMiles} miles**.
        - The maximum daily travel time (driving + activities) is **${dailyLimit} hours**.
        - You MUST break down the total journey into logical daily segments that respect this daily travel limit.
        - The time for activities must be factored in; a day with 8 hours of driving has very little time for other things.
        - The overnight stops must be in logical locations along the calculated route to break up the journey appropriately.
        `;
      } catch (e) {
        console.error("Could not get route data for pacing:", e);
        routePacingContext = `**TRAVEL PACING CONTEXT:** This is a ${traveling_type.replace('_', ' ')}. The user needs a realistic itinerary. Please ensure the daily driving and activities are reasonably paced and achievable.`;
      }
    }

    let prompt = '';
    if (traveling_type === 'ski_trip') {
      const actualSkiDays = ski_days || Math.floor(totalDays * 0.6);
      const restDayPosition = Math.ceil(actualSkiDays / 2);

      let seasonContext = '';
      if (start_date) {
        const startMonth = new Date(start_date).getMonth() + 1;
        const monthName = new Date(start_date).toLocaleString('default', { month: 'long' });
        seasonContext = `The trip is planned for ${monthName}. Ensure all recommendations are appropriate for this specific month and current weather conditions in ${destination}.`;
      } else {
        seasonContext = `No specific date provided - assume this is a WINTER ski trip during peak ski season (December-March). ALL recommendations must be for winter conditions and winter activities only.`;
      }

      prompt = `
        Create a ${totalDays}-day ski adventure itinerary for ${destination}.

        ${concisenessInstruction}

        **CRITICAL SEASONAL CONTEXT:** ${seasonContext}

        **Details:**
        - Origin: ${origin || 'Not specified'}
        - Travelers: ${travelers}
        - Budget: ${budget_range}
        - Ski Days: ${actualSkiDays} (with 1 rest day around day ${restDayPosition} for non-skiing activities)${accommodationContext}

        **MANDATORY REQUIREMENTS:**
        - Include ${actualSkiDays} days of skiing with mountain activities, slope recommendations, and après-ski suggestions
        - Day ${restDayPosition} should be a rest day with WINTER non-skiing activities like spa visits, winter sightseeing, hot springs, winter shopping, or cozy indoor cultural experiences
        - ALL activities, restaurants, and recommendations must be appropriate for winter weather conditions
        - Do NOT recommend summer activities, outdoor hiking (unless winter hiking with proper gear), or activities that would be closed/inappropriate in winter
        - Focus on winter-specific experiences: hot cocoa, fireplaces, winter festivals, ice skating, snowshoeing, etc.
        - Provide real restaurant and activity suggestions with working URLs when possible

        Format each day as: **Day X: Title**, **Summary:**, **Morning:**, **Lunch:**, **Afternoon:**, **Dinner:**, **Additional:**
        **CRITICAL: All recommendations MUST include real, working URLs in markdown format: [Name](https://website.com). Do NOT use plain text URLs.**
      `;
    } else {
      let seasonContext = '';
      if (start_date) {
        const monthName = new Date(start_date).toLocaleString('default', { month: 'long' });
        seasonContext = `\n- **Seasonal Context:** The trip is planned for **${monthName}**. All recommendations MUST be seasonally appropriate for this month in the destination's hemisphere.`;
      } else {
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
        seasonContext = `\n- **Seasonal Context:** No specific travel date was provided. Assume the trip is for the current season (**${currentMonthName}**). All recommendations MUST be appropriate for this time of year.`;
      }

      const tripContext = `
        - Destination: ${destination}
        - Origin: ${origin || 'Not specified'}
        - Travel Style: ${traveling_type} - ${type || ''}
        - Duration: ${totalDays} days, starting around ${formatDate(start_date)}.
        - Travelers: ${travelers}
        - Budget: ${budget_range}
        - User Preferences: ${JSON.stringify(preferences)}
        ${accommodationContext}
        ${seasonContext}
      `;

      prompt = `
        You are an expert AI assistant tasked with creating a personalized, detailed, day-by-day itinerary.
        Your response must be ONLY the itinerary, with no intro or outro text.

        **TRIP DETAILS:**
        ${tripContext}
        ${stopsOfInterestContext}
        ${routePacingContext}

        **INSTRUCTIONS:**
        ${concisenessInstruction}
        1.  Create a **concise yet comprehensive**, day-by-day itinerary for ${totalDays} days.
        2.  **Be brief and use bullet points** for activities to keep the response fast and easy to read.
        3.  For each day, include a title, a one-sentence summary, and sections for Morning, Lunch, Afternoon, and Dinner, and Additional recommendations.
        4.  Format each day strictly like this, ensuring all sections are present and use bullet points for activities:
            **Day 1: Title of the Day**
            **Summary:**
            - A brief, one-sentence overview of the day's theme.
            **Morning:**
            - Bulleted list of activities.
            **Lunch:**
            - Bulleted list of lunch plans or recommendations.
            **Afternoon:**
            - Bulleted list of activities.
            **Dinner:**
            - Bulleted list of dinner plans or recommendations.
            **Additional:**
            - Bulleted list of extra tips.
        5.  Repeat this structure for all ${totalDays} days.
        6.  Include specific, real place names and their real, working URLs in markdown format: [Name](https://website.com). This is critical.
        **MANDATORY:** Your entire response MUST start with "Day 1:" and follow the sequence for all days.
      `;
    }

    const llmResponse = await InvokeLLM({ prompt, add_context_from_internet: true });
    const days = parseMultiDayItineraryResponse(llmResponse, totalDays);

    const proposal = {
      id: `prop-${Date.now()}`,
      daily_itinerary: days,
      proposal_name: `${currentJourney.destination} Adventure`,
      proposal_summary: `Your personalized ${totalDays}-day journey through ${currentJourney.destination}.`
    };
    return [proposal];
  }, []); // Removed `getDrivingRoute`, `InvokeLLM`, `setGenerationMessage`, `setGenerationProgress` as they are stable imports/setters

  useEffect(() => {
    const loadJourneyData = async (currentJourneyId, currentIsNew) => {
      // Guard clause: if no ID, do nothing. This is the primary fix.
      if (!currentJourneyId) {
        setLoading(false);
        setError('No journey ID found in URL.'); // More specific error
        return;
      }
      
      console.log(`Loading journey data for ID: ${currentJourneyId}`);
      isInitialLoadComplete.current = false;
      setLoading(true);
      setError('');

      try {
        const [userData, fetchedJourneyResponse] = await Promise.all([
          User.me(),
          fetchJourney({ journeyId: currentJourneyId })
        ]);

        if (!fetchedJourneyResponse.data.success) {
          throw new Error(fetchedJourneyResponse.data.error || 'Failed to load journey');
        }

        const journeyData = fetchedJourneyResponse.data.journey;
        const userContextData = fetchedJourneyResponse.data.userContext;

        setUser(userData);
        setJourney(journeyData);
        setUserContext(userContextData);

        if (currentIsNew && journeyData && userData && !journeyData.user_id) {
          console.log("Failsafe triggered: Assigning ownership on first load.");
          journeyData.user_id = userData.id;
          journeyData.created_by = userData.email;
          try {
            await Journey.update(journeyData.id, { user_id: userData.id, created_by: userData.email });
          } catch (assignError) {
            console.error("Failed to assign initial ownership:", assignError);
          }
        }

        if (journeyData && !journeyData.itinerary_proposals_generated) {
          setIsGenerating(true);
          setGenerationMessage("Warming up the travel engines...");
          setGenerationProgress(10);

          const generatedProposals = await generateAndSetProposals(journeyData);

          setGenerationMessage("Assembling your day-by-by plan...");
          setGenerationProgress(80);

          const dataToSave = {
            itinerary_proposals: generatedProposals,
            itinerary_proposals_generated: true,
            status: 'planning',
            user_id: userData.id,
            created_by: userData.email
          };

          await Journey.update(journeyData.id, dataToSave);

          const updatedJourney = { ...journeyData, ...dataToSave };
          setJourney(updatedJourney);

          const initialExpanded = new Set();
          updatedJourney?.itinerary_proposals?.[0]?.daily_itinerary?.forEach((day) => {
            initialExpanded.add(day.id);
          });
          setExpandedDays(initialExpanded);

          setGenerationMessage("Your adventure is ready!");
          setGenerationProgress(100);

          setTimeout(() => {
            setIsGenerating(false);
            setGenerationProgress(0);
            setGenerationMessage("");
          }, 1500);

        } else {
          if (journeyData?.itinerary_proposals?.[0]?.daily_itinerary && journeyData.preferred_duration !== (journeyData.itinerary_proposals[0].daily_itinerary.length - 1)) {
            journeyData.preferred_duration = journeyData.itinerary_proposals[0].daily_itinerary.length - 1;
            console.log("Adjusting preferred_duration for existing journey:", journeyData.id, "to", journeyData.preferred_duration);
          }
          setJourney(journeyData);
          const itineraryToExpand = journeyData?.confirmed_itinerary?.daily_itinerary || journeyData?.itinerary_proposals?.[0]?.daily_itinerary;
          const initialExpanded = new Set();
          itineraryToExpand?.forEach((day) => {
            initialExpanded.add(day.id);
          });
          setExpandedDays(initialExpanded);
        }
      } catch (e) {
        console.error("CRITICAL ERROR loading journey details:", e);
        console.error("Error Name:", e.name);
        console.error("Error Message:", e.message);
        if (e.response) {
            console.error("Error Response Data:", e.response.data);
            console.error("Error Response Status:", e.response.status);
        }

        // Check for permission/access errors
        if (e.message?.includes('Access denied') || e.message?.includes('not found') || e.message?.includes('permission')) {
          setError("You don't have permission to view this journey. It may not be shared with you, or it might not exist.");
        } else {
          setError("Could not load journey. Please try refreshing the page or try again later.");
        }
      } finally {
        setLoading(false);
        isInitialLoadComplete.current = true;
      }
    };

    if (!isGenerating) {
        loadJourneyData(journeyId, isNew);
    }
  }, [journeyId, isNew, isGenerating, generateAndSetProposals, setExpandedDays]);

  useEffect(() => {
    // This effect manages the visibility of the "confirmed" banner
    if (journey && journey.status === 'confirmed') {
      const isDismissed = sessionStorage.getItem(`confirmedBannerDismissed_${journey.id}`) === 'true';
      if (!isDismissed) {
        setShowConfirmedBanner(true);
      }
    } else {
      setShowConfirmedBanner(false);
    }
  }, [journey]);

  const reloadJourney = useCallback(async () => {
    const params = new URLSearchParams(location.search);
    const journeyId = params.get('id');

    if (!journeyId) return;
    try {
      const journeyResponse = await fetchJourney({ journeyId });
      if (!journeyResponse.data.success) {
        throw new Error(journeyResponse.data.error || "Failed to reload journey data.");
      }
      setJourney(journeyResponse.data.journey);
      setUserContext(journeyResponse.data.userContext);
    } catch (e) {
      console.error("Failed to reload journey:", e);
      setError("Could not refresh journey data.");
    }
  }, [location.search, setJourney, setUserContext, setError]);

  const toggleDayExpansion = useCallback((dayId) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
  }, [setExpandedDays]);

  const toggleExpandAll = useCallback(() => {
    const currentItinerary = journey?.confirmed_itinerary?.daily_itinerary || journey?.itinerary_proposals?.[activeProposalIndex]?.daily_itinerary;
    if (!currentItinerary) return;

    const allExpanded = expandedDays.size === currentItinerary.length;
    if (allExpanded) {
      setExpandedDays(new Set());
    } else {
      const newExpandedState = new Set(currentItinerary.map(day => day.id));
      setExpandedDays(newExpandedState);
    }
  }, [journey, activeProposalIndex, expandedDays, setExpandedDays]);

  const handleConfirmItinerary = useCallback(() => {
    if (!journey || !journey.itinerary_proposals[activeProposalIndex]) return;

    // When confirming, always reset the dismissal state so the banner shows up
    sessionStorage.removeItem(`confirmedBannerDismissed_${journey.id}`);

    const proposalToConfirm = journey.itinerary_proposals[activeProposalIndex];
    const newJourneyState = {
      ...journey,
      confirmed_itinerary: proposalToConfirm,
      status: 'confirmed'
    };
    handleStateChange(newJourneyState);
    setShowConfirmedBanner(true); // Explicitly show banner
  }, [journey, activeProposalIndex, handleStateChange, setShowConfirmedBanner]);

  const handleDismissConfirmedBanner = useCallback(() => {
    if (!journey) return;
    sessionStorage.setItem(`confirmedBannerDismissed_${journey.id}`, 'true');
    setShowConfirmedBanner(false);
  }, [journey, setShowConfirmedBanner]);

  const handleRefineDay = useCallback(async (dayObjectForRefinement, refinementPrompt) => {
    if (!journey || !refinementPrompt || !dayObjectForRefinement) {
      console.warn("Refinement failed: Missing journey, prompt, or day data.", { journey, refinementPrompt, dayObjectForRefinement });
      setError("Failed to refine day: Missing required information.");
      return;
    }

    setIsRefiningDay(true);
    setError('');
    try {
      const activeItinerary = journey.itinerary_proposals[activeProposalIndex];
      const dayIndex = activeItinerary.daily_itinerary.findIndex((d) => d.id === dayObjectForRefinement.id);

      const dayContext = {
        day: dayObjectForRefinement.day,
        id: dayObjectForRefinement.id, // Keep ID for potential use, even if not directly in prompt
        title: dayObjectForRefinement.title,
        description: dayObjectForRefinement.description,
        activities: dayObjectForRefinement.activities,
      };

      // Create a detailed seasonal context, similar to the generation prompt
      let seasonContext = '';
      if (journey.traveling_type === 'ski_trip') {
        if (journey.start_date) {
          const monthName = new Date(journey.start_date).toLocaleString('default', { month: 'long' });
          seasonContext = `The trip is planned for ${monthName}. ALL recommendations must be appropriate for this month's winter conditions.`;
        } else {
          seasonContext = `This is a WINTER ski trip. ALL recommendations must be for winter conditions ONLY (e.g., skiing, snowshoeing, indoor activities). Do NOT recommend summer activities like hiking.`;
        }
      } else {
        if (journey.start_date) {
          const monthName = new Date(journey.start_date).toLocaleString('default', { month: 'long' });
          seasonContext = `The trip is planned for ${monthName}. All recommendations must be seasonally appropriate.`;
        } else {
          const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
          seasonContext = `No specific date provided; assume the trip is for the current season (${currentMonthName}). All recommendations must be seasonally appropriate.`;
        }
      }

      // Simplified constraints
      const constraints = [];

      const isFirstDay = dayIndex === 0;
      const isLastDay = dayIndex === activeItinerary.daily_itinerary.length - 1;

      if (isFirstDay || isLastDay) {
        if (journey.add_flight) {
          constraints.push("Flight arrangements are fixed");
        } else if (journey.estimated_drive_time) {
          constraints.push("Drive time is fixed");
        }
      }

      if (['driving', 'motorcycle', 'rv_trip'].includes(journey.traveling_type)) {
        constraints.push("Road trip progression must be maintained");
      }

      if (journey.traveling_type === 'ski_trip') {
        constraints.push("Winter ski season only, existing ski arrangements are fixed");
      }

      // Much simpler text-based prompt that we'll parse
      const textPrompt = `
You are enhancing Day ${dayContext.day} of a ${journey.traveling_type} trip to ${journey.destination}.

**CRITICAL SEASONAL CONTEXT:** ${seasonContext}

**CURRENT DAY'S PLAN:**
- **Title:** ${dayContext.title}
- **Summary:** ${dayContext.description}
- **Morning:** ${dayContext.activities.find(a => a.time === 'Morning')?.description || 'No activities'}
- **Lunch:** ${dayContext.activities.find(a => a.time === 'Lunch')?.description || 'No activities'}
- **Afternoon:** ${dayContext.activities.find(a => a.time === 'Afternoon')?.description || 'No activities'}
- **Dinner:** ${dayContext.activities.find(a => a.time === 'Dinner')?.description || 'No activities'}
- **Additional:** ${dayContext.activities.find(a => a.time === 'Additional')?.description || 'No activities'}

**USER'S REFINEMENT REQUEST:** ${refinementPrompt}

**TRIP INFO:**
- **Travelers:** ${journey.travelers}
- **Budget:** ${journey.budget_range}

**INSTRUCTIONS:**
- You MUST adhere to the seasonal context provided above.
- You MUST incorporate the user's refinement request.
- Keep all 5 time slots: Morning, Lunch, Afternoon, Dinner, Additional.
- Include real venue names with URLs in markdown format: [Name](https://website.com).
- Be concise but engaging.

**FORMAT YOUR RESPONSE EXACTLY LIKE THIS (no extra text):**
**Day ${dayContext.day}: [Your Enhanced Title]**
**Summary:** [Your enhanced description]
**Morning:**
- [Activity 1](URL) - Brief, exciting description.
**Lunch:**
- [Restaurant/Activity](URL) - Description
**Afternoon:**
- [Activity 1](URL) - Description
**Dinner:**
- [Restaurant](URL) - Description
**Additional:**
- [Extra recommendation](URL) - Description
      `;

      let refinedDay;

      try {
        // Use text-based approach which is more reliable
        const textResponse = await InvokeLLM({
          prompt: textPrompt.trim(),
          add_context_from_internet: true
        });

        // Parse the text response into the expected format using the single day parser
        const parsedTextResponse = parseSingleDayResponse(textResponse, dayObjectForRefinement.day);
        if (parsedTextResponse) {
          // The parser might give a new ID, but we need to retain the original day ID for state updates
          parsedTextResponse.id = dayObjectForRefinement.id;
          refinedDay = parsedTextResponse;
        } else {
          throw new Error("Failed to parse AI response for refinement");
        }
      } catch (textError) {
        console.error("Text approach also failed:", textError);
        throw new Error("AI refinement failed. Please try a simpler request or try again later.");
      }

      if (!refinedDay || !refinedDay.activities) {
        throw new Error("AI failed to return a valid refined day plan. Please try a different request.");
      }

      // Preserve the ID and day number for data integrity
      refinedDay.day = dayObjectForRefinement.day;
      refinedDay.id = dayObjectForRefinement.id;

      // Validate and ensure all time slots are present
      const requiredTimeSlots = ['Morning', 'Lunch', 'Afternoon', 'Dinner', 'Additional'];
      const returnedTimeSlots = new Set(refinedDay.activities.map(a => a.time));

      // Fill in any missing time slots with original content
      requiredTimeSlots.forEach(slot => {
        if (!returnedTimeSlots.has(slot)) {
          const originalActivity = dayObjectForRefinement.activities.find(orig => orig.time === slot);
          if (originalActivity) {
            refinedDay.activities.push(originalActivity);
          } else {
            refinedDay.activities.push({
              time: slot,
              name: `${slot} Activities`,
              description: `Activities for ${slot.toLowerCase()}.`
            });
          }
        }
      });

      // Sort activities in the correct order
      const timeOrder = ['Morning', 'Lunch', 'Afternoon', 'Dinner', 'Additional'];
      refinedDay.activities.sort((a, b) => {
        const aIndex = timeOrder.indexOf(a.time);
        const bIndex = timeOrder.indexOf(b.time);
        return aIndex - bIndex;
      });

      // Validate each activity has proper data
      refinedDay.activities.forEach((newActivity, index) => {
        const originalActivity = dayObjectForRefinement.activities.find(orig => orig.time === newActivity.time);

        // Ensure description is a string and has meaningful content
        if (typeof newActivity.description !== 'string' || newActivity.description.trim().length < 5) {
          if (originalActivity) {
            newActivity.description = originalActivity.description;
            newActivity.name = originalActivity.name;
          } else {
            newActivity.description = `Enhanced ${newActivity.time.toLowerCase()} activities.`
          }
        }

        // Ensure name exists
        if (!newActivity.name) {
          newActivity.name = originalActivity?.name || `${newActivity.time} Activities`;
        }
      });

      // Update the journey state
      const newJourneyState = _.cloneDeep(journey);
      const currentProposal = newJourneyState.itinerary_proposals[activeProposalIndex];
      const dayIndexToUpdate = currentProposal.daily_itinerary.findIndex((d) => d.id === dayObjectForRefinement.id);

      if (dayIndexToUpdate !== -1) {
        currentProposal.daily_itinerary[dayIndexToUpdate] = refinedDay;
        handleStateChange(newJourneyState);
      }
    } catch (err) {
      console.error("Error refining day:", err);
      setError(err.message || "Failed to refine the day's plan. Please try again with a simpler request.");
    } finally {
      setIsRefiningDay(false);
      setShowRefineDayModal(false);
      setDayToRefine(null);
    }
  }, [
    journey,
    activeProposalIndex,
    handleStateChange,
    setError, // Added as it's a setter
    setIsRefiningDay, // Added as it's a setter
    setShowRefineDayModal, // Added as it's a setter
    setDayToRefine, // Added as it's a setter
  ]); // Removed InvokeLLM, parseSingleDayResponse

  const handleTimeSlotRefine = useCallback((dayData, timeSlot, activityName, activityDescription) => {
    setDayToRefine(dayData); // We need the day data for context
    setTimeSlotToRefine(timeSlot);
    setTimeSlotData({
      timeSlot,
      activityName,
      activityDescription
    });
    setShowTimeSlotRefinementModal(true);
  }, [setDayToRefine, setTimeSlotToRefine, setTimeSlotData, setShowTimeSlotRefinementModal]);

  const handleTimeSlotRefinementSubmit = useCallback(async (customPrompt) => {
    if (!dayToRefine || !timeSlotData || !customPrompt) {
      console.error("Missing data for time slot refinement:", { dayToRefine, timeSlotData, customPrompt });
      setError("Failed to refine time slot: Missing required information.");
      return;
    }

    setIsRefiningDay(true);
    setError('');

    try {
      const { timeSlot } = timeSlotData;

      // Find the specific activity to refine
      const activityToRefine = dayToRefine.activities.find(act => act.time === timeSlot);
      if (!activityToRefine) {
        throw new Error(`Could not find ${timeSlot} activity to refine.`);
      }

      // Enhanced prompt that includes daily theme and overall trip context
      let timeSlotPrompt;

      // Check if this is a "Feel Lucky" request and enhance accordingly
      if (customPrompt.toLowerCase().includes('feel lucky')) {
        timeSlotPrompt = `
          You are an expert travel assistant. Your ONLY task is to enhance the "${timeSlot}" portion of a single day's itinerary based on a "Feel Lucky" request.

          **CONTEXT (DO NOT REPEAT IN YOUR RESPONSE):**
          - Day: ${dayToRefine.day}
          - Daily Theme: "${dayToRefine.title}"
          - Trip Destination: ${journey.destination}
          - Budget: ${journey.budget_range}
          - Current ${timeSlot} Plan: ${activityToRefine.description || `No specific ${timeSlot.toLowerCase()} activities planned yet.`}

          **YOUR MISSION ("I FEEL LUCKY"):**
          1.  Enhance the **current ${timeSlot} plan** with 2-3 extraordinary, premium experiences that fit the budget.
          2.  The new experiences MUST perfectly align with the daily theme: "${dayToRefine.title}".
          3.  Suggestions must be real places in ${journey.destination} with working URLs in markdown format: [Name](https://website.com).

          **CRITICAL OUTPUT RULES (FAILURE TO FOLLOW WILL CAUSE AN ERROR):**
          - **YOU MUST ONLY output content for the "${timeSlot}" time slot.**
          - **DO NOT** include "Morning:", "Afternoon:", "Lunch:", "Dinner:", or any other time slot headers.
          - **DO NOT** output a full day's itinerary.
          - Your response must be a single block of text containing ONLY bullet points.

          **RESPONSE FORMAT (Strictly bullet points for the ${timeSlot} only):**
          - [Enhanced Activity 1](URL) - Brief, exciting description.
          - [Enhanced Activity 2](URL) - Brief, exciting description.
          - [Enhanced Activity 3](URL) - Brief, exciting description.
        `;
      } else {
        // Regular refinement request
        timeSlotPrompt = `
          You are refining ONLY the "${timeSlot}" portion of Day ${dayToRefine.day}: ${dayToRefine.title}.

          **DAILY THEME CONTEXT (MUST RESPECT):**
          - Day Theme: "${dayToRefine.title}"
          - All suggestions MUST complement this daily theme.

          **CURRENT ${timeSlot.toUpperCase()} PLAN:**
          ${activityToRefine.description || `No specific ${timeSlot.toLowerCase()} activities planned yet.`}

          **USER'S REQUEST FOR ${timeSlot.toUpperCase()}:** ${customPrompt}

          **CRITICAL INSTRUCTIONS:**
          1. Focus ONLY on the ${timeSlot.toLowerCase()} portion.
          2. Be extremely concise - use bullet points only.
          3. Each recommendation MUST include a working URL: [Name](https://website.com).
          4. Provide 3-5 specific recommendations.
          5. No lengthy explanations - just actionable recommendations.

          **RESPONSE FORMAT (Strictly bullet points for the ${timeSlot} only):**
          - [Place Name](URL) - Brief description.
        `;
      }

      const llmResponse = await InvokeLLM({
        prompt: timeSlotPrompt.trim(),
        add_context_from_internet: true
      });

      // Clean up the LLM response and format it properly
      // We don't use parseSingleDayResponse here because we only want the activity description, not the whole day structure
      const cleanedResponse = llmResponse.trim();

      // Update just this time slot in the journey
      const newJourneyState = _.cloneDeep(journey);
      const currentProposal = newJourneyState.itinerary_proposals[activeProposalIndex];
      const dayIndex = currentProposal.daily_itinerary.findIndex((d) => d.id === dayToRefine.id);

      if (dayIndex !== -1) {
        const dayToUpdate = currentProposal.daily_itinerary[dayIndex];
        const activityIndex = dayToUpdate.activities.findIndex(act => act.time === timeSlot);

        if (activityIndex !== -1) {
          // Update just this activity's description
          dayToUpdate.activities[activityIndex].description = cleanedResponse;
          handleStateChange(newJourneyState);
        } else {
          throw new Error(`Could not find ${timeSlot} activity to update.`);
        }
      } else {
        throw new Error("Could not find day to update.");
      }

    } catch (err) {
      console.error("Error refining time slot:", err);
      setError(err.message || "Failed to refine time slot. Please try again.");
    } finally {
      setIsRefiningDay(false);
      setShowTimeSlotRefinementModal(false);
      setTimeSlotToRefine(null);
      setTimeSlotData(null);
      setDayToRefine(null);
    }
  }, [
    dayToRefine,
    timeSlotData,
    journey,
    activeProposalIndex,
    handleStateChange,
    setError, // Added as it's a setter
    setIsRefiningDay, // Added as it's a setter
    setShowTimeSlotRefinementModal, // Added as it's a setter
    setTimeSlotToRefine, // Added as it's a setter
    setTimeSlotData, // Added as it's a setter
    setDayToRefine, // Added as it's a setter
  ]); // Removed InvokeLLM

  const handleTimeSlotModalClose = useCallback(() => {
    setShowTimeSlotRefinementModal(false);
    setTimeSlotToRefine(null);
    setTimeSlotData(null);
    setDayToRefine(null);
  }, [setShowTimeSlotRefinementModal, setTimeSlotToRefine, setTimeSlotData, setDayToRefine]);

  const handleDayDelete = useCallback((dayId) => {
    if (!journey) return;
    const newJourneyState = _.cloneDeep(journey);
    const currentProposal = newJourneyState.itinerary_proposals[activeProposalIndex];

    const filteredDays = currentProposal.daily_itinerary.filter(d => d.id === dayId);

    const finalDays = filteredDays.map((day, index) => ({
      ...day,
      day: index + 1
    }));

    currentProposal.daily_itinerary = finalDays;

    // Update duration to match actual itinerary length (days - 1 for nights) and update summary
    const newTotalDays = finalDays.length;
    const newNights = newTotalDays - 1;
    newJourneyState.preferred_duration = newNights > 0 ? newNights : 0;
    currentProposal.proposal_summary = `Your personalized ${newTotalDays}-day journey through ${journey.destination}.`;

    handleStateChange(newJourneyState);
    setDayToDeleteId(null);
  }, [journey, activeProposalIndex, handleStateChange, setDayToDeleteId]);

  const handleAddDay = useCallback(async () => {
    if (!journey) return;
    setIsAddingDay(true);
    setError('');

    try {
        const newJourneyState = _.cloneDeep(journey);
        const activeProposal = newJourneyState.itinerary_proposals[activeProposalIndex];
        const currentItinerary = activeProposal.daily_itinerary;

        if (currentItinerary.length < 2) {
            setError("Cannot add a day to an itinerary with fewer than two days.");
            setIsAddingDay(false);
            return;
        }

        const insertionIndex = Math.floor(currentItinerary.length / 2);
        const dayBefore = currentItinerary[insertionIndex - 1];
        const dayAfter = currentItinerary[insertionIndex];

        let promptContext = `
            - Destination: ${journey.destination}
            - Travelers: ${journey.travelers}
            - Budget: ${journey.budget_range}
            - Travel Style: ${journey.traveling_type}
            - User Preferences: ${JSON.stringify(journey.preferences)}
        `;

        if (['driving', 'motorcycle', 'rv_trip'].includes(journey.traveling_type)) {
            promptContext += `
            - This is a road trip. The day before is focused on "${dayBefore.title}". The day after is focused on "${dayAfter.title}". The new day should logically connect these two points, perhaps exploring an area between them.
            `;
        } else {
            promptContext += `
            - This is a trip centered around ${journey.destination}. The new day should offer activities that complement the days before and after it.
            `;
        }

        const llmResponse = await InvokeLLM({ prompt: `
            You are an expert travel concierge. Your task is to generate a plan for a SINGLE new day to be added into an existing travel itinerary.

            **TRIP CONTEXT:**
            ${promptContext}

            **INSTRUCTIONS:**
            1.  Generate a **concise but engaging** plan for ONE new day of travel.
            2.  This new day will be inserted into the middle of the trip. It must be a logical and enjoyable addition.
            3.  **Use bullet points for all activities** and recommendations.
            4.  Include specific, real place names with their URLs in markdown format: [Name](https://website.com).
            5.  **CRITICAL:** Format your entire response for this single day using this strict format, with bullet points for activities:
                **Day X: Title**, **Summary:**, **Morning:**, **Lunch:**, **Afternoon:**, and **Additional:**. The "Day X" part is just for formatting; the app will re-number it automatically.
        `, add_context_from_internet: true });
        
        // Pass a dummy dayNumber (e.g., 1) to parseSingleDayResponse as the LLM will provide "Day 1:" in its response
        const newDayData = parseSingleDayResponse(llmResponse, 1);

        if (!newDayData) {
            throw new Error("AI failed to generate a valid day plan.");
        }

        const newDay = {
            ...newDayData,
            id: generateId(),
            title: "[Added Day] - Edit Header or click Lucky",
            description: "This is a newly added day. Click 'Refine' or 'Lucky' to generate a full plan, or edit the details manually.",
            day: 0 // Will be re-indexed
        };

        currentItinerary.splice(insertionIndex, 0, newDay);

        const finalDays = currentItinerary.map((d, index) => ({
            ...d,
            day: index + 1
        }));

        activeProposal.daily_itinerary = finalDays;

        // Update duration to match actual itinerary length (days - 1 for nights) and update summary
        const newTotalDays = finalDays.length;
        const newNights = newTotalDays; // preferred_duration is nights, so it's total days - 1
        newJourneyState.preferred_duration = newNights > 0 ? newNights -1 : 0; // The prompt said totalDays = preferred_duration + 1, so nights = totalDays - 1.
        activeProposal.proposal_summary = `Your personalized ${newTotalDays}-day journey through ${journey.destination}.`;

        handleStateChange(newJourneyState);

    } catch (err) {
        console.error("Error adding day:", err);
        setError("Failed to add a new day. Please try again.");
    } finally {
        setIsAddingDay(false);
    }
  }, [journey, activeProposalIndex, handleStateChange, setError, setIsAddingDay]); // Removed InvokeLLM, parseSingleDayResponse, generateId

  const handleEditProposal = useCallback((proposalIndex) => {
    if (!journey) return;
    const proposal = journey.itinerary_proposals[proposalIndex];
    setTempProposalTitle(proposal.proposal_name || `Option ${proposalIndex + 1}`);
    setTempProposalSummary(proposal.proposal_summary || '');
    setEditingProposalTitleIndex(proposalIndex);
  }, [journey, setTempProposalTitle, setTempProposalSummary, setEditingProposalTitleIndex]);

  const handleSaveProposalEdit = useCallback(() => {
    if (editingProposalTitleIndex === null || !journey) return;

    const newTitle = tempProposalTitle.trim();
    const newSummary = tempProposalSummary.trim();

    const newJourneyState = _.cloneDeep(journey);
    newJourneyState.itinerary_proposals[editingProposalTitleIndex] = {
      ...newJourneyState.itinerary_proposals[editingProposalTitleIndex],
      proposal_name: newTitle || `Option ${editingProposalTitleIndex + 1}`,
      proposal_summary: newSummary
    };
    handleStateChange(newJourneyState);

    setEditingProposalTitleIndex(null);
    setTempProposalTitle('');
    setTempProposalSummary('');
  }, [editingProposalTitleIndex, journey, tempProposalTitle, tempProposalSummary, handleStateChange, setEditingProposalTitleIndex, setTempProposalTitle, setTempProposalSummary]);

  const handleCancelEditProposal = useCallback(() => {
    setEditingProposalTitleIndex(null);
    setTempProposalTitle('');
    setTempProposalSummary('');
  }, [setEditingProposalTitleIndex, setTempProposalTitle, setTempProposalSummary]);

  const downloadAsPdf = useCallback(async () => {
    if (!journey) return;

    const itineraryToExport = isConfirmed ? journey.confirmed_itinerary : activeProposal;
    if (!itineraryToExport) {
      setError("No itinerary selected to download.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await generatePdf({
        journey: journey,
        itinerary: itineraryToExport
      });

      if (response.status !== 200) {
        throw new Error("Failed to generate PDF from server.");
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(url), 1000);

    } catch (e) {
      console.error("Error downloading PDF:", e);
      setError("Could not generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [journey, isConfirmed, activeProposal, setLoading, setError]);

  const handleDayUpdate = useCallback((updatedDay) => {
    if (!journey) return;
    const newJourneyState = _.cloneDeep(journey);
    const currentProposal = newJourneyState.itinerary_proposals[activeProposalIndex];
    const dayIndexToUpdate = currentProposal.daily_itinerary.findIndex((d) => d.id === updatedDay.id);
    if (dayIndexToUpdate !== -1) {
      currentProposal.daily_itinerary[dayIndexToUpdate] = updatedDay;
      handleStateChange(newJourneyState);
    }
  }, [journey, activeProposalIndex, handleStateChange]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination || !journey) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    const newJourneyState = _.cloneDeep(journey);
    const currentProposal = newJourneyState.itinerary_proposals[activeProposalIndex];

    if (sourceIndex === 0 || sourceIndex === currentProposal.daily_itinerary.length - 1 ||
      destinationIndex === 0 || destinationIndex === currentProposal.daily_itinerary.length - 1) {
      return;
    }

    const reorderedDays = Array.from(currentProposal.daily_itinerary);
    const [movedItem] = reorderedDays.splice(sourceIndex, 1);
    reorderedDays.splice(destinationIndex, 0, movedItem);

    const finalDays = reorderedDays.map((day, index) => ({
      ...day,
      day: index + 1
    }));

    currentProposal.daily_itinerary = finalDays;
    handleStateChange(newJourneyState);
  }, [journey, activeProposalIndex, handleStateChange]);

  const SaveStatusIndicator = useCallback(() => {
    if (saveStatus === 'idle') return null;

    let content, colorClass;
    switch (saveStatus) {
      case 'saving':
        content = <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>;
        colorClass = "bg-slate-100 text-slate-700 border-slate-200";
        break;
      case 'saved':
        content = <><Check className="w-3 h-3" /> All changes saved</>;
        colorClass = "bg-green-100 text-green-800 border-green-200";
        break;
      case 'error':
        content = <><AlertTriangle className="w-3 h-3" /> Error saving</>;
        colorClass = "bg-red-100 text-red-800 border-red-200";
        break;
      default:
        return null;
    }

    return (
      <div className="fixed top-24 right-6 z-50">
        <Badge variant="outline" className={`transition-all duration-300 ${colorClass}`}>
          <div className="flex items-center gap-2 text-xs font-medium">
            {content}
          </div>
        </Badge>
      </div>
    );
  }, [saveStatus]);

  const dayToDeleteDetails = useMemo(() => {
    if (!dayToDeleteId || !journey?.itinerary_proposals?.[activeProposalIndex]) return null;
    return journey.itinerary_proposals[activeProposalIndex].daily_itinerary.find(d => d.id === dayToDeleteId);
  }, [dayToDeleteId, journey, activeProposalIndex]);

  if (loading && !isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    const isPermissionError = error.includes("permission") || error.includes("shared") || error.includes("exist");

    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-700">
          {isPermissionError ? "Access Denied" : "Error Loading Journey"}
        </h2>
        <p className="text-red-600 mb-4">{error}</p>
        {isPermissionError && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Need access to this journey?</strong><br/>
              Ask the journey owner to share it with you using the Share button on their journey page.
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Button onClick={() => navigate(createPageUrl("Journeys"))} className="mr-2">
            View My Journeys
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!journey && !isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No journey data available.</p>
        <Button onClick={() => navigate(createPageUrl("Journeys"))}>Back to My Journeys</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <SaveStatusIndicator />

      {/* MODALS */}
      <AIProgressModal
        open={isGenerating}
        progress={generationProgress}
        currentStep={generationMessage || "Our AI is curating the perfect travel proposals based on your preferences. This may take a moment."}
      />

      <AIProgressModal
        open={isAddingDay}
        title="Adding a New Day..."
        description="Our AI is creating a new day of adventure for your itinerary. Please wait."
        currentStep="Crafting the perfect day..."
      />

      <header className="p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-b sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <Button
              variant="ghost"
              className="text-sm text-slate-600 hover:bg-slate-200 px-2 py-1 mb-2"
              onClick={() => navigate(createPageUrl('Journeys'))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-6 bg-slate-200 rounded w-1/2 animate-pulse"></div>
              </div>
            ) : journey && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{getJourneyTypeDisplayName(journey)}</h1>
                <p className="text-lg text-slate-600 mt-1">{getJourneySubtitle(journey)}</p>

                {isSharedWithUser && (
                  <div className="mt-2 text-sm text-slate-500 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg w-fit">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Shared by {journey.created_by || userContext?.creatorEmail || 'Unknown'}
                  </div>
                )}
              </div>
            )}
          </div>

          <TooltipProvider>
            <div className="flex-shrink-0 mt-4 sm:mt-0 self-end sm:self-center">
              <div className="flex flex-wrap items-center gap-2">
                {!isConfirmed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleAddDay}
                        disabled={isAddingDay}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 h-9 w-9"
                      >
                        {isAddingDay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add a Day</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {isConfirmed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStateChange({ ...journey, status: 'planning' })}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 h-9 w-9"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Itinerary</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <PremiumFeatureWrapper user={user} featureName="share your journey" onUpgradeClick={() => setShowUpgradeDialog(true)}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 h-9 px-4"
                        onClick={() => setShowShareModal(true)}
                      >
                        <Share2 className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Share</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share Journey</p>
                    </TooltipContent>
                  </Tooltip>
                </PremiumFeatureWrapper>

                <PremiumFeatureWrapper user={user} featureName="download a PDF" onUpgradeClick={() => setShowUpgradeDialog(true)}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={downloadAsPdf}
                        disabled={loading}
                        className="h-9 px-4"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 md:mr-2" />
                        )}
                        <span className="hidden md:inline">Download PDF</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download PDF</p>
                    </TooltipContent>
                  </Tooltip>
                </PremiumFeatureWrapper>

                {isConfirmed ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Confirmed
                  </Badge>
                ) : (
                  <PremiumFeatureWrapper user={user} featureName="confirm your itinerary" onUpgradeClick={() => setShowUpgradeDialog(true)}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleConfirmItinerary}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Confirm
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Confirm Itinerary</p>
                      </TooltipContent>
                    </Tooltip>
                  </PremiumFeatureWrapper>
                )}
              </div>
            </div>
          </TooltipProvider>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {isConfirmed && journey && showConfirmedBanner && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                This itinerary is confirmed! Get ready for your amazing trip.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissConfirmedBanner}
              className="text-green-600 hover:bg-green-200 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!isConfirmed && journey && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">
                Enhance Your Itinerary with AI
              </p>
              <p className="text-sm text-blue-700">
                Get much more detailed daily itineraries by using the <strong>"Refine with AI"</strong> button on each day card.
                This will provide personalized recommendations, restaurant suggestions, and activity details tailored to your preferences.
              </p>
            </div>
          </div>
        )}

        {journey && <JourneyStats journey={journey} proposal={itineraryToDisplay} onUpdate={handleJourneyUpdate} />}

        {isConfirmed && journey?.confirmed_itinerary ? (
          <div className="mt-8">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="flex flex-col space-y-1.5 p-6">
                <div className="flex-1">
                  <CardTitle className="text-xl">{journey.confirmed_itinerary.proposal_name || 'Confirmed Itinerary'}</CardTitle>
                  <CardDescription className="text-slate-600 text-sm">{cleanText(journey.confirmed_itinerary.proposal_summary) || 'Your confirmed travel plan'}</CardDescription>
                </div>
                <div className="flex justify-end pt-4">
                  <Button variant="outline" size="sm" onClick={toggleExpandAll} className="flex-shrink-0">
                    <ChevronsUpDown className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Expand/Collapse All</span>
                    <span className="sm:hidden">Toggle All</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(journey.confirmed_itinerary.daily_itinerary || []).map((day, dayIndex) =>
                    <DailyItinerary
                      key={day.id}
                      day={day}
                      index={dayIndex}
                      isExpanded={expandedDays.has(day.id)}
                      onToggleExpand={() => toggleDayExpansion(day.id)}
                      onEdit={() => { }}
                      onRefine={() => { }}
                      onDelete={() => { }}
                      isFixedDay={true}
                      isConfirmed={isConfirmed}
                      allowRefinement={false}
                      dragHandleProps={{}}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-8">
            <Tabs value={String(activeProposalIndex)} onValueChange={(val) => setActiveProposalIndex(Number(val))} className="w-full">
              {!isConfirmed && proposals.length > 1 &&
                <TabsList className="bg-slate-700 text-muted-foreground mb-4 p-1 h-auto min-h-[2.5rem] items-start justify-center rounded-md grid w-full gap-1" style={{ gridTemplateColumns: `repeat(${proposals.length}, minmax(0, 1fr))` }}>
                  {proposals.map((p, index) =>
                    <TabsTrigger
                      key={index}
                      value={String(index)}
                      className="whitespace-normal text-center py-2 px-3 text-sm leading-tight min-h-[2rem] h-auto"
                    >
                      {p.proposal_name || `Option ${index + 1}`}
                    </TabsTrigger>
                  )}
                </TabsList>
              }

              {proposals.map((proposal, index) =>
                <div key={index}>
                  {activeProposalIndex === index && (
                    <TabsContent value={String(index)} forceMount>
                      <div>
                        <Card className="border-0 shadow-xl bg-white">
                          <CardHeader>
                            <div className="flex-1">
                              {editingProposalTitleIndex === index ? (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="proposal-title" className="text-sm font-medium text-slate-700">Proposal Title</Label>
                                    <Input
                                      id="proposal-title"
                                      value={tempProposalTitle}
                                      onChange={(e) => setTempProposalTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSaveProposalEdit();
                                        }
                                        if (e.key === 'Escape') handleCancelEditProposal();
                                      }}
                                      className="text-lg font-semibold"
                                      placeholder="Enter proposal title..."
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="proposal-summary" className="text-sm font-medium text-slate-700">Proposal Summary</Label>
                                    <Textarea
                                      id="proposal-summary"
                                      value={tempProposalSummary}
                                      onChange={(e) => setTempProposalSummary(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') handleCancelEditProposal();
                                      }}
                                      className="text-sm resize-none"
                                      placeholder="Enter a brief description of this proposal..."
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={handleSaveProposalEdit}
                                      className="bg-green-600 hover:bg-green-700">
                                      <Check className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEditProposal}>
                                      <X className="w-4 h-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1">
                                  <CardTitle className="text-xl text-slate-900">{proposal.proposal_name || `Option ${index + 1}`}</CardTitle>
                                  <CardDescription className="text-slate-600 text-sm mt-1">{cleanText(proposal.proposal_summary) || 'No description provided'}</CardDescription>
                                </div>
                              )}
                            </div>
                            {editingProposalTitleIndex !== index && (
                              <div className="flex gap-2 justify-end pt-4">
                                {!isConfirmed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditProposal(index)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit Details
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={toggleExpandAll} className="flex-shrink-0">
                                  <ChevronsUpDown className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Expand/Collapse All</span>
                                  <span className="sm:hidden">Toggle All</span>
                                </Button>
                              </div>
                            )}
                          </CardHeader>

                          <CardContent>
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId={`proposal-${index}`}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.droppableProps}
                                      className="space-y-4"
                                    >
                                      {(proposal.daily_itinerary || []).map((day, dayIndex) => {
                                        const isFirstDay = dayIndex === 0;
                                        const isLastDay = dayIndex === (proposal.daily_itinerary.length - 1);
                                        const isDraggable = !isFirstDay && !isLastDay;

                                        return (
                                          <Draggable
                                            key={day.id}
                                            draggableId={day.id}
                                            index={dayIndex}
                                            isDragDisabled={!isDraggable || isConfirmed}
                                          >
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                style={{
                                                  ...provided.draggableProps.style
                                                }}
                                              >
                                                <DailyItinerary
                                                  day={day}
                                                  index={dayIndex}
                                                  onEdit={handleDayUpdate}
                                                  onRefine={(dayToRefineArg, customPrompt) => {
                                                    setDayToRefine(dayToRefineArg);
                                                    if (customPrompt) {
                                                      handleRefineDay(dayToRefineArg, customPrompt);
                                                    } else {
                                                      setShowRefineDayModal(true);
                                                    }
                                                  }}
                                                  onRefineTimeSlot={handleTimeSlotRefine}
                                                  onDelete={(day) => setDayToDeleteId(day.id)}
                                                  dragHandleProps={provided.dragHandleProps}
                                                  isFixedDay={!isDraggable}
                                                  isExpanded={expandedDays.has(day.id)}
                                                  onToggleExpand={toggleDayExpansion}
                                                  isConfirmed={isConfirmed}
                                                  isDragging={snapshot.isDragging}
                                                  isRefining={isRefiningDay && dayToRefine?.id === day.id}
                                                  allowRefinement={true}
                                                />
                                              </div>
                                            )}
                                          </Draggable>
                                        );
                                      })}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>
                          </CardContent>

                          {proposal.budget_breakdown && (
                            <CardContent className="pt-0">
                              <div className="border-t border-slate-200 pt-6">
                                <h4 className="text-lg font-semibold text-slate-900 mb-4">Budget Overview</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  {Object.entries(proposal.budget_breakdown).map(([key, value]) => (
                                    <div key={key}>
                                      <div className="text-2xl font-bold text-blue-600">{value}</div>
                                      <div className="text-xs text-slate-500 mt-1">{key}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      </div>
                    </TabsContent>
                  )}
                </div>
              )}
            </Tabs>
          </div>
        )}

        <Dialog open={!!dayToDeleteId} onOpenChange={() => setDayToDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Delete Day {dayToDeleteDetails?.day}?
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently remove <strong>Day {dayToDeleteDetails?.day}: {dayToDeleteDetails?.title}</strong> from this itinerary proposal? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDayToDeleteId(null)}>Cancel</Button>
              <Button onClick={() => handleDayDelete(dayToDeleteId)} className="bg-red-600 hover:bg-red-700">
                Yes, Delete Day
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {dayToRefine &&
          <DayRefinementModal
            isOpen={showRefineDayModal}
            dayData={dayToRefine}
            journeyContext={journey}
            onRefinementSubmit={(prompt) => handleRefineDay(dayToRefine, prompt)}
            isRefining={isRefiningDay}
            onClose={() => { setDayToRefine(null); setShowRefineDayModal(false); }} />
        }

        {showShareModal &&
          <ShareItineraryModal
            open={showShareModal}
            journey={journey}
            onClose={() => setShowShareModal(false)}
            onShareSuccess={reloadJourney}
          />
        }

        {/* Time Slot Refinement Modal */}
        {dayToRefine && timeSlotData && (
          <TimeSlotRefinementModal
            isOpen={showTimeSlotRefinementModal}
            dayData={dayToRefine}
            timeSlot={timeSlotData.timeSlot}
            activityName={timeSlotData.activityName}
            currentDescription={timeSlotData.activityDescription}
            onRefinementSubmit={handleTimeSlotRefinementSubmit}
            isRefining={isRefiningDay}
            onClose={handleTimeSlotModalClose}
          />
        )}
      </div>

      <PremiumGate
        showUpgradeDialog={showUpgradeDialog}
        onUpgradeComplete={() => {
          setShowUpgradeDialog(false);
          User.me().then(setUser).catch(err => console.error("Failed to reload user after upgrade:", err));
        }}
        onClose={() => setShowUpgradeDialog(false)}
      />
    </div>
  );
}
