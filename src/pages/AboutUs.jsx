
import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutUs() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-100 min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            About Travel Concierge
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Crafting unforgettable journeys, one personalized itinerary at a time.
          </p>
        </motion.div>

        {/* Team Photo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative w-full h-64 sm:h-80 rounded-xl shadow-2xl overflow-hidden mb-16"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a27bc9b10_IMG_6787.jpg" 
            alt="Travel Concierge Team" 
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Core Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Our Story</h2>
            <div className="text-slate-600 leading-relaxed space-y-4">
              <p>
                The Travel Concierge was born from a simple passion: the love of exploration and discovery. For years, we’ve cherished the experience of discovering new places, whether it's a bustling city or a serene natural landscape. While we have our favorite local haunts and cherished destinations, the thrill of finding a new, unforgettable spot is what truly inspires us.
              </p>
              <p>
                Our perfect trip is about more than just the destination. It's about finding hidden gems—unique shops, local distilleries, craft breweries, cozy coffee houses, and amazing restaurants that define a place's character. It’s this combination of incredible sights and vibrant local culture that makes any journey truly memorable.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Why The Travel Concierge?</h2>
            <div className="text-slate-600 leading-relaxed space-y-4">
               <p>
                With our backgrounds in technology and a growing interest in what AI could do, we realized we could use our passion to solve a common problem. We were constantly searching for new places that fit our specific preferences, and we knew others were too. What if we could create a tool that made this process easier, not just for us, but for anyone looking for their next great adventure?
              </p>
              <p>
                And so, The Travel Concierge was born. This application is our first step in a journey to harness the power of AI to help fellow travelers find their next great experience. It’s a project we’re proud of, built on a love for travel and a desire to share our findings with a wider community.
              </p>
              <p>
                We're excited to offer this initial release to help you discover a destination that perfectly matches your preferences. We hope you enjoy using it as much as we enjoyed building it!
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* "What We Do" Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
            <Card>
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                       <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="mt-4">Personalized Planning</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500">
                        We use advanced AI to tailor every detail of your trip to your unique preferences and style.
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                       <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="mt-4">For Every Traveler</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-slate-500">
                        Whether it's a solo road trip or a luxury international getaway, we have a plan for you.
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                       <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="mt-4">Continuous Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-slate-500">
                        Your feedback drives our innovation as we constantly refine our planning process.
                    </p>
                </CardContent>
            </Card>
        </div>
        
      </div>
    </div>
  );
}
