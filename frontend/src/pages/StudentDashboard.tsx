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
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useUser } from '@clerk/clerk-react';
import Layout from '../components/Layout';
import StudyRecommendations from '../components/StudyRecommendations';
import { Exam } from '../types';

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
  const { user } = useUser();
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
      try {
        // In a real application, this would fetch from the API
        // For demo purposes, we'll use mock data
        const mockExams: Exam[] = [
          {
            id: '1',
            courseId: '101',
            course: {
              id: '101',
              code: 'CS101',
              name: 'Introduction to Computer Science',
              department: 'Computer Science',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            startTime: new Date(2025, 4, 25, 10, 0).toISOString(),
            endTime: new Date(2025, 4, 25, 12, 0).toISOString(),
            roomId: 'r1',
            room: {
              id: 'r1',
              building: 'Main Building',
              number: '101',
              capacity: 100,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            status: 'SCHEDULED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            courseId: '102',
            course: {
              id: '102',
              code: 'MATH201',
              name: 'Calculus II',
              department: 'Mathematics',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            startTime: new Date(2025, 4, 27, 14, 0).toISOString(),
            endTime: new Date(2025, 4, 27, 16, 0).toISOString(),
            roomId: 'r2',
            room: {
              id: 'r2',
              building: 'Science Building',
              number: '203',
              capacity: 80,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            status: 'SCHEDULED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        
        setExams(mockExams);
        setFilteredExams(mockExams);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch exams');
        setIsLoading(false);
      }
    };
    
    fetchExams();
  }, []);

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
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Search and Filter */}
            <Grid item xs={12} component="div">
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
            <Grid item xs={12} component="div">
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Upcoming Exams
                </Typography>
                
                {isLoading ? (
                  <Typography>Loading exam schedule...</Typography>
                ) : error ? (
                  <Typography color="error">{error}</Typography>
                ) : filteredExams.length === 0 ? (
                  <Typography>No exams found.</Typography>
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
      </Container>
    </Layout>
  );
};

export default StudentDashboard;
