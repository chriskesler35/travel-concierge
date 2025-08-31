import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';

export default function PremiumFeatureWrapper({ user, featureName, onUpgradeClick, children }) {
  if (!user) {
    // Render a disabled state if user data isn't loaded yet
    return (
      <div className="inline-block">
        {React.cloneElement(children, { disabled: true })}
      </div>
    );
  }

  const isPremium = user.subscription_tier === 'premium' && user.subscription_status === 'active';

  if (isPremium) {
    return children;
  }

  // For free users, render the disabled button with a tooltip and upgrade prompt
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* A wrapper div is necessary because disabled buttons don't fire mouse events */}
          <div onClick={onUpgradeClick} className="inline-block cursor-pointer">
            {React.cloneElement(children, { 
              disabled: true, 
              className: `${children.props.className} cursor-not-allowed opacity-60`,
              "aria-disabled": true
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 text-white border-slate-700">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" />
            <p>Upgrade to Premium to {featureName}.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}