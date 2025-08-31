
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Globe, Calendar, CreditCard, AlertTriangle } from "lucide-react";

const formatDateSafely = (dateInput, options = {}) => {
  const { format = "full", fallback = "Date not available" } = options;
  try {
    if (!dateInput) return fallback;
    const dateStr = String(dateInput).trim();
    if (dateStr.length < 8 || ["null", "undefined"].includes(dateStr.toLowerCase())) return fallback;
    let dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      // Attempt to parse YYYY-MM-DD as UTC to avoid timezone issues for date-only strings
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) dateObj = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    }
    if (isNaN(dateObj.getTime())) return fallback; // Still invalid after additional parsing attempt

    const formatOptions = { timeZone: 'UTC' }; // Default to UTC for consistent date display
    if (format === "full") { 
      Object.assign(formatOptions, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); 
    } else if (format === "short") { 
      Object.assign(formatOptions, { year: 'numeric', month: 'short', day: 'numeric' }); 
    } else if (format === 'month-day') { 
      Object.assign(formatOptions, { month: 'short', day: 'numeric' }); 
    }
    return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj);
  } catch (error) { 
    console.error("Error formatting date:", error);
    return fallback; 
  }
};

const tierInfo = {
  free: {
    name: "Explorer",
    icon: Globe,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    badgeColor: "bg-slate-100 text-slate-800"
  },
  premium: {
    name: "Adventurer",
    icon: Crown,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    badgeColor: "bg-blue-100 text-blue-800"
  }
};

export default function SubscriptionStatus({ onUpgradeClick, onManageSubscription }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  if (!user) {
    return <div className="animate-pulse bg-gray-200 rounded-lg h-32" />;
  }

  const tier = tierInfo[user.subscription_tier || 'free'];
  const Icon = tier.icon;
  const isActive = user.subscription_status === 'active';
  const isCanceled = user.subscription_status === 'canceled';

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${tier.bgColor} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${tier.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                {tier.name} Plan
              </CardTitle>
              <p className="text-sm text-slate-600">
                {user.subscription_tier === 'free' ? 'Free forever' : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={tier.badgeColor}>
              {user.subscription_tier?.toUpperCase()}
            </Badge>
            {isCanceled && (
              <Badge className="bg-amber-100 text-amber-800 text-xs">
                Canceled
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {user.subscription_tier !== 'free' && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">
              {isCanceled ? 'Access until' : isActive ? 'Active until' : 'Expired on'} {' '}
              {formatDateSafely(user.subscription_expires, { format: 'short' })}
            </span>
          </div>
        )}

        {isCanceled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-800">
                Your subscription is canceled and will not renew automatically.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {user.subscription_tier === 'free' ? (
            <Button
              onClick={onUpgradeClick}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          ) : (
            <>
              {isCanceled ? (
                <Button
                  onClick={onUpgradeClick}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Resubscribe
                </Button>
              ) : (
                <Button
                  onClick={onManageSubscription}
                  variant="outline"
                  className="flex-1"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
