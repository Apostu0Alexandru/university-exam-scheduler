import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid as MuiGrid,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewListIcon from '@mui/icons-material/ViewList';
import TableChartIcon from '@mui/icons-material/TableChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useUser } from '@clerk/clerk-react';
import Layout from '../components/Layout';
import { Exam, Course } from '../types';
import { getExamsForUser, getAllExams, getExamsByCourse, getAllCourses } from '../services/api';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import DownloadIcon from '@mui/icons-material/Download';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AdminScheduler from '../components/AdminScheduler';
import { exportToPDF, exportToCalendar, checkForConflicts } from '../services/exportService';
import StudentSchedule from '../components/StudentSchedule';

// Grid component wrapper to fix TypeScript errors
const Grid = (props: any) => <MuiGrid {...props} />;

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`schedule-tabpanel-${index}`}
      aria-labelledby={`schedule-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Format functions
const formatDate = (dateString: string) => format(parseISO(dateString), 'MMM dd, yyyy');
const formatTime = (dateString: string) => format(parseISO(dateString), 'h:mm a');
const formatDateTime = (dateString: string) => format(parseISO(dateString), 'MMM dd, yyyy - h:mm a');
const formatDayOfWeek = (dateString: string) => format(parseISO(dateString), 'EEEE');

const formatICalDate = (date: Date): string => {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
};

const generateICalEvent = (exam: Exam): string => {
  const start = parseISO(exam.startTime);
  const end = parseISO(exam.endTime);
  
  return [
    'BEGIN:VEVENT',
    `UID:exam-${exam.id}@university-exam-scheduler.com`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(start)}`,
    `DTEND:${formatICalDate(end)}`,
    `SUMMARY:${exam.course?.code} Exam`,
    `DESCRIPTION:Exam for ${exam.course?.name}`,
    `LOCATION:${exam.room ? `${exam.room.building}, Room ${exam.room.number}` : 'TBD'}`,
    'END:VEVENT'
  ].join('\r\n');
};

const generateICalFile = (exams: Exam[]): string => {
  const calendarEvents = exams.map(generateICalEvent).join('\r\n');
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//University Exam Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    calendarEvents,
    'END:VCALENDAR'
  ].join('\r\n');
};

const SchedulePage: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [conflicts, setConflicts] = useState<{ examA: Exam; examB: Exam }[]>([]);
  const [hasConflicts, setHasConflicts] = useState<boolean>(false);

  // Fetch exams and courses data
  useEffect(() => {
    if (!isUserLoaded) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determine if user is admin
        const isAdminUser = user?.publicMetadata?.role === 'ADMIN';
        setIsAdmin(isAdminUser);
        
        // Fetch exams based on user role
        let examsResponse;
        if (isAdminUser) {
          examsResponse = await getAllExams();
        } else if (user) {
          examsResponse = await getExamsForUser(user.id);
        } else {
          throw new Error('User not authenticated');
        }
        
        // Fetch courses for filtering
        const coursesResponse = await getAllCourses();
        
        setExams(examsResponse.data);
        setFilteredExams(examsResponse.data);
        setCourses(coursesResponse.data || []);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching schedule data:', err);
        setError(err.message || 'Failed to fetch schedule data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isUserLoaded]);

  // Filter exams when filters change
  useEffect(() => {
    let result = [...exams];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(exam => 
        exam.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.course?.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter(exam => exam.status === statusFilter);
    }

    // Apply course filter
    if (selectedCourse) {
      result = result.filter(exam => exam.courseId === selectedCourse);
    }

    // Sort by start time (earliest first)
    result.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    setFilteredExams(result);
  }, [searchTerm, statusFilter, selectedCourse, exams]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'primary';
      case 'CANCELLED':
        return 'error';
      case 'COMPLETED':
        return 'success';
      case 'RESCHEDULED':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Refresh the exam data
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = isAdmin 
        ? await getAllExams()
        : await getExamsForUser(user?.id || '');
      
      setExams(response.data);
      setFilteredExams(response.data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh exam schedule');
      setIsLoading(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSelectedCourse('');
  };

  // Generate a weekly calendar view
  const renderCalendarView = () => {
    if (filteredExams.length === 0) {
      return (
        <Alert severity="info">
          No exams found for the selected filters.
        </Alert>
      );
    }

    // Find the earliest exam date to set as the start of the week
    const earliestExam = filteredExams.reduce((earliest, exam) => {
      return new Date(exam.startTime) < new Date(earliest.startTime) ? exam : earliest;
    }, filteredExams[0]);

    // Start the week on the Monday before the earliest exam
    const startDate = startOfWeek(parseISO(earliestExam.startTime), { weekStartsOn: 1 });
    
    // Create array of days for the week
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '14%' }}>Time</TableCell>
              {days.map((day, index) => (
                <TableCell key={index} align="center" sx={{ fontWeight: 'bold', width: '12%' }}>
                  {format(day, 'EEE')}<br />
                  {format(day, 'MMM dd')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Morning Slot */}
            <TableRow>
              <TableCell>Morning<br/>(8:00 AM - 12:00 PM)</TableCell>
              {days.map((day, index) => (
                <TableCell key={index} align="center">
                  {filteredExams
                    .filter(exam => {
                      const examDate = parseISO(exam.startTime);
                      const examHour = examDate.getHours();
                      return isSameDay(examDate, day) && examHour >= 8 && examHour < 12;
                    })
                    .map(exam => (
                      <Chip 
                        key={exam.id}
                        label={`${exam.course?.code}: ${formatTime(exam.startTime)}`}
                        color={getStatusColor(exam.status) as any}
                        sx={{ m: 0.5, maxWidth: '100%' }}
                      />
                    ))}
                </TableCell>
              ))}
            </TableRow>
            {/* Afternoon Slot */}
            <TableRow>
              <TableCell>Afternoon<br/>(12:00 PM - 5:00 PM)</TableCell>
              {days.map((day, index) => (
                <TableCell key={index} align="center">
                  {filteredExams
                    .filter(exam => {
                      const examDate = parseISO(exam.startTime);
                      const examHour = examDate.getHours();
                      return isSameDay(examDate, day) && examHour >= 12 && examHour < 17;
                    })
                    .map(exam => (
                      <Chip 
                        key={exam.id}
                        label={`${exam.course?.code}: ${formatTime(exam.startTime)}`}
                        color={getStatusColor(exam.status) as any}
                        sx={{ m: 0.5, maxWidth: '100%' }}
                      />
                    ))}
                </TableCell>
              ))}
            </TableRow>
            {/* Evening Slot */}
            <TableRow>
              <TableCell>Evening<br/>(5:00 PM - 10:00 PM)</TableCell>
              {days.map((day, index) => (
                <TableCell key={index} align="center">
                  {filteredExams
                    .filter(exam => {
                      const examDate = parseISO(exam.startTime);
                      const examHour = examDate.getHours();
                      return isSameDay(examDate, day) && examHour >= 17 && examHour < 22;
                    })
                    .map(exam => (
                      <Chip 
                        key={exam.id}
                        label={`${exam.course?.code}: ${formatTime(exam.startTime)}`}
                        color={getStatusColor(exam.status) as any}
                        sx={{ m: 0.5, maxWidth: '100%' }}
                      />
                    ))}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Update useEffect to use imported checkForConflicts
  useEffect(() => {
    const { hasConflicts, conflicts } = checkForConflicts(filteredExams);
    setHasConflicts(hasConflicts);
    setConflicts(conflicts);
  }, [filteredExams]);

  // Add this UI for conflict alerts
  const renderConflictWarning = () => {
    if (!hasConflicts) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No scheduling conflicts detected.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>Schedule Conflicts Detected</AlertTitle>
        <Typography variant="body2">
          There are {conflicts.length} scheduling conflicts in the current view:
        </Typography>
        <List dense>
          {conflicts.map((conflict, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`${conflict.examA.course?.code} and ${conflict.examB.course?.code}`}
                secondary={`Both scheduled on ${formatDate(conflict.examA.startTime)} at ${formatTime(conflict.examA.startTime)}`}
              />
            </ListItem>
          ))}
        </List>
      </Alert>
    );
  };

  // Replace the existing exportToPDF, exportToCalendar and checkForConflicts functions with these
  const handleExportToPDF = () => {
    try {
      exportToPDF(filteredExams);
      
      // Show success message if needed
      // setSnackbar({ open: true, message: 'PDF exported successfully', severity: 'success' });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const handleExportToCalendar = () => {
    try {
      exportToCalendar(filteredExams);
      
      // Show success message if needed
      // setSnackbar({ open: true, message: 'Calendar exported successfully', severity: 'success' });
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      setError('Failed to generate calendar file. Please try again.');
    }
  };

  return (
    <Layout title="Exam Schedule">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Exam Schedule
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your upcoming exams
          </Typography>
        </Box>

        {/* Filter Controls */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by course name or code"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  <MenuItem value="RESCHEDULED">Rescheduled</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="course-filter-label">Course</InputLabel>
                <Select
                  labelId="course-filter-label"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  label="Course"
                >
                  <MenuItem value="">All Courses</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.code}: {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />} 
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<FilterListIcon />} 
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Export Options */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Export Options</Typography>
              {renderConflictWarning()}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportToPDF}
                >
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
            </Grid>
          </Grid>
        </Paper>

        {/* View Selection Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="schedule view options"
            variant="fullWidth"
          >
            <Tab icon={<ViewListIcon />} label="List View" id="schedule-tab-0" />
            <Tab icon={<CalendarTodayIcon />} label="Calendar View" id="schedule-tab-1" />
            {isAdmin && <Tab icon={<TableChartIcon />} label="Admin Table" id="schedule-tab-2" />}
          </Tabs>
        </Paper>

        {/* Loading and Error States */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* List View */}
            <TabPanel value={tabValue} index={0}>
              {isAdmin ? (
                <List>
                  {filteredExams.map((exam) => (
                    <ListItem
                      key={exam.id}
                      divider
                      sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="bold" mr={1}>
                              {exam.course?.code}
                            </Typography>
                            <Chip 
                              label={exam.status} 
                              color={getStatusColor(exam.status) as any}
                              size="small" 
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={exam.course?.name}
                        sx={{ flex: 1, mr: 2 }}
                      />
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', md: 'row' },
                          alignItems: { xs: 'flex-start', md: 'center' },
                          gap: 2,
                          mt: { xs: 1, sm: 0 },
                          width: { xs: '100%', sm: 'auto' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(exam.startTime)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOnIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {exam.room ? `${exam.room.building}, Room ${exam.room.number}` : 'TBD'}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <StudentSchedule exams={filteredExams} username={user?.firstName || 'Student'} />
              )}
            </TabPanel>

            {/* Calendar View */}
            <TabPanel value={tabValue} index={1}>
              {renderCalendarView()}
            </TabPanel>

            {/* Admin Table View */}
            {isAdmin && (
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Admin Schedule Management
                </Typography>
                
                <AdminScheduler 
                  exams={exams} 
                  courses={courses} 
                  onExamChange={handleRefresh} 
                />
              </TabPanel>
            )}
          </>
        )}
      </Container>
    </Layout>
  );
};

export default SchedulePage;
