import apiClient from './apiClient';
import { supabase } from '@/lib/supabase';

const callFunction = async (functionName, params = {}) => {
  try {
    const response = await apiClient.post(`/functions/${functionName}`, params);
    return response.data;
  } catch (error) {
    console.error(`Error calling function ${functionName}:`, error);
    throw error;
  }
};

export const validateJourneyData = (data) => callFunction('validateJourneyData', data);
// Use Supabase directly for user usage stats
export const getUserUsageStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // If no stats exist, return default stats
      if (error.code === 'PGRST116') {
        return {
          journeys_created: 0,
          journeys_limit: 5,
          user_id: userId
        };
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user usage stats:', error);
    throw error;
  }
};
export const sendEmail = (emailData) => callFunction('sendEmail', emailData);
export const getAirports = (searchTerm) => callFunction('getAirports', { searchTerm });
export const getRouteInfo = (origin, destination) => callFunction('getRouteInfo', { origin, destination });
export const populateAirlines = () => callFunction('populateAirlines');
export const refineDay = (dayData) => callFunction('refineDay', dayData);
// Use Supabase directly for login tracking
export const trackLogin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if user_usage_stats record exists, create if not
    const { data: existingStats, error: fetchError } = await supabase
      .from('user_usage_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (fetchError && fetchError.code === 'PGRST116') {
      // Create new usage stats record
      const { data, error } = await supabase
        .from('user_usage_stats')
        .insert({
          user_id: user.id,
          journeys_created: 0,
          journeys_limit: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data: { success: true, stats: data } };
    } else if (fetchError) {
      throw fetchError;
    }
    
    // Update last login time
    const { data, error } = await supabase
      .from('user_usage_stats')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data: { success: true, stats: data } };
  } catch (error) {
    console.error('Error tracking login:', error);
    return { data: { success: false, error: error.message } };
  }
};
export const sendUserNotificationEmail = (emailData) => callFunction('sendUserNotificationEmail', emailData);
export const generatePdf = (data) => callFunction('generatePdf', data);
export const bulkEmailSender = (emailList) => callFunction('bulkEmailSender', { emailList });
export const updateJourneyCreators = () => callFunction('updateJourneyCreators');
export const manageJourneyShare = (journeyId, shareData) => callFunction('manageJourneyShare', { journeyId, ...shareData });
export const testAI = (prompt) => callFunction('testAI', { prompt });
export const fixJourneyDurations = () => callFunction('fixJourneyDurations');
export const getDrivingRoute = (origin, destination) => callFunction('getDrivingRoute', { origin, destination });
export const getJourneysForUser = (userId) => callFunction('getJourneysForUser', { userId });
export const fixMissingCreatedBy = () => callFunction('fixMissingCreatedBy');
export const checkJourneyData = (journeyId) => callFunction('checkJourneyData', { journeyId });
export const auditAndFixJourneys = () => callFunction('auditAndFixJourneys');
export const debugJourney = (journeyId) => callFunction('debugJourney', { journeyId });
// Use Supabase directly for journey creation
export const createJourney = async (journeyData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Prepare journey data for Supabase
    const cleanData = {
      ...journeyData.journeyData,
      user_id: user.id,
      created_by: user.email,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('journeys')
      .insert(cleanData)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating journey:', error);
      return { 
        data: { 
          success: false, 
          error: error.message 
        } 
      };
    }
    
    return {
      data: {
        success: true,
        journeyId: data.id,
        journey: data
      }
    };
  } catch (error) {
    console.error('Error creating journey:', error);
    return {
      data: {
        success: false,
        error: error.message
      }
    };
  }
};
export const fetchJourney = (journeyId) => callFunction('fetchJourney', { journeyId });