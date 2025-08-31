
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

export default function DayEditor({ 
  day, 
  isExpanded, 
  onToggle, 
  onRefine,
  onTimeSlotRefine
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mb-4"
    >
      <Card className="overflow-hidden bg-white/80 shadow-md border-slate-200">
        <CardHeader 
          className="flex flex-row items-center justify-between p-4 cursor-pointer bg-slate-50/70"
          onClick={() => onToggle(day.id)}
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-100 text-blue-800 rounded-lg font-bold">
              <span className="text-xs">DAY</span>
              <span className="text-xl">{day.day}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{day.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-1">{day.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRefine(day);
              }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Edit className="w-3 h-3 mr-2" />
              Refine Day
            </Button>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </CardHeader>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.section
              key="content"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: "auto" },
                collapsed: { opacity: 0, height: 0 }
              }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <CardContent className="p-4 sm:p-6 border-t border-slate-200">
                <div className="prose prose-sm max-w-none prose-a:text-blue-600 hover:prose-a:text-blue-700">
                    <ReactMarkdown>{day.description}</ReactMarkdown>
                </div>
                
                <div className="mt-6 space-y-6">
                  {day.activities?.map((activity, index) => (
                    <div key={index} className="relative pl-8">
                      <div className="absolute left-0 top-1 flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full text-slate-600 font-semibold text-xs">
                        {activity.time.substring(0, 1)}
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800">{activity.name}</h4>
                          <div className="mt-1 prose prose-sm max-w-none text-slate-600 prose-a:text-blue-600 hover:prose-a:text-blue-700">
                            <ReactMarkdown>{activity.description}</ReactMarkdown>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 flex-shrink-0 text-slate-500 hover:bg-slate-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTimeSlotRefine(day, activity.time, activity.name, activity.description);
                          }}
                          title={`Refine ${activity.time}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </motion.section>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
