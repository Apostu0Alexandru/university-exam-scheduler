import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid as MuiGrid, 
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useUser } from '@clerk/clerk-react';
import Layout from '../components/Layout';
import StudyRecommendations from '../components/StudyRecommendations';
import CourseEnrollment from '../components/CourseEnrollment';
import LearningPreferences from '../components/LearningPreferences';
import { Exam } from '../types';
import { getExamsForUser } from '../services/api';

// Grid component wrapper to fix TypeScript errors
const Grid = (props: any) => <MuiGrid {...props} />;

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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
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

const StudentDashboard: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchExams = async () => {
      if (!isUserLoaded || !user) return;

      try {
        setIsLoading(true);
        const response = await getExamsForUser(user.id);
        setExams(response.data);
        setFilteredExams(response.data);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch exams');
        setIsLoading(false);
      }
    };
    
    fetchExams();
  }, [user, isUserLoaded]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredExams(exams);
    } else {
      const filtered = exams.filter(exam => 
        exam.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.course?.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredExams(filtered);
    }
  }, [searchTerm, exams]);

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

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
  };

  const handleRefresh = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await getExamsForUser(user.id);
      setExams(response.data);
      setFilteredExams(response.data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh exams');
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Student Dashboard">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your exams and study resources
          </Typography>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="dashboard tabs"
          >
            <Tab 
              icon={<CalendarTodayIcon />} 
              iconPosition="start" 
              label="Exams" 
              id="dashboard-tab-0" 
              aria-controls="dashboard-tabpanel-0" 
            />
            <Tab 
              icon={<MenuBookIcon />} 
              iconPosition="start" 
              label="Study Recommendations" 
              id="dashboard-tab-1" 
              aria-controls="dashboard-tabpanel-1" 
            />
            <Tab 
              icon={<SchoolIcon />} 
              iconPosition="start" 
              label="Course Enrollment" 
              id="dashboard-tab-2" 
              aria-controls="dashboard-tabpanel-2" 
            />
            <Tab 
              icon={<HelpOutlineIcon />} 
              iconPosition="start" 
              label="Learning Preferences" 
              id="dashboard-tab-3" 
              aria-controls="dashboard-tabpanel-3" 
            />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Search and Filter */}
            <Grid sx={{ gridColumn: 'span 12' }} component="div">
              <Paper sx={{ p: 2 }}>
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
              </Paper>
            </Grid>
            
            {/* Exam Cards */}
            <Grid sx={{ gridColumn: 'span 12' }} component="div">
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Upcoming Exams
                  </Typography>
                  {error && (
                    <Chip 
                      label="Refresh" 
                      color="primary" 
                      variant="outlined" 
                      onClick={handleRefresh}
                      disabled={isLoading}
                    />
                  )}
                </Box>
                
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                ) : filteredExams.length === 0 ? (
                  <Alert severity="info">
                    No exams found. Either you haven't been enrolled in any courses with scheduled exams, or the search filter is too restrictive.
                  </Alert>
                ) : (
                  <List>
                    {filteredExams.map((exam, index) => (
                      <React.Fragment key={exam.id}>
                        {index > 0 && <Divider sx={{ my: 2 }} />}
                        <ListItem
                          alignItems="flex-start"
                          sx={{ px: 2, py: 1 }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" component="span">
                                  {exam.course?.code}: {exam.course?.name}
                                </Typography>
                                <Chip 
                                  label={exam.status} 
                                  color={getStatusColor(exam.status) as any} 
                                  size="small" 
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <CalendarTodayIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                                  <Typography variant="body2" component="span">
                                    {formatDate(exam.startTime)} | {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LocationOnIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                                  <Typography variant="body2" component="span">
                                    {exam.room ? `${exam.room.building}, Room ${exam.room.number}` : 'Location TBD'}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <StudyRecommendations />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CourseEnrollment />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <LearningPreferences />
        </TabPanel>
      </Container>
    </Layout>
  );
};

export default StudentDashboard;
