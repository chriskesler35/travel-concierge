

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Feedback } from "@/api/entities";
import { trackLogin } from "@/api/functions";
import AIChatbot from './components/common/AIChatbot';
import QuickGuideModal from './components/common/QuickGuideModal'; // Added import for QuickGuideModal
import {
  MapPin,
  User as UserIcon,
  Compass,
  Settings,
  Globe,
  Menu,
  Shield,
  MessageSquare,
  Info,
  Star,
  HelpCircle, // Added HelpCircle icon
  Bot // Added Bot icon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [hasTrackedLogin, setHasTrackedLogin] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false); // State for the guide modal
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    rating: 0,
    additional_comments: ''
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    // Enhanced retry logic with better session management
    const loadWithRetry = async (retryCount = 0) => {
      try {
        const userData = await User.me();
        setUser(userData);
        
        // Track login for ALL users, not just first-time loads
        // Use a session storage key that includes user ID for better tracking
        const sessionKey = `loginTracked_${userData.id}`;
        const alreadyTracked = sessionStorage.getItem(sessionKey);
        
        if (userData && !alreadyTracked) {
          console.log(`Tracking login for user: ${userData.email}`);
          sessionStorage.setItem(sessionKey, 'true');

          try {
            const result = await trackLogin();
            console.log('Login tracking result:', result?.data);
            setHasTrackedLogin(true);
          } catch (error) {
            console.warn('Login tracking failed (non-critical):', error);
            // Don't retry - just log and continue
          }
        } else if (alreadyTracked) {
          console.log(`Login already tracked this session for user: ${userData.email}`);
          setHasTrackedLogin(true);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        
        // Handle rate limiting with exponential backoff
        if (error.response?.status === 429 && retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
          console.warn(`Rate limited loading user, retrying in ${delay}ms (attempt ${retryCount + 1})`);
          setTimeout(() => loadWithRetry(retryCount + 1), delay);
          return;
        }
        
        setUser(null);
      }
    };

    await loadWithRetry();
  };
  
  const handleLogout = async () => {
    // Clear all session tracking when user logs out
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('loginTracked_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    await User.logout();
    setUser(null);
    setHasTrackedLogin(false);
  };

  const getAdminNav = () => {
     if (user && user.role === 'admin') {
       return {
         title: "Admin Panel",
         url: createPageUrl("AdminPanel"),
         icon: Shield,
         adminOnly: true
       }
     }
     return null;
  }

  const handleFeedbackSubmit = async () => {
    if (feedbackData.rating === 0) {
      alert("Please provide a rating.");
      return;
    }
    
    setIsSubmittingFeedback(true);
    try {
      await Feedback.create({
        name: feedbackData.name || user?.full_name || 'Anonymous',
        email: feedbackData.email || user?.email || '',
        rating: feedbackData.rating,
        additional_comments: feedbackData.additional_comments
      });
      
      setShowFeedbackModal(false);
      setFeedbackData({
        name: '',
        email: '',
    additional_comments: '' // Corrected from initial_comments
      });
      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("There was an error submitting your feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleFeedbackOpen = () => {
    // Pre-populate with user data if available
    if (user) {
      setFeedbackData(prev => ({
        ...prev,
        name: user.full_name || '',
        email: user.email || ''
      }));
    }
    setShowFeedbackModal(true);
  };

  const navigationItems = [
    {
      title: "Journey Types",
      url: createPageUrl("Home"),
      icon: Compass,
    },
    {
      title: "My Journeys",
      url: createPageUrl("Journeys"),
      icon: MapPin,
    },
    {
      title: "AI Assistant",
      url: createPageUrl("AIAssistant"),
      icon: Bot,
    },
    {
      title: "Guide",
      onClick: () => setShowGuideModal(true),
      icon: HelpCircle,
    },
    {
      title: "About Us",
      url: createPageUrl("AboutUs"),
      icon: Info,
    },
    {
      title: "Account",
      url: createPageUrl("Account"),
      icon: Settings,
    },
  ];

  const allNavItems = [...navigationItems, getAdminNav()].filter(Boolean);

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
      <style>
        {`
          :root {
            --primary: 15 23 42;
            --primary-foreground: 248 250 252;
            --secondary: 245 158 11;
            --secondary-foreground: 15 23 42;
            --accent: 59 130 246;
            --accent-foreground: 15 23 42;
            --muted: 241 245 249;
            --muted-foreground: 100 116 139;
          }
          .glass-effect {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
          .sidebar-gradient {
            background: linear-gradient(180deg, 
              rgba(248, 250, 252, 0.98) 0%, 
              rgba(241, 245, 249, 0.98) 50%, 
              rgba(226, 232, 240, 0.98) 100%);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(148, 163, 184, 0.2);
          }
          .gradient-text {
            background: linear-gradient(135deg, #0F172A 0%, #1E40AF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .markdown-content a {
            color: #2563eb; /* equivalent to text-blue-600 */
            text-decoration: underline;
            font-weight: 500;
          }
          .markdown-content a:hover {
            color: #1d4ed8; /* equivalent to text-blue-700 */
          }
          .markdown-content p:last-child {
            margin-bottom: 0;
          }
        `}
      </style>

      {/* Desktop Sidebar */}
      <aside className="sidebar-gradient hidden md:flex w-64 flex-col">
        <div className="border-b border-slate-200/50 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg gradient-text">Travel Concierge</h2>
              <p className="text-xs text-slate-500 font-medium">Luxury Journey Planning</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Navigation
            </h3>
            <nav className="space-y-1">
              {allNavItems.map((item) => {
                const isActive = item.url && location.pathname === item.url;
                const itemClasses = `flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-300 w-full text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50/90 to-purple-50/90 text-blue-700 shadow-sm border border-blue-100/50'
                      : 'text-slate-600 hover:bg-blue-50/80 hover:text-blue-700 hover:shadow-sm'
                  }`;

                if (item.url) {
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={itemClasses}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                       {item.adminOnly && <Badge className="ml-auto bg-red-100 text-red-800 text-xs">Admin</Badge>}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.title}
                    onClick={item.onClick}
                    className={itemClasses}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200/50">
           <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={handleFeedbackOpen}>
             <MessageSquare className="w-4 h-4 mr-2"/>
             Give Feedback
           </Button>
          {user ? (
            <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-slate-600"/>
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800">{user.full_name}</p>
                <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-blue-600">
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Button onClick={() => User.login()} className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200/50 px-4 sm:px-6 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-bold gradient-text">Travel Concierge</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6 text-slate-800" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {allNavItems.map((item) => (
                    <DropdownMenuItem 
                      key={item.title} 
                      asChild={!!item.url} 
                      onSelect={item.onClick ? item.onClick : undefined} // Use onSelect for onClick items
                    >
                      {item.url ? (
                        <Link to={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                          {item.adminOnly && <Badge className="ml-auto bg-red-100 text-red-800 text-xs">Admin</Badge>}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 w-full cursor-pointer">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
      
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              We value your feedback to improve Travel Concierge. Your input helps us create better travel experiences.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feedback-name">Name</Label>
                <Input
                  id="feedback-name"
                  value={feedbackData.name}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="feedback-email">Email</Label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={feedbackData.email}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div>
              <Label>Overall Rating</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 cursor-pointer transition-colors ${
                      (hoverRating || feedbackData.rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'
                    }`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="feedback-comments">Comments</Label>
              <Textarea
                id="feedback-comments"
                placeholder="What did you like? What could be better? Any suggestions for new features?"
                value={feedbackData.additional_comments}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, additional_comments: e.target.value }))}
                className="h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFeedbackSubmit} 
              disabled={isSubmittingFeedback || feedbackData.rating === 0}
            >
              {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Chatbot - Available on all pages */}
      <AIChatbot />

      {/* Quick Guide Modal */}
      <QuickGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  );
}

