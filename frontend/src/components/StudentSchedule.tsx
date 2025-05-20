import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Button,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { format, parseISO, isSameDay, isSameMonth } from 'date-fns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarningIcon from '@mui/icons-material/Warning';
import { Exam } from '../types';
import { checkForConflicts, exportToPDF, exportToCalendar } from '../services/exportService';

interface StudentScheduleProps {
  exams: Exam[];
  username: string;
}

// Add a wrapper for Grid to fix TypeScript errors
const GridItem = (props: any) => <Grid {...props} />;

const StudentSchedule: React.FC<StudentScheduleProps> = ({ exams, username }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [conflicts, setConflicts] = useState<{ examA: Exam; examB: Exam }[]>([]);
  const [hasConflicts, setHasConflicts] = useState<boolean>(false);
  
  // Format functions
  const formatDate = (dateString: string) => format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
  const formatTime = (dateString: string) => format(parseISO(dateString), 'h:mm a');
  
  // Check for conflicts
  useEffect(() => {
    const { hasConflicts, conflicts } = checkForConflicts(exams);
    setHasConflicts(hasConflicts);
    setConflicts(conflicts);
  }, [exams]);
  
  // Group exams by day for display
  const examsByDay: Record<string, Exam[]> = exams.reduce((acc, exam) => {
    const dayStr = format(parseISO(exam.startTime), 'yyyy-MM-dd');
    if (!acc[dayStr]) {
      acc[dayStr] = [];
    }
    acc[dayStr].push(exam);
    return acc;
  }, {} as Record<string, Exam[]>);
  
  // Sort days in ascending order
  const sortedDays = Object.keys(examsByDay).sort();
  
  // Calculate if the exam is today, upcoming or past
  const getExamStatus = (examDate: string) => {
    const today = new Date();
    const examDay = parseISO(examDate);
    
    if (isSameDay(today, examDay)) {
      return 'today';
    } else if (examDay > today) {
      return 'upcoming';
    } else {
      return 'past';
    }
  };
  
  // Handle export to PDF
  const handleExportToPDF = () => {
    try {
      exportToPDF(exams, `${username}-exam-schedule.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };
  
  // Handle export to calendar
  const handleExportToCalendar = () => {
    try {
      exportToCalendar(exams, `${username}-exam-schedule.ics`);
    } catch (error) {
      console.error('Error exporting to calendar:', error);
    }
  };
  
  // Check if an exam has a conflict
  const examHasConflict = (examId: string) => {
    return conflicts.some(
      conflict => conflict.examA.id === examId || conflict.examB.id === examId
    );
  };
  
  // Get color for exam status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'RESCHEDULED':
        return 'warning';
      default:
        return 'info';
    }
  };
  
  return (
    <Box>
      {/* Header & Export Options */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <GridItem item xs={12} md={6}>
            <Typography variant="h6">Your Exam Schedule</Typography>
            {hasConflicts && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <AlertTitle>Schedule Conflicts Detected</AlertTitle>
                <Typography variant="body2">
                  You have {conflicts.length} scheduling conflicts:
                </Typography>
                <List dense>
                  {conflicts.map((conflict, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${conflict.examA.course?.code} and ${conflict.examB.course?.code}`}
                        secondary={`Both scheduled on ${format(parseISO(conflict.examA.startTime), 'MMM dd')} at ${formatTime(conflict.examA.startTime)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </GridItem>
          <GridItem item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button variant="outlined" onClick={handleExportToPDF}>
                Export as PDF
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<CalendarTodayIcon />}
                onClick={handleExportToCalendar}
              >
                Add to Calendar
              </Button>
            </Box>
          </GridItem>
        </Grid>
      </Paper>

      {/* Exams by Day */}
      {sortedDays.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No exams scheduled yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Check back later for your exam schedule or contact your instructor.
          </Typography>
        </Paper>
      ) : (
        sortedDays.map(day => {
          const examStatus = getExamStatus(day);
          let bgColor = theme.palette.background.paper;
          let borderColor = theme.palette.divider;
          
          // Highlight today and upcoming exams differently
          if (examStatus === 'today') {
            bgColor = theme.palette.mode === 'dark' 
              ? theme.palette.primary.dark 
              : theme.palette.primary.light;
            borderColor = theme.palette.primary.main;
          }
          
          return (
            <Paper 
              key={day}
              elevation={examStatus === 'today' ? 3 : 1}
              sx={{ 
                mb: 3, 
                p: 2,
                backgroundColor: bgColor,
                borderLeft: `4px solid ${borderColor}`,
                position: 'relative',
              }}
            >
              {examStatus === 'today' && (
                <Chip 
                  label="TODAY" 
                  color="primary" 
                  size="small" 
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8
                  }} 
                />
              )}
              
              <Typography variant="h6" sx={{ mb: 2 }}>
                {formatDate(day)}
              </Typography>
              
              <Grid container spacing={2}>
                {examsByDay[day]
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map(exam => {
                    const hasConflict = examHasConflict(exam.id);
                    
                    return (
                      <GridItem item xs={12} md={6} lg={4} key={exam.id}>
                        <Paper
                          elevation={hasConflict ? 3 : 1}
                          sx={{
                            p: 2,
                            borderLeft: `4px solid ${
                              hasConflict 
                                ? theme.palette.warning.main 
                                : theme.palette.primary.main
                            }`,
                            backgroundColor: hasConflict 
                              ? theme.palette.mode === 'dark'
                                ? theme.palette.warning.dark 
                                : theme.palette.warning.light
                              : theme.palette.background.paper,
                            '&:hover': {
                              boxShadow: theme.shadows[4]
                            }
                          }}
                        >
                          {hasConflict && (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                mb: 1, 
                                color: theme.palette.warning.main
                              }}
                            >
                              <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="caption" fontWeight="bold">
                                Scheduling Conflict!
                              </Typography>
                            </Box>
                          )}
                          
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {exam.course?.code}
                          </Typography>
                          
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            {exam.course?.name}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {exam.room ? `${exam.room.building}, Room ${exam.room.number}` : 'TBD'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mt: 2 }}>
                            <Chip 
                              label={exam.status} 
                              color={getStatusColor(exam.status) as any}
                              size="small" 
                            />
                          </Box>
                        </Paper>
                      </GridItem>
                    );
                  })}
              </Grid>
            </Paper>
          );
        })
      )}
      
      {/* Countdown to next exam */}
      {exams.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <NextExamCountdown exams={exams} />
        </Box>
      )}
    </Box>
  );
};

// Helper component for countdown to next exam
const NextExamCountdown: React.FC<{ exams: Exam[] }> = ({ exams }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  
  const [nextExam, setNextExam] = useState<Exam | null>(null);
  
  useEffect(() => {
    // Find the next upcoming exam
    const now = new Date();
    const upcomingExams = exams
      .filter(exam => new Date(exam.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    if (upcomingExams.length === 0) {
      setNextExam(null);
      return;
    }
    
    setNextExam(upcomingExams[0]);
    
    // Update countdown timer
    const timer = setInterval(() => {
      const examDate = new Date(upcomingExams[0].startTime);
      const now = new Date();
      const diff = examDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(timer);
        setTimeRemaining(null);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [exams]);
  
  if (!nextExam || !timeRemaining) {
    return null;
  }
  
  return (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Next Exam: {nextExam.course?.code}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {format(parseISO(nextExam.startTime), 'EEEE, MMMM d, yyyy')} at {format(parseISO(nextExam.startTime), 'h:mm a')}
      </Typography>
      
      <Grid container spacing={2} justifyContent="center">
        <GridItem item>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4">{timeRemaining.days}</Typography>
            <Typography variant="caption">Days</Typography>
          </Box>
        </GridItem>
        <GridItem item>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4">{timeRemaining.hours}</Typography>
            <Typography variant="caption">Hours</Typography>
          </Box>
        </GridItem>
        <GridItem item>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4">{timeRemaining.minutes}</Typography>
            <Typography variant="caption">Minutes</Typography>
          </Box>
        </GridItem>
        <GridItem item>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4">{timeRemaining.seconds}</Typography>
            <Typography variant="caption">Seconds</Typography>
          </Box>
        </GridItem>
      </Grid>
    </Paper>
  );
};

export default StudentSchedule; 