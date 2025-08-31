
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Sparkles, Plane, Hotel, Utensils, Map } from 'lucide-react';

const icons = [
  { icon: <Plane className="w-8 h-8 text-white" />, label: "Booking Flights..." },
  { icon: <Hotel className="w-8 h-8 text-white" />, label: "Finding Hotels..." },
  { icon: <Utensils className="w-8 h-8 text-white" />, label: "Picking Restaurants..." },
  { icon: <Map className="w-8 h-8 text-white" />, label: "Mapping Route..." },
];

export default function AIProgressModal({ 
  open, 
  progress, 
  currentStep,
  title = "Crafting Your Journey...",
  description = "Our AI is curating the perfect experience for you. This might take a moment."
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-transparent border-0 shadow-none flex items-center justify-center p-0" hideCloseButton>
        <div className="w-full max-w-sm text-center">
          <motion.div
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          
          <DialogHeader className="text-white">
            <DialogTitle className="text-2xl font-bold mb-2">{title}</DialogTitle>
            <DialogDescription className="text-slate-300">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full bg-white/20 rounded-full h-2.5 mt-6 overflow-hidden">
            {typeof progress === 'number' ? (
              <motion.div
                className="bg-white h-2.5 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            ) : (
              <motion.div
                className="bg-white h-full"
                style={{ width: '40%' }}
                animate={{ x: ['-100%', '250%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
          <p className="text-white text-sm mt-2">{currentStep}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
