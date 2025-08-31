
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MapPin,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Wand2,
  Trash2,
  Sparkles,
  Loader2,
  GripVertical
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

export default function DailyItinerary({
  day,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  onRefine,
  onRefineTimeSlot,
  onDelete,
  dragHandleProps,
  isFixedDay = false,
  isConfirmed = false,
  isDragging = false,
  isRefining = false,
  allowRefinement = true,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDay, setEditedDay] = useState(day);
  const [refiningTimeSlot, setRefiningTimeSlot] = useState(null);

  const handleSave = () => {
    onEdit(editedDay);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDay(day);
    setIsEditing(false);
  };

  const handleTimeSlotRefine = (timeSlot, activityName, activityDescription) => {
    setRefiningTimeSlot(timeSlot);
    onRefineTimeSlot(day, timeSlot, activityName, activityDescription);
  };

  React.useEffect(() => {
    if (!isRefining) {
      setRefiningTimeSlot(null);
    }
  }, [isRefining]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.toLowerCase().includes('morning')) return '🌅 Morning';
    if (timeStr.toLowerCase().includes('lunch')) return '🍽️ Lunch';
    if (timeStr.toLowerCase().includes('afternoon')) return '☀️ Afternoon';
    if (timeStr.toLowerCase().includes('dinner')) return '🌙 Dinner';
    if (timeStr.toLowerCase().includes('additional')) return '💡 Additional';
    return timeStr;
  };

  const getActivityIcon = (timeStr) => {
    if (!timeStr) return '📍';
    if (timeStr.toLowerCase().includes('morning')) return '🌅';
    if (timeStr.toLowerCase().includes('lunch')) return '🍽️';
    if (timeStr.toLowerCase().includes('afternoon')) return '☀️';
    if (timeStr.toLowerCase().includes('dinner')) return '🌙';
    if (timeStr.toLowerCase().includes('additional')) return '💡';
    return '📍';
  };

  const LinkRenderer = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'
      }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`mb-4 ${isDragging ? 'z-50' : ''}`}
    >
      <Card className={`overflow-hidden transition-all duration-200 ${
        isDragging ? 'shadow-2xl bg-blue-50 border-blue-300' : 'shadow-lg hover:shadow-xl bg-white'
      }`}>
        <CardHeader className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 ${
          isDragging ? 'from-blue-600 to-purple-700' : ''
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {!isFixedDay && !isConfirmed && (
                <div
                  {...dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-2 rounded hover:bg-white/20 transition-colors touch-manipulation"
                  style={{
                    minWidth: '40px',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <GripVertical className="w-5 h-5" />
                </div>
              )}

              <div>
                <CardTitle className="text-lg sm:text-xl">
                  {isEditing ? (
                    <Input
                      value={editedDay.title}
                      onChange={(e) => setEditedDay({...editedDay, title: e.target.value})}
                      className="text-white bg-white/20 border-white/30 placeholder:text-white/70"
                      placeholder="Day title"
                    />
                  ) : (
                    `Day ${day.day}: ${day.title}`
                  )}
                </CardTitle>

                {day.due_date && (
                  <div className="flex items-center gap-1 text-blue-100 text-sm mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(day.due_date), 'MMM d')}</span>
                  </div>
                )}
              </div>
            </div>

            {!isFixedDay && !isDragging && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpand(day.id)}
                  className="text-white hover:bg-white/20 flex-shrink-0"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span className="ml-2 hidden md:inline">Collapse</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span className="ml-2 hidden md:inline">Expand</span>
                    </>
                  )}
                </Button>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-4">
              {allowRefinement && !isConfirmed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRefine(day)}
                  disabled={isRefining}
                  className="text-white hover:bg-white/20"
                  title="Refine this day"
                >
                  {isRefining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  <span className="ml-2 hidden md:inline">Refine Day</span>
                </Button>
              )}

              {!isFixedDay && !isConfirmed && (
                <>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-white hover:bg-white/20"
                      title="Edit this day"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="ml-2 hidden md:inline">Edit</span>
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="text-white bg-green-500/90 hover:bg-green-500"
                        title="Save changes"
                      >
                        <Save className="w-4 h-4" />
                        <span className="ml-2 hidden md:inline">Save</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-white hover:bg-white/20"
                        title="Cancel editing"
                      >
                        <X className="w-4 h-4" />
                        <span className="ml-2 hidden md:inline">Cancel</span>
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    onClick={() => onDelete(day)}
                    className="text-white bg-red-500/90 hover:bg-red-500"
                    title="Delete this day"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="ml-2 hidden md:inline">Delete</span>
                  </Button>
                </>
              )}
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
                      <Textarea
                        value={editedDay.description}
                        onChange={(e) => setEditedDay({...editedDay, description: e.target.value})}
                        rows={3}
                        placeholder="Brief description of the day's theme..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {day.description && (
                      <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                        <ReactMarkdown
                          className="text-slate-600 prose prose-sm max-w-none markdown-content"
                          components={{ a: LinkRenderer }}
                        >
                          {day.description}
                        </ReactMarkdown>
                      </div>
                    )}

                    <div className="space-y-4">
                      {day.activities?.map((activity, activityIndex) => (
                        <div key={activityIndex} className="flex gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group">
                          <div className="text-2xl flex-shrink-0 mt-1">
                            {getActivityIcon(activity.time)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-slate-900 text-sm">
                                {formatTime(activity.time)} - {activity.name}
                              </h4>
                              {allowRefinement && !isConfirmed && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleTimeSlotRefine(activity.time, activity.name, activity.description)}
                                  disabled={isRefining}
                                  title={`Refine ${activity.time} activities`}
                                >
                                  {isRefining && refiningTimeSlot === activity.time ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                            {activity.description && (
                              <ReactMarkdown
                                className="text-slate-600 prose prose-sm max-w-none markdown-content"
                                components={{ a: LinkRenderer }}
                              >
                                {activity.description}
                              </ReactMarkdown>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
