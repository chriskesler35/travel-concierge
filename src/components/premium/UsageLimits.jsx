import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Crown, AlertTriangle, Zap } from "lucide-react";

export default function UsageLimits({ onUpgradeClick }) {
  const [user, setUser] = useState(null);
  const [usageData, setUsageData] = useState({
    journeysThisMonth: 0,
    journeyLimit: 1,
    isNearLimit: false
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      const journeyLimit = userData.subscription_tier === 'free' ? 1 : 999;
      const journeysThisMonth = userData.journeys_created || 0;
      
      setUsageData({
        journeysThisMonth,
        journeyLimit,
        isNearLimit: journeysThisMonth >= journeyLimit * 0.8
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  if (!user || user.subscription_tier !== 'free') {
    return null;
  }

  const usagePercentage = (usageData.journeysThisMonth / usageData.journeyLimit) * 100;
  const isAtLimit = usageData.journeysThisMonth >= usageData.journeyLimit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className={`border-2 ${isAtLimit ? 'border-red-200 bg-red-50' : usageData.isNearLimit ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isAtLimit ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <Zap className="w-5 h-5 text-blue-500" />
              )}
              <h4 className="font-semibold text-slate-900">
                Monthly Journey Limit
              </h4>
              <Badge variant="outline" className="text-xs">
                Free Plan
              </Badge>
            </div>
            {(isAtLimit || usageData.isNearLimit) && (
              <Button
                onClick={onUpgradeClick}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Crown className="w-3 h-3 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                {usageData.journeysThisMonth} of {usageData.journeyLimit} journey used
              </span>
              <span className="font-medium text-slate-900">
                {Math.round(usagePercentage)}%
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${isAtLimit ? '[&>div]:bg-red-500' : usageData.isNearLimit ? '[&>div]:bg-amber-500' : '[&>div]:bg-blue-500'}`}
            />
            {isAtLimit && (
              <p className="text-sm text-red-600 font-medium">
                You've reached your monthly limit. Upgrade for unlimited journeys!
              </p>
            )}
            {usageData.isNearLimit && !isAtLimit && (
              <p className="text-sm text-amber-600">
                You're approaching your monthly limit.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}