
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Journey } from "@/api/entities";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  User as UserIcon,
  Settings,
  CreditCard,
  Bell,
  Shield,
  Mail,
  Phone,
  AlertTriangle,
  Trash2,
  X,
  MapPin
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import SubscriptionStatus from "../components/premium/SubscriptionStatus";
import PremiumGate from "../components/premium/PremiumGate";

export default function Account() {
  const [user, setUser] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showCancelPolicy, setShowCancelPolicy] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    email_marketing: false,
    email_itinerary_updates: true,
    email_booking_reminders: true,
    email_travel_tips: false,
    push_notifications: false,
    sms_reminders: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    data_sharing_analytics: false,
    data_sharing_partners: false,
    profile_visibility: 'private',
    location_tracking: false,
    cookie_preferences: 'essential'
  });

  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.notification_settings) {
        setNotificationSettings(prev => ({ ...prev, ...userData.notification_settings }));
      }

      if (userData.privacy_settings) {
        setPrivacySettings(prev => ({ ...prev, ...userData.privacy_settings }));
      }

      const userJourneys = await Journey.filter({ created_by: userData.email }, "created_at DESC");
      setJourneys(userJourneys);

    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleCancelSubscription = async () => {
    setIsUpdating(true);
    try {
      await User.updateMyUserData({
        subscription_status: 'canceled'
      });
      await loadUserData();
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
    }
    setIsUpdating(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      return;
    }

    setIsUpdating(true);
    try {
      const journeysToDelete = await Journey.filter({ created_by: user.email }); // Fetch journeys specifically for this user
      for (const journey of journeysToDelete) {
        await Journey.delete(journey.id);
      }

      alert("Account deletion initiated. You will be logged out and your data will be removed from our systems.");
      await User.logout();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Error deleting account. Please contact support.");
    }
    setIsUpdating(false);
  };

  const handleManageSubscription = () => {
    alert("This would redirect to Stripe Customer Portal to manage billing");
  };

  const handleNotificationChange = (setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const saveNotificationSettings = async () => {
    setIsSavingSettings(true);
    try {
      await User.updateMyUserData({
        notification_settings: notificationSettings
      });
      alert("Notification settings saved successfully!");
      setShowNotificationSettings(false);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const savePrivacySettings = async () => {
    setIsSavingSettings(true);
    try {
      await User.updateMyUserData({
        privacy_settings: privacySettings
      });
      alert("Privacy settings saved successfully!");
      setShowPrivacySettings(false);
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isActiveSubscription = user.subscription_tier === 'premium' && user.subscription_status === 'active';
  const isCanceledSubscription = user.subscription_tier === 'premium' && user.subscription_status === 'canceled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-slate-600">Manage your profile and subscription preferences</p>
        </motion.div>

        <div className="grid gap-6">
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={user.full_name || ''}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user.email || ''}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  Profile information is managed through your Google account
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Status */}
          {(user.subscription_tier === 'free' || user.subscription_tier === 'premium') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SubscriptionStatus
                onUpgradeClick={() => setShowUpgradeDialog(true)}
                onManageSubscription={handleManageSubscription}
              />
            </motion.div>
          )}

          {/* Cancellation Notice for Canceled Subscriptions */}
          {isCanceledSubscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-2 border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-900">Subscription Canceled</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        Your subscription has been canceled and will not renew. You'll continue to have access to premium features until {user.subscription_expires ? new Date(user.subscription_expires).toLocaleDateString() : 'your subscription expires'}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Button
                    onClick={() => setShowNotificationSettings(true)}
                    variant="outline"
                    className="flex items-start gap-3 h-auto p-4 text-left"
                  >
                    <Bell className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        <span className="sm:hidden">Notifications</span>
                        <span className="hidden sm:inline">Notification Settings</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        <span className="sm:hidden">Manage notifications</span>
                        <span className="hidden sm:inline">Manage your email and push notifications</span>
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setShowPrivacySettings(true)}
                    variant="outline"
                    className="flex items-start gap-3 h-auto p-4 text-left"
                  >
                    <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        <span className="sm:hidden">Privacy</span>
                        <span className="hidden sm:inline">Privacy Settings</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        <span className="sm:hidden">Control data & privacy</span>
                        <span className="hidden sm:inline">Control your data and privacy preferences</span>
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Cancellation Policy Section */}
                <div className="pt-4 border-t">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Cancellation Policy
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      We operate on a no-refund policy. When you cancel your subscription:
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1 mb-3">
                      <li>• No refunds will be provided for the current billing period</li>
                      <li>• You'll retain access to premium features until your subscription expires</li>
                      <li>• Your subscription will not automatically renew</li>
                      <li>• You can resubscribe at any time</li>
                    </ul>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCancelPolicy(true)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                    >
                      View Full Cancellation Policy
                    </Button>
                  </div>
                </div>

                {/* Subscription Management */}
                {isActiveSubscription && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="outline"
                      className="w-full mb-3 text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t space-y-3">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full"
                  >
                    Sign Out
                  </Button>

                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Journey Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  My Journey Overview ({journeys.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {journeys.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">You haven't planned any journeys yet.</p>
                ) : (
                  <div className="space-y-2">
                    {journeys.slice(0, 5).map((journey) => (
                      <div key={journey.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">
                            {journey.origin || 'Cruise/Train'} → {journey.destination}
                          </p>
                          <p className="text-sm text-slate-500 capitalize">
                            {journey.type} • {journey.traveling_type ? journey.traveling_type.replace('_', ' ') : 'N/A'} • {journey.status}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {journey.preferred_duration} days
                        </Badge>
                      </div>
                    ))}
                    {journeys.length > 5 && (
                      <p className="text-center text-sm text-slate-500 pt-2">
                        ... and {journeys.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Premium Gate Dialog */}
        {user?.subscription_tier === 'free' && (
          <PremiumGate
            showUpgradeDialog={showUpgradeDialog}
            onUpgradeComplete={() => {
              setShowUpgradeDialog(false);
              loadUserData();
            }}
            onClose={() => setShowUpgradeDialog(false)}
          />
        )}

        {/* Notification Settings Dialog */}
        <Dialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Notification Settings
              </DialogTitle>
              <DialogDescription>
                Choose what notifications you'd like to receive from Travel Concierge.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Email Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Itinerary Updates</Label>
                      <p className="text-sm text-slate-500">Get notified when your itinerary is ready or updated</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_itinerary_updates}
                      onCheckedChange={(value) => handleNotificationChange('email_itinerary_updates', value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Booking Reminders</Label>
                      <p className="text-sm text-slate-500">Reminders about upcoming trips and bookings</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_booking_reminders}
                      onCheckedChange={(value) => handleNotificationChange('email_booking_reminders', value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Travel Tips & Guides</Label>
                      <p className="text-sm text-slate-500">Receive helpful travel tips and destination guides</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_travel_tips}
                      onCheckedChange={(value) => handleNotificationChange('email_travel_tips', value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Marketing & Promotions</Label>
                      <p className="text-sm text-slate-500">Special offers, new features, and promotional content</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_marketing}
                      onCheckedChange={(value) => handleNotificationChange('email_marketing', value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Other Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Push Notifications</Label>
                      <p className="text-sm text-slate-500">Browser notifications for important updates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.push_notifications}
                      onCheckedChange={(value) => handleNotificationChange('push_notifications', value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">SMS Reminders</Label>
                      <p className="text-sm text-slate-500">Text message reminders for important travel dates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.sms_reminders}
                      onCheckedChange={(value) => handleNotificationChange('sms_reminders', value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNotificationSettings(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveNotificationSettings}
                disabled={isSavingSettings}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSavingSettings ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Privacy Settings Dialog */}
        <Dialog open={showPrivacySettings} onOpenChange={setShowPrivacySettings}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Privacy Settings
              </DialogTitle>
              <DialogDescription>
                Control how your data is used and shared by Travel Concierge.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Data Usage</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Analytics & Performance</Label>
                      <p className="text-sm text-slate-500">Help us improve Travel Concierge by sharing anonymous usage data</p>
                    </div>
                    <Switch
                      checked={privacySettings.data_sharing_analytics}
                      onCheckedChange={(value) => handlePrivacyChange('data_sharing_analytics', value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Partner Recommendations</Label>
                      <p className="text-sm text-slate-500">Share travel preferences with trusted partners for better recommendations</p>
                    </div>
                    <Switch
                      checked={privacySettings.data_sharing_partners}
                      onCheckedChange={(value) => handlePrivacyChange('data_sharing_partners', value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Location Tracking</Label>
                      <p className="text-sm text-slate-500">Allow location-based recommendations and features</p>
                    </div>
                    <Switch
                      checked={privacySettings.location_tracking}
                      onCheckedChange={(value) => handlePrivacyChange('location_tracking', value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Profile & Visibility</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium mb-2 block">Profile Visibility</Label>
                    <Select
                      value={privacySettings.profile_visibility}
                      onValueChange={(value) => handlePrivacyChange('profile_visibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private - Only visible to me</SelectItem>
                        <SelectItem value="friends">Friends - Visible to connected users</SelectItem>
                        <SelectItem value="public">Public - Visible to all Travel Concierge users</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500 mt-1">Control who can see your travel history and preferences</p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="font-medium mb-2 block">Cookie Preferences</Label>
                    <Select
                      value={privacySettings.cookie_preferences}
                      onValueChange={(value) => handlePrivacyChange('cookie_preferences', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essential">Essential Only - Required for site functionality</SelectItem>
                        <SelectItem value="functional">Functional - Includes preferences and settings</SelectItem>
                        <SelectItem value="all">All Cookies - Includes analytics and marketing</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500 mt-1">Choose what types of cookies we can use</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="font-semibold text-slate-900 mb-2">Data Protection Reminder</h5>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• We never sell your personal data to third parties</li>
                  <li>• Your payment information is securely handled by Stripe</li>
                  <li>• You can request data deletion at any time</li>
                  <li>• All data is encrypted and stored securely</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPrivacySettings(false)}>
                Cancel
              </Button>
              <Button
                onClick={savePrivacySettings}
                disabled={isSavingSettings}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSavingSettings ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancellation Policy Modal */}
        <Dialog open={showCancelPolicy} onOpenChange={setShowCancelPolicy}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Travel Concierge Cancellation Policy
              </DialogTitle>
              <DialogDescription>
                Please read our complete cancellation policy below.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-6 text-sm text-slate-700">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">No Refund Policy</h4>
                <p className="mb-3">
                  Travel Concierge operates on a strict no-refund policy. All subscription payments are final and non-refundable under any circumstances, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 ml-4">
                  <li>Change of mind or dissatisfaction with service</li>
                  <li>Inability to use the service due to technical issues on your end</li>
                  <li>Failure to cancel before the next billing cycle</li>
                  <li>Duplicate charges or billing errors (subject to verification)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Subscription Cancellation</h4>
                <p className="mb-3">You may cancel your subscription at any time by:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 ml-4">
                  <li>Using the "Cancel Subscription" button in your account settings</li>
                  <li>Contacting our support team</li>
                </ul>
                <p className="mt-3 text-slate-600">
                  Upon cancellation, your subscription will remain active until the end of your current billing period, after which it will not renew.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Access After Cancellation</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 ml-4">
                  <li>You will retain full access to premium features until your subscription expires</li>
                  <li>After expiration, your account will revert to the free tier</li>
                  <li>Your journey data and account information will be preserved</li>
                  <li>You may resubscribe at any time to regain premium access</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Billing and Renewals</h4>
                <p className="text-slate-600">
                  Annual subscriptions automatically renew unless cancelled. You are responsible for cancelling before your renewal date if you do not wish to continue service. We will send email reminders prior to renewal, but failure to receive or read these notifications does not exempt you from charges.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h5 className="font-semibold text-amber-900 mb-2">Important Notice</h5>
                <p className="text-amber-800 text-sm">
                  By using Travel Concierge, you acknowledge that you have read, understood, and agree to this cancellation policy. This policy is part of our Terms of Service and is legally binding.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowCancelPolicy(false)}>
                I Understand
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Subscription Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Cancel Subscription
              </DialogTitle>
              <DialogDescription className="text-left space-y-3 pt-2">
                <p>Are you sure you want to cancel your subscription?</p>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Cancellation Policy:</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• No refunds will be provided for the current subscription period</li>
                    <li>• You'll continue to have access to premium features until your subscription expires</li>
                    <li>• Your subscription will not automatically renew</li>
                    <li>• You can resubscribe at any time</li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="w-full sm:w-auto"
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleCancelSubscription}
                disabled={isUpdating}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
              >
                {isUpdating ? "Canceling..." : "Cancel Subscription"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </DialogTitle>
              <DialogDescription className="text-left space-y-3 pt-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold mb-2">⚠️ This action cannot be undone!</p>
                  <p className="text-red-700 text-sm">
                    Deleting your account will permanently remove:
                  </p>
                  <ul className="text-red-700 text-sm mt-2 space-y-1">
                    <li>• All your journey plans and itineraries</li>
                    <li>• Your account profile and preferences</li>
                    <li>• Any active subscription (no refund)</li>
                    <li>• All account data and history</li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="delete-confirm" className="text-sm font-medium">
                  Type "DELETE MY ACCOUNT" to confirm:
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="mt-1"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmText("");
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isUpdating || deleteConfirmText !== "DELETE MY ACCOUNT"}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  {isUpdating ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
