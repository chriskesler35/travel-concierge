
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ship, Train, Calendar, Clock, DollarSign, ExternalLink, CheckCircle, MapPin, Info, Route } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PackagedTripCard({ proposal, onConfirm, isConfirming, isJourneyConfirmed }) {
  const Icon = proposal.type === 'train' ? Train : (proposal.type === 'cruising' ? Ship : Route);
  const tripTypeName = proposal.type === 'train' ? 'Train Trip' : (proposal.type === 'cruising' ? 'Cruise' : 'Trip');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 leading-tight">
                  {proposal.name || proposal.proposal_name}
                </CardTitle>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  {proposal.operator || proposal.route_summary}
                </p>
              </div>
            </div>
            {isJourneyConfirmed && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Confirmed
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow pt-0 flex flex-col">
          <div className="space-y-3 flex-grow">
            {proposal.ports_of_call && proposal.ports_of_call.length > 0 ? (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <span className="text-sm text-slate-700 font-semibold">Ports of Call:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proposal.ports_of_call.map((port, index) => (
                      <span key={index} className="text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-full">{port}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : proposal.route_map && proposal.route_map.length > 0 && (
              <div className="flex items-start gap-2">
                <Route className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <span className="text-sm text-slate-700 font-semibold">Route:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proposal.route_map.join(' → ')}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm text-slate-700">
                <strong>Duration:</strong> {proposal.duration_days} days
              </span>
            </div>
            
            {proposal.price_estimate_usd && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm text-slate-700">
                  <strong>Price From:</strong> ${proposal.price_estimate_usd?.toLocaleString()} per person
                </span>
              </div>
            )}
            
            {proposal.cruise_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-slate-700">
                  <strong>Cruise Date:</strong> {proposal.cruise_date}
                </span>
              </div>
            )}

            {proposal.data_source && (
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500">
                  <strong>Source:</strong> {proposal.data_source}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6">
            <Button 
              variant="outline" 
              asChild 
              className="w-full sm:w-auto"
              onClick={(e) => {
                // Prevent default if no link
                if (!proposal.booking_link) {
                  e.preventDefault();
                  return;
                }
              }}
            >
              <a 
                href={proposal.booking_link || '#'} 
                target={proposal.booking_link ? "_blank" : undefined}
                rel={proposal.booking_link ? "noopener noreferrer" : undefined}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Details
              </a>
            </Button>
            {!isJourneyConfirmed && (
              <Button 
                onClick={() => onConfirm(proposal)} 
                disabled={isConfirming} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full sm:w-auto"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isConfirming ? 'Confirming...' : `Select This ${tripTypeName}`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
