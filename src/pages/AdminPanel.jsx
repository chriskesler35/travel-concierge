
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Journey } from "@/api/entities";
import { Feedback } from "@/api/entities";
import { DiscountCode } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  Users,
  MapPin,
  MessageSquare,
  Ticket,
  Shield,
  AlertCircle,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Loader2,
  Crown,
  Mail,
  Phone,
  Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendUserNotificationEmail } from '@/api/functions';
import { bulkEmailSender } from '@/api/functions';
import { auditAndFixJourneys } from '@/api/functions';
import { debugJourney } from '@/api/functions'; // New import
// The outline mentioned fixMissingCreatedBy but it's not used in the provided handler or UI outline.
// import { fixMissingCreatedBy } from '@/api/functions'; 
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const formatDateSafely = (dateInput, options = {}) => {
  try {
    if (!dateInput) return options.placeholder || 'N/A';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const defaultDateOptions = {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    const defaultDateTimeOptions = {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    if (options.type === 'datetime') {
      return date.toLocaleString('en-US', defaultDateTimeOptions);
    } else {
      return date.toLocaleDateString('en-US', defaultDateOptions);
    }
  } catch {
    return 'Invalid Date';
  }
};

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [users, setUsers] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [discountCodes, setDiscountCodes] = useState([]);

  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateDiscountModal, setShowCreateDiscountModal] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [updatedExpiresAt, setUpdatedExpiresAt] = useState("");
  
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    subscription_tier: "free",
    subscription_status: "inactive",
    subscription_expires: ""
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // New Audit/Fix Tool states
  const [auditResults, setAuditResults] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isFixingAll, setIsFixingAll] = useState(false); // Re-using isFixingAll for any data modification operation after audit

  // New states for Journey Debug Tool
  const [debugJourneyId, setDebugJourneyId] = useState('');
  const [debugResult, setDebugResult] = useState(null);
  const [isDebuggingJourney, setIsDebuggingJourney] = useState(false);

  // New discount code form
  const [newDiscountCode, setNewDiscountCode] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    usage_limit: null,
    expires_at: "",
    is_active: true,
    applicable_tiers: ["premium"]
  });

  const navigate = useNavigate();

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.role !== 'admin') {
        navigate(createPageUrl("Home"));
        return;
      }

      // Load all data for admin view with error handling
      // Use direct Supabase queries for admin access
      const loadPromises = [
        // Fetch users from users table
        supabase.from('users').select('*').order('created_at', { ascending: false })
          .then(response => {
            if (response.error) throw response.error;
            return response.data;
          })
          .catch((err) => {console.error('Error loading users:', err);return [];}),
        
        // Fetch journeys
        Journey.list("-created_at").catch((err) => {console.error('Error loading journeys:', err);return [];}),
        
        // Fetch feedback  
        Feedback.list("-created_at").catch((err) => {console.error('Error loading feedback:', err);return [];}),
        
        // Fetch discount codes
        DiscountCode.list("-created_at").catch((err) => {console.error('Error loading discount codes:', err);return [];})
      ];

      const [usersData, journeysData, feedbackData, discountCodesData] = await Promise.all(loadPromises);

      // Calculate accurate journey counts for each user
      const usersWithAccurateStats = usersData.map(user => {
        const userJourneyCount = journeysData.filter(journey => 
          journey.created_by === user.email || journey.user_id === user.id
        ).length;
        
        return {
          ...user,
          // Use calculated count if it's different from stored count
          journeys_created: userJourneyCount,
          // Keep existing login tracking data
          login_count: user.login_count || 0,
          last_login: user.last_login
        };
      });

      setUsers(usersWithAccurateStats);
      setJourneys(journeysData);
      setFeedback(feedbackData);
      setDiscountCodes(discountCodesData);
    } catch (e) {
      console.error("Error loading admin data:", e);
      setError("Failed to load admin data. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleCreateDiscountCode = async () => {
    try {
      // Ensure expires_at is sent as an ISO string for UTC start of day
      const discountData = {
        ...newDiscountCode,
        expires_at: newDiscountCode.expires_at ? new Date(`${newDiscountCode.expires_at}T00:00:00.000Z`).toISOString() : null
      };
      await DiscountCode.create(discountData);
      setShowCreateDiscountModal(false);
      setNewDiscountCode({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        usage_limit: null,
        expires_at: "",
        is_active: true,
        applicable_tiers: ["premium"]
      });
      await loadAdminData();
    } catch (error) {
      console.error("Error creating discount code:", error);
      setError("Failed to create discount code. Please try again.");
    }
  };

  const handleViewJourney = (journey) => {
    setSelectedJourney(journey);
    setShowJourneyModal(true);
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    // Ensure the date input displays YYYY-MM-DD from an ISO string
    setUpdatedExpiresAt(userToEdit.subscription_expires ? userToEdit.subscription_expires.split('T')[0] : "");
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    // Find the original user data from the state before potential modifications in the modal
    const originalUser = users.find((u) => u.id === editingUser.id);
    const wasFreeTier = originalUser?.subscription_tier === 'free';
    const isNowPremium = editingUser.subscription_tier === 'premium'; // This reflects the selected tier in the modal

    try {
      const updatedData = {
        subscription_expires: updatedExpiresAt ? new Date(`${updatedExpiresAt}T00:00:00.000Z`).toISOString() : null,
        subscription_tier: editingUser.subscription_tier,
        subscription_status: editingUser.subscription_status
      };

      await User.update(editingUser.id, updatedData);

      // Send premium upgrade notification if user was upgraded from free to premium
      // and their tier actually changed (not just updating other fields for a premium user)
      if (wasFreeTier && isNowPremium && originalUser?.subscription_tier !== editingUser.subscription_tier) {
        try {
          await sendUserNotificationEmail({
            type: 'premium_upgrade',
            userEmail: editingUser.email,
            userName: editingUser.full_name,
            adminName: user?.full_name
          });
        } catch (emailError) {
          console.warn('Failed to send premium upgrade email:', emailError);
        }
      }

      setShowEditUserModal(false);
      setEditingUser(null);
      await loadAdminData(); // Reload data to reflect all changes, including tier and status
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user. Please try again.");
    }
  };

  const handleCreateUser = async () => {
    setIsCreatingUser(true);
    setError(null);
    try {
      // Use the user invitation system instead of direct user creation
      // This will send an invitation to the user's email and they can accept it

      // For now, we'll show a message explaining the limitation
      // In a future update, we could implement the invitation API if available

      alert(`User invitation feature is not yet implemented. 
      
To add users manually:
1. Have the user sign up normally at the app
2. Then update their subscription tier using the "Edit" button
3. Or use the platform's user management features in the dashboard

Email: ${newUser.email} was not added automatically.`);

      setShowCreateUserModal(false);
      setNewUser({
        full_name: "",
        email: "",
        subscription_tier: "free",
        subscription_status: "inactive",
        subscription_expires: ""
      });

    } catch (error) {
      console.error("Error with user invitation:", error);
      setError("User creation failed. Users must sign up normally, then admins can modify their subscription tier.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert("Please provide a subject and a message body.");
      return;
    }
    
    setIsSending(true);
    setError(null);
    try {
      const result = await bulkEmailSender({ subject: emailSubject, body: emailBody });
      if (result.data.success) {
        alert(result.data.message);
        setShowBulkEmailModal(false);
        setEmailSubject("");
        setEmailBody("");
      } else {
        throw new Error(result.data.error || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Error sending bulk email:", error);
      setError(`Failed to send email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleAuditJourneys = async () => {
    setIsAuditing(true);
    setError(null);
    
    try {
      const result = await auditAndFixJourneys({ action: 'audit' });
      if (result.data.success) {
        setAuditResults(result.data);
      } else {
        throw new Error(result.data.error || "Audit failed");
      }
    } catch (err) {
      console.error('Failed to audit journeys:', err);
      setError(err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleFixAllJourneys = async () => {
    if (!confirm('This will fix ALL broken journey records by populating missing user_id and created_by fields. Continue?')) {
      return;
    }
    
    setIsFixingAll(true);
    setError(null);
    
    try {
      console.log('Starting fix operation...');
      const result = await auditAndFixJourneys({ action: 'fix' });
      console.log('Fix operation result:', result.data);
      
      if (result.data.success) {
        alert(`Success! ${result.data.message}\n\nFinalizing changes and refreshing data. This may take a moment.`);
        setAuditResults(null); // Clear audit results
        
        // Wait for 2 seconds to allow for data propagation/cache invalidation
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadAdminData();

      } else {
        throw new Error(result.data.error || "Fix failed");
      }
    } catch (err) {
      console.error('Failed to fix journeys:', err);
      setError(`Failed to fix journeys: ${err.message}`);
    } finally {
      setIsFixingAll(false);
    }
  };

  const handleDeleteUnfixable = async () => {
    if (!auditResults) return; // Should not happen if button is displayed correctly
    const unfixableCount = auditResults.summary.brokenJourneys - auditResults.summary.fixableJourneys;
    if (!confirm(`This will permanently delete ${unfixableCount} unfixable journeys that have no identifiable owner. This action cannot be undone. Continue?`)) {
      return;
    }
    
    setIsFixingAll(true); // Re-using isFixingAll for any operation that modifies data after audit
    setError(null);
    
    try {
      const result = await auditAndFixJourneys({ action: 'delete_unfixable' });
      if (result.data.success) {
        alert(`Success! ${result.data.message}`);
        setAuditResults(null); // Clear audit results
        await loadAdminData(); // Reload data
      } else {
        throw new Error(result.data.error || "Delete failed");
      }
    } catch (err) {
      console.error('Failed to delete unfixable journeys:', err);
      setError(`Failed to delete unfixable journeys: ${err.message}`);
    } finally {
      setIsFixingAll(false);
    }
  };

  const handleDebugJourney = async (action) => {
    if (!debugJourneyId.trim()) {
      alert('Please enter a Journey ID');
      return;
    }
    
    setIsDebuggingJourney(true);
    setError(null);
    setDebugResult(null); // Clear previous results
    
    try {
      const result = await debugJourney({ 
        journeyId: debugJourneyId.trim(),
        action: action,
        ...(action === 'fix' && { fixType: 'assignOwner' })
      });
      
      setDebugResult(result.data);
      if (action === 'forceDelete' && result.data.success) {
        alert('Journey force deleted successfully');
        setDebugJourneyId('');
        // setDebugResult(null); // Keep result for a moment to show success message
        await loadAdminData(); // Reload all data to reflect deletion
      }
    } catch (err) {
      console.error('Debug journey error:', err);
      // More user-friendly error handling
      const errorMessage = err.response?.data?.error || err.message || 'An unknown error occurred.';
      setError(`Debug operation failed: ${errorMessage}`);
      setDebugResult({ success: false, error: errorMessage, details: err.response?.data?.details });
    } finally {
      setIsDebuggingJourney(false);
    }
  };

  // Filter functions
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || user.subscription_tier === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredJourneys = journeys.filter((journey) => {
    const matchesSearch = journey.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journey.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journey.created_by?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || journey.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredFeedback = feedback.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.additional_comments?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>);

  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-800">Admin Panel Error</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadAdminData}>Retry</Button>
      </div>);

  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50 p-6">
        <Shield className="w-12 h-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Denied</h2>
        <p className="text-slate-600 mb-4">You don't have permission to access the admin panel.</p>
        <Button onClick={() => navigate(createPageUrl("Home"))}>Go Home</Button>
      </div>);

  }

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter((u) => u.subscription_tier === 'premium').length,
    totalJourneys: journeys.length,
    activeJourneys: journeys.filter((j) => j.status === 'in_progress').length,
    totalFeedback: feedback.length,
    avgRating: feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">

          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          </div>
          <p className="text-slate-600">Manage users, journeys, feedback, and system settings</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Premium Users</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.premiumUsers}</p>
                </div>
                <Crown className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Journeys</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalJourneys}</p>
                </div>
                <MapPin className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Avg Rating</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.avgRating}</p>
                </div>
                <Star className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Admin Tabs */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <Tabs defaultValue="users" className="p-2 sm:p-6">
            <TabsList className="bg-slate-500 text-muted-foreground p-1 items-center justify-center rounded-md grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
              <TabsTrigger value="users" className="py-2">Users</TabsTrigger>
              <TabsTrigger value="journeys" className="py-2">Journeys</TabsTrigger>
              <TabsTrigger value="feedback" className="py-2">Feedback</TabsTrigger>
              <TabsTrigger value="discounts" className="py-2">Discounts</TabsTrigger>
              <TabsTrigger value="communications" className="py-2">Communications</TabsTrigger>
            </TabsList>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 my-6">
              <div className="flex-1">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full" />

              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="free">Free Users</SelectItem>
                  <SelectItem value="premium">Premium Users</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="users" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center mb-4 gap-4">
                <div className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-full sm:max-w-md">
                  <p className="font-medium text-amber-800 mb-1">Note:</p>
                  <p className="text-amber-700">Users must sign up normally. Admins can then edit their subscription tier and status using the "Edit" button.</p>
                </div>
                <Button onClick={() => setShowCreateUserModal(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Manual User Creation (Disabled)
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 font-semibold text-slate-700">User</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Subscription</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Sub. Expires</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Journeys</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Login Count</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Last Login</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Joined</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userData) =>
                    <tr key={userData.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-slate-900">{userData.full_name}</p>
                            <p className="text-sm text-slate-500">{userData.email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={userData.subscription_tier === 'premium' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                            {userData.subscription_tier || 'free'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-500">{formatDateSafely(userData.subscription_expires)}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 font-medium">{userData.journeys_created || 0}</span>
                            {(userData.journeys_created || 0) > 0 && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {(userData.journeys_created || 0) === 1 ? '1 Trip' : `${userData.journeys_created} Trips`}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 font-medium">{userData.login_count || 0}</span>
                            {(userData.login_count || 0) > 5 &&
                          <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                          }
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-500 text-sm">
                            {formatDateSafely(userData.last_login, { type: 'datetime', placeholder: 'Never' })}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-500">{formatDateSafely(userData.created_date)}</span>
                        </td>
                        <td className="p-3">
                          <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUser(userData)}>

                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="journeys" className="space-y-4">
              {/* Journey Management Card */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Journey Management
                  </CardTitle>
                  <CardDescription>Comprehensive tools for managing and debugging journey data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Existing Audit/Fix Tool */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Journey Data Audit & Fix Tool
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Simple tool to find and fix ALL broken journey data at once.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <Button 
                        onClick={handleAuditJourneys}
                        disabled={isAuditing}
                        variant="outline"
                      >
                        {isAuditing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        1. Audit All Journeys
                      </Button>
                      
                    </div>
                    
                    {auditResults && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Audit Results:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-2xl font-bold">{auditResults.summary.totalJourneys}</div>
                            <div className="text-xs text-slate-600">Total</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="text-2xl font-bold text-green-700">{auditResults.summary.goodJourneys}</div>
                            <div className="text-xs text-slate-600">Good</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded">
                            <div className="text-2xl font-bold text-red-700">{auditResults.summary.brokenJourneys}</div>
                            <div className="text-xs text-slate-600">Broken</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="text-2xl font-bold text-blue-700">{auditResults.summary.fixableJourneys}</div>
                            <div className="text-xs text-slate-600">Fixable</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {auditResults.summary.fixableJourneys > 0 && (
                            <Button 
                              onClick={handleFixAllJourneys}
                              disabled={isFixingAll}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isFixingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              Fix {auditResults.summary.fixableJourneys} Journeys
                            </Button>
                          )}
                          
                          {(auditResults.summary.brokenJourneys - auditResults.summary.fixableJourneys) > 0 && (
                            <Button 
                              onClick={handleDeleteUnfixable}
                              disabled={isFixingAll}
                              variant="destructive"
                            >
                              {isFixingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              Delete {auditResults.summary.brokenJourneys - auditResults.summary.fixableJourneys} Unfixable Journeys
                            </Button>
                          )}
                        </div>
                        
                        {auditResults.brokenJourneys.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Broken Journeys (first 10):</h5>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {auditResults.brokenJourneys.slice(0, 10).map(journey => (
                                <div key={journey.id} className="p-2 bg-white rounded border text-sm">
                                  <div className="font-medium">{journey.destination || 'Unnamed'}</div>
                                  <div className="text-red-600">Issues: {journey.issues.join(', ')}</div>
                                  <div className="text-slate-500">
                                    user_id: {journey.user_id || 'missing'} | 
                                    created_by: {journey.created_by || 'missing'}
                                    {journey.canFix && <span className="text-green-600 ml-2">✓ Fixable</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Journey Debug Tool */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Journey Debug Tool</h3>
                    <p className="text-slate-600 mb-4">Inspect, fix, or force delete individual journey records by ID.</p>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder="Enter Journey ID to debug..."
                          value={debugJourneyId}
                          onChange={(e) => setDebugJourneyId(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleDebugJourney('inspect')}
                          disabled={isDebuggingJourney}
                        >
                          {isDebuggingJourney && debugResult === null ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Inspect
                        </Button>
                        <Button
                          onClick={() => handleDebugJourney('fix')}
                          disabled={isDebuggingJourney}
                          variant="outline"
                        >
                          {isDebuggingJourney && debugResult === null ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Fix
                        </Button>
                        <Button
                          onClick={() => handleDebugJourney('forceDelete')}
                          disabled={isDebuggingJourney}
                          variant="destructive"
                        >
                          {isDebuggingJourney && debugResult === null ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Force Delete
                        </Button>
                      </div>
                      
                      {debugResult && (
                        <Card className="bg-slate-50">
                          <CardContent className="p-4">
                            <pre className="text-xs overflow-auto max-h-60">
                              {JSON.stringify(debugResult, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 font-semibold text-slate-700">Journey</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Creator</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Status</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Created</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJourneys.map((journey) => {
                      // Find the creator user by email or user_id
                      let creator = null;
                      if (journey.user_id) {
                        creator = users.find(u => u.id === journey.user_id);
                      } else if (journey.created_by) {
                        creator = users.find(u => u.email?.toLowerCase() === journey.created_by?.toLowerCase());
                      }
                      
                      return (
                        <tr key={journey.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-slate-900">
                                {journey.origin ? `${journey.origin} → ${journey.destination}` : journey.destination}
                              </p>
                              <p className="text-sm text-slate-500">
                                {journey.type?.replace('_', ' ')} • {journey.traveling_type?.replace('_', ' ')}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            {creator ? (
                              <div>
                                <p className="font-medium text-slate-900">{creator.full_name}</p>
                                <p className="text-sm text-slate-500">{creator.email}</p>
                              </div>
                            ) : journey.created_by ? (
                              <div>
                                <p className="text-slate-700 font-medium">{journey.created_by}</p>
                                <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                  User Not Found
                                </Badge>
                              </div>
                            ) : (
                              <div>
                                <span className="text-slate-500 font-medium">Unknown Creator</span>
                                <Badge variant="outline" className="text-xs text-slate-500">
                                  No Email
                                </Badge>
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge className={
                              journey.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              journey.status === 'completed' ? 'bg-green-100 text-green-800' :
                              journey.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-slate-100 text-slate-800'
                            }>
                              {journey.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-500">{formatDateSafely(journey.created_at)}</span>
                          </td>
                          <td className="p-3">
                            <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewJourney(journey)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <div className="grid gap-4">
                {filteredFeedback.map((item) =>
                <Card key={item.id} className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.name || 'Anonymous'}</h4>
                          <p className="text-sm text-slate-600">{item.email}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) =>
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />

                        )}
                        </div>
                      </div>
                      {item.additional_comments &&
                    <p className="text-slate-700 mb-2">{item.additional_comments}</p>
                    }
                      <p className="text-xs text-slate-500">{formatDateSafely(item.created_date)}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="discounts" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowCreateDiscountModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Discount Code
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 font-semibold text-slate-700">Code</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Discount</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Usage</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Expires</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map((code) =>
                    <tr key={code.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3">
                          <div>
                            <p className="font-mono font-semibold text-slate-900">{code.code}</p>
                            <p className="text-sm text-slate-500">{code.description}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-700">
                            {code.discount_type === 'percentage' ? `${code.discount_value}%` : `$${code.discount_value}`}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-600">
                            {code.used_count || 0}{code.usage_limit ? `/${code.usage_limit}` : ''}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-500">{formatDateSafely(code.expires_at)}</span>
                        </td>
                        <td className="p-3">
                          <Badge className={code.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {code.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="communications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-600"/>
                    Bulk Email Tool
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-slate-600 mb-2">
                      This tool allows you to compose and send a promotional or informational email. The message will be sent individually to each active premium user, ensuring their email addresses remain private (BCC functionality).
                    </p>
                  </div>
                  <Button onClick={() => setShowBulkEmailModal(true)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Compose Email to Premium Users
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </Card>
      </div>

      {/* Create User Modal - Updated with explanation */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual User Creation</DialogTitle>
            <DialogDesc>
              Due to platform security restrictions, users cannot be created directly by admins.
            </DialogDesc>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How to Add Users:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Have the user sign up normally at the application</li>
                <li>Find their account in the users list above</li>
                <li>Click "Edit" to modify their subscription tier and status</li>
                <li>They will receive an email notification of any premium upgrade</li>
              </ol>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Alternative:</h4>
              <p className="text-sm text-slate-700">
                Use the platform's built-in user management features in the main dashboard to invite users if that option is available.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowCreateUserModal(false)}>
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Discount Code Modal */}
      <Dialog open={showCreateDiscountModal} onOpenChange={setShowCreateDiscountModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Discount Code</DialogTitle>
            <DialogDesc>Create a new discount code for users.</DialogDesc>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Discount Code</Label>
              <Input
                id="code"
                value={newDiscountCode.code}
                onChange={(e) => setNewDiscountCode({ ...newDiscountCode, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20" />

            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newDiscountCode.description}
                onChange={(e) => setNewDiscountCode({ ...newDiscountCode, description: e.target.value })}
                placeholder="20% off premium subscription" />

            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount_type">Type</Label>
                <Select
                  value={newDiscountCode.discount_type}
                  onValueChange={(value) => setNewDiscountCode({ ...newDiscountCode, discount_type: value })}>

                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount_value">Value</Label>
                <Input
                  id="discount_value"
                  type="number"
                  value={newDiscountCode.discount_value}
                  onChange={(e) => setNewDiscountCode({ ...newDiscountCode, discount_value: parseFloat(e.target.value) })}
                  placeholder="20" />

              </div>
            </div>
            <div>
              <Label htmlFor="expires_at">Expires At</Label>
              <Input
                id="expires_at"
                type="date"
                value={newDiscountCode.expires_at}
                onChange={(e) => setNewDiscountCode({ ...newDiscountCode, expires_at: e.target.value })} />

            </div>
            <div>
              <Label htmlFor="usage_limit">Usage Limit (Optional)</Label>
              <Input
                id="usage_limit"
                type="number"
                value={newDiscountCode.usage_limit || ''}
                onChange={(e) => setNewDiscountCode({ ...newDiscountCode, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="100" />

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDiscountModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDiscountCode}>
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit User Modal with Premium Upgrade */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.full_name}</DialogTitle>
            <DialogDesc>Modify user subscription details.</DialogDesc>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="subscription_tier">Subscription Tier</Label>
              <Select
                value={editingUser?.subscription_tier || 'free'}
                onValueChange={(value) => setEditingUser((prev) => ({ ...prev, subscription_tier: value }))}>

                <SelectTrigger id="subscription_tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="subscription_status">Subscription Status</Label>
              <Select
                value={editingUser?.subscription_status || 'inactive'}
                onValueChange={(value) => setEditingUser((prev) => ({ ...prev, subscription_status: value }))}>

                <SelectTrigger id="subscription_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="subscription_expires">Subscription Expires At</Label>
              <Input
                id="subscription_expires"
                type="date"
                value={updatedExpiresAt}
                onChange={(e) => setUpdatedExpiresAt(e.target.value)} />

            </div>
            
            {editingUser && users.find((u) => u.id === editingUser.id)?.subscription_tier === 'free' && editingUser.subscription_tier === 'premium' &&
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Upgrading this user to premium will send them an email notification about their upgrade.
                </p>
              </div>
            }
            
            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
              <p><strong>Email:</strong> {editingUser?.email}</p>
              <p><strong>Current Tier:</strong> {users.find((u) => u.id === editingUser?.id)?.subscription_tier}</p>
              <p><strong>Current Status:</strong> {users.find((u) => u.id === editingUser?.id)?.subscription_status}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Journey Details Modal */}
      <Dialog open={showJourneyModal} onOpenChange={setShowJourneyModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Journey Details</DialogTitle>
          </DialogHeader>
          {selectedJourney &&
          <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Origin</Label>
                  <p className="text-slate-700">{selectedJourney.origin}</p>
                </div>
                <div>
                  <Label>Destination</Label>
                  <p className="text-slate-700">{selectedJourney.destination}</p>
                </div>
                <div>
                  <Label>Journey Type</Label>
                  <p className="text-slate-700 capitalize">{selectedJourney.type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label>Traveling Type</Label>
                  <p className="text-slate-700 capitalize">{selectedJourney.traveling_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p className="text-slate-700">{formatDateSafely(selectedJourney.start_date)}</p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="text-slate-700">{selectedJourney.preferred_duration} nights</p>
                </div>
                <div>
                  <Label>Travelers</Label>
                  <p className="text-slate-700">{selectedJourney.travelers}</p>
                </div>
                <div>
                  <Label>Budget Range</Label>
                  <p className="text-slate-700 capitalize">{selectedJourney.budget_range?.replace('_', ' ') || 'Not specified'}</p>
                </div>
              </div>
              {selectedJourney.notes &&
            <div>
                  <Label>Notes</Label>
                  <p className="text-slate-700">{selectedJourney.notes}</p>
                </div>
            }
              {selectedJourney.confirmed_itinerary &&
            <div>
                  <Label>Has Confirmed Itinerary</Label>
                  <Badge className="bg-green-100 text-green-800 ml-2">Yes</Badge>
                </div>
            }
            </div>
          }
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJourneyModal(false)}>
              Close
            </Button>
            {selectedJourney &&
            <Button onClick={() => navigate(createPageUrl(`JourneyDetails?id=${selectedJourney.id}`))}>
                View Full Details
              </Button>
            }
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Email Modal */}
      <Dialog open={showBulkEmailModal} onOpenChange={setShowBulkEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600"/>
              Send Email to All Premium Users
            </DialogTitle>
            <DialogDesc>
              Compose your message below. It will be sent to all active premium subscribers.
            </DialogDesc>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email-subject" className="text-right">
                Subject
              </Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="A special update for our premium members!"
              />
            </div>
            <div>
              <Label>Message</Label>
              <div className="bg-white rounded-md">
                <ReactQuill 
                  theme="snow" 
                  value={emailBody} 
                  onChange={setEmailBody}
                  placeholder="Craft your message here... You can use formatting and embed links."
                  className="h-64 mb-12"
                />
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkEmailModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendBulkEmail} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}
