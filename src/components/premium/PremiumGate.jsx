
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { DiscountCode } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { 
  Crown, 
  Star, 
  Lock, 
  Check, 
  X, 
  Zap,
  Globe,
  Calendar,
  Headphones,
  Shield,
  Ticket,
  Loader2
} from "lucide-react";
import { sendUserNotificationEmail } from '@/api/functions';

const plans = [
  {
    tier: "free",
    name: "Explorer",
    price: "$0",
    period: "1 Itinerary",
    features: [
      "Plan 1 full journey",
      "Full itinerary generation", 
      "All travel types",
      "Community support"
    ],
    limitations: [
      "No editing or deleting",
      "No additional journeys",
      "Standard support"
    ],
    icon: Globe,
    color: "text-slate-600",
    bgColor: "bg-slate-100"
  },
  {
    tier: "premium",
    name: "Premium Annual",
    price: "$24.99",
    period: "per year",
    features: [
      "Unlimited journey planning",
      "Edit and delete any journey",
      "Premium destination access",
      "Advanced customization options",
      "Priority email support",
      "Exclusive travel partnerships"
    ],
    limitations: [],
    icon: Crown,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    isPopular: true
  }
];

export default function PremiumGate({ 
  requiredTier = "premium", 
  featureName,
  children,
  showUpgradeDialog = false,
  onUpgradeComplete,
  onClose 
}) {
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [internalShowPlans, setInternalShowPlans] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState(null);
  const [discountError, setDiscountError] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    setInternalShowPlans(showUpgradeDialog);
  }, [showUpgradeDialog]);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const hasAccess = () => {
    if (!user) return false;
    
    const tierLevels = { free: 0, premium: 1 };
    const userLevel = tierLevels[user.subscription_tier || 'free'];
    const requiredLevel = tierLevels[requiredTier];
    
    return userLevel >= requiredLevel && user.subscription_status === 'active';
  };

  const validateDiscountCode = async (code) => {
    if (!code.trim()) {
      setDiscountInfo(null);
      setDiscountError("");
      return;
    }

    setIsValidatingCode(true);
    setDiscountError("");
    
    try {
      const codes = await DiscountCode.filter({ code: code.toUpperCase() });
      const validCode = codes.find(c => 
        c.is_active && 
        new Date(c.expires_at) > new Date() &&
        (c.usage_limit === null || (c.used_count || 0) < c.usage_limit) &&
        (!user?.discount_codes_used || !user.discount_codes_used.includes(c.code))
      );

      if (validCode) {
        setDiscountInfo(validCode);
      } else {
        setDiscountInfo(null);
        setDiscountError("Invalid, expired, or already used discount code");
      }
    } catch (error) {
      setDiscountError("Error validating discount code");
      console.error("Error validating discount code:", error);
    }
    
    setIsValidatingCode(false);
  };

  const handleDiscountCodeChange = (code) => {
    setDiscountCode(code);
    // Debounce validation
    const timer = setTimeout(() => validateDiscountCode(code), 500);
    return () => clearTimeout(timer);
  };

  const calculateDiscountedPrice = (originalPrice) => {
    if (!discountInfo) return originalPrice;
    
    if (discountInfo.discount_type === 'percentage') {
      return originalPrice * (1 - discountInfo.discount_value / 100);
    } else {
      return Math.max(0, originalPrice - discountInfo.discount_value);
    }
  };

  const handleUpgrade = async (selectedTier) => {
    setIsProcessing(true);
    
    try {
      const updateData = {
        subscription_tier: selectedTier,
        subscription_status: 'active',
        subscription_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      // If using discount code, mark it as used
      if (discountInfo) {
        await DiscountCode.update(discountInfo.id, {
          used_count: (discountInfo.used_count || 0) + 1
        });
        
        updateData.discount_codes_used = [
          ...(user?.discount_codes_used || []),
          discountInfo.code
        ];
      }

      await User.updateMyUserData(updateData);
      
      // Send premium purchase confirmation email
      try {
        if (user) { // Ensure user object is available before sending email
            await sendUserNotificationEmail({
              type: 'premium_purchase',
              userEmail: user.email,
              userName: user.full_name,
              adminName: null // Self-upgrade, no admin involved
            });
        }
      } catch (emailError) {
        console.warn('Failed to send premium purchase email:', emailError);
        // Don't fail the upgrade if email fails
      }
      
      setUser(prev => ({
        ...prev,
        subscription_tier: selectedTier,
        subscription_status: 'active'
      }));
      
      setInternalShowPlans(false);
      if (onUpgradeComplete) onUpgradeComplete();
      
    } catch (error) {
      console.error("Error upgrading subscription:", error);
    }
    
    setIsProcessing(false);
  };
  
  const handleClose = () => {
    setInternalShowPlans(false);
    setDiscountCode("");
    setDiscountInfo(null);
    setDiscountError("");
    if(onClose) onClose();
  }

  if (children) {
    if (!user) {
      return <div className="animate-pulse bg-gray-200 rounded-lg h-32" />;
    }

    if (hasAccess()) {
      return children;
    }

    // Only show the premium gate card for free users
    return (
      <Card className="border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Premium Feature
          </h3>
          <p className="text-slate-600 mb-4">
            {featureName || "This feature"} requires a premium subscription to unlock the full experience.
          </p>
          <Button
            onClick={() => setInternalShowPlans(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  } else {
    // For standalone usage (not wrapping children), only show for free users
    if (!user) {
      return null; // or loading state
    }

    if (hasAccess()) {
      return null; // Premium users don't need to see this
    }

    return (
      <div className="text-center py-16">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm max-w-lg mx-auto">
          <CardContent className="p-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Upgrade to Unlock
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {featureName || "This feature is for premium members."} Upgrade your plan to get access.
            </p>
            <Button onClick={() => setInternalShowPlans(true)}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Dialog open={internalShowPlans} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-4">
              Choose Your Adventure Level
            </DialogTitle>
          </DialogHeader>
          
          {/* Discount Code Section */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="w-5 h-5 text-purple-600" />
              <Label className="text-sm font-semibold text-purple-900">Have a discount code?</Label>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Enter discount code..."
                  value={discountCode}
                  onChange={(e) => handleDiscountCodeChange(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                {isValidatingCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
            </div>
            {discountInfo && (
              <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-800">
                <Check className="w-4 h-4 inline mr-1" />
                {discountInfo.description} - Save {discountInfo.discount_type === 'percentage' ? `${discountInfo.discount_value}%` : `$${discountInfo.discount_value}`}
              </div>
            )}
            {discountError && (
              <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                <X className="w-4 h-4 inline mr-1" />
                {discountError}
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrentTier = user?.subscription_tier === plan.tier;
              const originalPrice = parseFloat(plan.price.replace('$', '')) || 0;
              const discountedPrice = calculateDiscountedPrice(originalPrice);
              const hasDiscount = discountInfo && originalPrice > 0;
              
              return (
                <motion.div
                  key={plan.tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-blue-500 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <Card className={`h-full ${plan.isPopular ? 'border-2 border-blue-500 shadow-xl' : 'border border-gray-200'} ${isCurrentTier ? 'ring-2 ring-green-500' : ''}`}>
                    <CardHeader className="text-center p-6">
                      <div className={`w-16 h-16 ${plan.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`w-8 h-8 ${plan.color}`} />
                      </div>
                      <CardTitle className="text-xl font-bold">
                        {plan.name}
                        {isCurrentTier && (
                          <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                            Current Plan
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="text-3xl font-bold text-slate-900">
                        {hasDiscount && originalPrice > 0 ? (
                          <div className="space-y-1">
                            <div className="text-lg line-through text-slate-400">${originalPrice.toFixed(2)}</div>
                            <div>${discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          plan.price
                        )}
                        <span className="text-base font-normal text-slate-500">
                          /{plan.period}
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6 pt-0">
                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-slate-600">{feature}</span>
                          </div>
                        ))}
                        {plan.limitations.map((limitation, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span className="text-sm text-slate-400">{limitation}</span>
                          </div>
                        ))}
                      </div>
                      
                      {plan.tier === 'free' ? (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          disabled={isCurrentTier}
                        >
                          {isCurrentTier ? 'Current Plan' : 'Free Forever'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUpgrade(plan.tier)}
                          disabled={isProcessing || isCurrentTier}
                          className={`w-full ${
                            plan.isPopular 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : 'bg-slate-600 hover:bg-slate-700'
                          } text-white`}
                        >
                          {isProcessing ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              Processing...
                            </div>
                          ) : isCurrentTier ? (
                            'Current Plan'
                          ) : (
                            `Upgrade to ${plan.name}`
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          <div className="text-center mt-6 text-sm text-slate-500">
            <p>You can cancel your annual subscription anytime.</p>
            <p className="mt-2">Secure payments powered by Stripe</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
