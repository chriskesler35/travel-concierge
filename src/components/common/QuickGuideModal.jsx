
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Compass, 
  Wand2, 
  Lightbulb, 
  Share2, 
  Crown, 
  HelpCircle, 
  Sparkles, 
  FileDown,
  MousePointerClick
} from 'lucide-react';

const GuideSection = ({ title, icon: Icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
    </div>
    <div className="space-y-4 pl-2 border-l-2 border-slate-200 ml-5">
      {children}
    </div>
  </div>
);

const GuideCard = ({ title, children }) => (
  <div className="p-4 bg-slate-50 rounded-lg ml-7">
    <h4 className="font-semibold text-slate-700 mb-2">{title}</h4>
    <div className="prose prose-sm text-slate-600 max-w-none space-y-2">{children}</div>
  </div>
);

const Tip = ({ children }) => (
    <Alert className="bg-amber-50 border-amber-200 ml-7">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <AlertTitle className="font-semibold text-amber-800">Pro Tip</AlertTitle>
        <AlertDescription className="text-amber-700">
            {children}
        </AlertDescription>
    </Alert>
);

export default function QuickGuideModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 md:pb-6">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-blue-600" />
            Quick Reference Guide
          </DialogTitle>
          <DialogDescription>
            Everything you need to know to craft your perfect journey.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-2 md:p-6 md:pt-0">
          <Tabs defaultValue="getting-started" className="flex flex-col md:flex-row h-full gap-4 md:gap-6">
            <TabsList className="flex-shrink-0 flex-row overflow-x-auto md:flex-col md:h-auto md:w-48 bg-slate-100 p-2 rounded-lg">
              <TabsTrigger 
                value="getting-started" 
                className="w-full text-left justify-start text-blue-800 data-[state=active]:text-black data-[state=active]:bg-white font-medium"
              >
                Getting Started
              </TabsTrigger>
              <TabsTrigger 
                value="creating-trips" 
                className="w-full text-left justify-start text-blue-800 data-[state=active]:text-black data-[state=active]:bg-white font-medium"
              >
                Creating Trips
              </TabsTrigger>
              <TabsTrigger 
                value="refining" 
                className="w-full text-left justify-start text-blue-800 data-[state=active]:text-black data-[state=active]:bg-white font-medium"
              >
                Refining Itineraries
              </TabsTrigger>
              <TabsTrigger 
                value="premium" 
                className="w-full text-left justify-start text-blue-800 data-[state=active]:text-black data-[state=active]:bg-white font-medium"
              >
                Premium Features
              </TabsTrigger>
              <TabsTrigger 
                value="sharing" 
                className="w-full text-left justify-start text-blue-800 data-[state=active]:text-black data-[state=active]:bg-white font-medium"
              >
                Sharing & Collab
              </TabsTrigger>
              <TabsTrigger 
                value="faq" 
                className="w-full text-left justify-start text-blue-800 data-[state=active]:text-black data-[state=active]:bg-white font-medium"
              >
                FAQ
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto md:pr-4">
              <TabsContent value="getting-started">
                <GuideSection title="Getting Started: Your First Journey" icon={Compass}>
                    <GuideCard title="Step 1: Choose Your Adventure">
                        <p>From the home page, select the type of trip you want to plan, like <Badge variant="secondary">Road Trip</Badge> or <Badge variant="secondary">Ski Adventure</Badge>.</p>
                    </GuideCard>
                    <GuideCard title="Step 2: Provide Your Details">
                        <p>Fill out the planning form. The more detail you provide (destination, budget, preferences), the better your initial itinerary will be.</p>
                    </GuideCard>
                    <GuideCard title="Step 3: Let the AI Work its Magic">
                        <p>Click <Badge variant="default">Create Journey</Badge>. Our AI will generate your initial, day-by-day itinerary proposal. This can take up to a minute.</p>
                    </GuideCard>
                    <GuideCard title="Step 4: Refine & Confirm">
                        <p>Once your itinerary is generated, use the AI refinement tools to tweak it to perfection. When you're happy, click the <Badge className="bg-blue-600 text-white">Confirm</Badge> button to lock it in!</p>
                    </GuideCard>
                </GuideSection>
              </TabsContent>
              <TabsContent value="creating-trips">
                <GuideSection title="Creating the Perfect Trip" icon={MousePointerClick}>
                    <GuideCard title="The Planning Form">
                        <p>This is where you tell our AI what you're looking for. Key fields include:</p>
                        <ul>
                            <li><strong>Destination:</strong> The main place you want to go. For road trips, this is your final stop.</li>
                            <li><strong>Origin:</strong> Where your trip starts. Crucial for road trips!</li>
                            <li><strong>Duration:</strong> How many nights your trip will be.</li>
                            <li><strong>Preferences:</strong> Select your interests like "History" or "Nightlife". This heavily influences the AI's suggestions.</li>
                        </ul>
                    </GuideCard>
                    <Tip>
                      For road trips with multiple stops, you can list them in the "Waypoints" field. The AI will build your route around them.
                    </Tip>
                </GuideSection>
              </TabsContent>
              <TabsContent value="refining">
                <GuideSection title="Refining with AI" icon={Sparkles}>
                    <GuideCard title="Refine Entire Journey">
                        <p>Use the <Badge variant="outline">Refine Journey</Badge> button to make broad changes to the entire trip. This generates a completely new proposal in a new tab.</p>
                        <p><strong>Example prompt:</strong> "Make this trip more budget-friendly and add more activities for kids."</p>
                    </GuideCard>
                    <GuideCard title="Refine a Single Day">
                        <p>On each day card, click the <Badge variant="outline" className="text-xs"><Wand2 className="w-3 h-3 inline-block mr-1"/>Refine</Badge> button to change just that day's plan.</p>
                         <p><strong>Example prompt:</strong> "Find a romantic, high-end restaurant for dinner tonight."</p>
                    </GuideCard>
                     <GuideCard title="I Feel Lucky Button">
                        <p>Don't know what you want? Click the <Badge variant="outline" className="text-xs"><Sparkles className="w-3 h-3 inline-block mr-1"/>Lucky</Badge> button on a day card for the AI to suggest exciting and adventurous additions automatically.</p>
                    </GuideCard>
                    <Tip>
                      The AI is powerful! Be specific. Instead of "more food," try "find authentic taco places loved by locals." The more detail, the better the result.
                    </Tip>
                </GuideSection>
              </TabsContent>
              <TabsContent value="premium">
                 <GuideSection title="Unlocking Premium Features" icon={Crown}>
                    <GuideCard title="Unlimited Journeys">
                        <p>Free users are limited to 1 journey. As a Premium member, you can create and save an unlimited number of trip plans.</p>
                    </GuideCard>
                    <GuideCard title="Destination & International Travel">
                        <p>Unlock the <Badge variant="secondary">Destination</Badge> travel type to plan complex international trips and vacations that require flights.</p>
                    </GuideCard>
                    <GuideCard title="Share & Collaborate">
                        <p>Share your itinerary with other premium users. They can view your plans, making group trip planning a breeze.</p>
                        <p>Click the <Badge variant="outline"><Share2 className="w-3 h-3 inline-block mr-1"/>Share</Badge> button on your itinerary page.</p>
                    </GuideCard>
                    <GuideCard title="Download as PDF">
                        <p>Take your itinerary offline. Click the <Badge variant="outline"><FileDown className="w-3 h-3 inline-block mr-1"/>Download</Badge> button to generate a beautiful, print-ready PDF of your trip.</p>
                    </GuideCard>
                 </GuideSection>
              </TabsContent>
              <TabsContent value="sharing">
                 <GuideSection title="Sharing & Collaboration" icon={Share2}>
                    <GuideCard title="How it Works">
                        <p>Premium users can share their itineraries with other premium users.</p>
                        <ol className="list-decimal list-inside">
                            <li>On your journey details page, click the <Badge variant="outline"><Share2 className="w-3 h-3 inline-block mr-1"/>Share</Badge> button.</li>
                            <li>Enter the email address of the person you want to share with and send the invite.</li>
                            <li>They will receive a notification and can accept the invitation.</li>
                            <li>Once accepted, they can view your itinerary from their "My Journeys" page.</li>
                        </ol>
                    </GuideCard>
                    <Alert>
                        <AlertTitle>Read-Only Access</AlertTitle>
                        <AlertDescription>
                            Currently, sharing is for viewing purposes only. Full collaboration features are coming soon!
                        </AlertDescription>
                    </Alert>
                 </GuideSection>
              </TabsContent>
              <TabsContent value="faq">
                <GuideSection title="Frequently Asked Questions" icon={HelpCircle}>
                    <GuideCard title="Why is my itinerary taking a long time to generate?">
                        <p>For complex trips, the AI needs time to research destinations, check routes, and find recommendations. It can sometimes take up to 60 seconds. We appreciate your patience!</p>
                    </GuideCard>
                     <GuideCard title="The AI didn't listen to my refinement. What can I do?">
                        <p>Try being more specific and directive in your prompt. Instead of "I don't like this," say "Replace the museum visit with a 2-hour hike in a nearby park."</p>
                    </GuideCard>
                    <GuideCard title="How is my data used?">
                        <p>We are committed to your privacy. Your trip details are used solely to generate and refine your itineraries. Please see our Privacy Policy for more information.</p>
                    </GuideCard>
                </GuideSection>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
