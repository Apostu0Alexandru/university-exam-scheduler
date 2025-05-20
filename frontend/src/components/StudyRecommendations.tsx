import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Tooltip,
  Alert,
  LinearProgress,
} from '@mui/material';
import { useUser } from '@clerk/clerk-react';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ArticleIcon from '@mui/icons-material/Article';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotesIcon from '@mui/icons-material/Notes';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DoneIcon from '@mui/icons-material/Done';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';

import { 
  getUserRecommendations, 
  markRecommendationCompleted,
  generateRecommendationsForUser,
  getUserEnrollments,
  createSampleResourcesForCourse,
  getAvailableCourses
} from '../services/api';
import { LearningRecommendation, Enrollment, Course } from '../types';

const StudyRecommendations: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingSamples, setIsCreatingSamples] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResourcesFound, setNoResourcesFound] = useState(false);

  const fetchEnrollments = async () => {
    if (!isUserLoaded || !user) return;
    try {
      const response = await getUserEnrollments(user.id);
      console.log('Enrollments response:', response);
      console.log('Enrollment data:', response.data);
      setEnrollments(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch enrollments:', err);
    }
  };

  const fetchRecommendations = async () => {
    if (!isUserLoaded || !user) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await getUserRecommendations(user.id);
      setRecommendations(response.data);
      setNoResourcesFound(false);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendations');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
    fetchRecommendations();
    // eslint-disable-next-line
  }, [user, isUserLoaded]);

  const handleGenerateRecommendations = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      setError(null);
      await generateRecommendationsForUser(user.id)
        .catch(err => {
          console.error('Error generating recommendations:', err);
          if (err.response?.status === 404 && err.response?.data?.message?.includes('No study resources found')) {
            setNoResourcesFound(true);
          } else {
            throw err;
          }
        });
      await fetchRecommendations();
      setIsGenerating(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations');
      setIsGenerating(false);
    }
  };

  const handleCreateSampleResources = async () => {
    console.log('Current enrollments:', enrollments);
    
    if (!user) {
      setError('You must be logged in to create sample resources');
      return;
    }
    
    try {
      setIsCreatingSamples(true);
      setError(null);
      
      // Force a fresh fetch of enrollments to make sure we have the latest data
      const enrollmentsResponse = await getUserEnrollments(user.id);
      console.log('Fresh enrollments data:', enrollmentsResponse);
      const userEnrollments = enrollmentsResponse.data || [];
      
      if (!userEnrollments || userEnrollments.length === 0) {
        setError('You need to enroll in at least one course before creating sample resources. Please go to the Course Enrollment tab first.');
        setIsCreatingSamples(false);
        return;
      }

      // Create sample resources for each enrolled course
      for (const enrollment of userEnrollments) {
        console.log('Creating sample resources for course:', enrollment.courseId);
        await createSampleResourcesForCourse(enrollment.courseId);
      }

      // After creating resources, generate recommendations
      await handleGenerateRecommendations();
      setIsCreatingSamples(false);
      setNoResourcesFound(false);
    } catch (err: any) {
      console.error('Error creating sample resources:', err);
      setError(err.message || 'Failed to create sample resources');
      setIsCreatingSamples(false);
    }
  };

  const handleCreateSampleResourcesForAllCourses = async () => {
    if (!user) {
      setError('You must be logged in to create sample resources');
      return;
    }
    
    try {
      setIsCreatingSamples(true);
      setError(null);
      
      // Get all available courses regardless of enrollment
      const coursesResponse = await getAvailableCourses();
      console.log('All available courses:', coursesResponse);
      const allCourses = coursesResponse.data || [];
      
      if (!allCourses || allCourses.length === 0) {
        setError('No courses found in the system.');
        setIsCreatingSamples(false);
        return;
      }

      // Create sample resources for the first course only (for simplicity)
      const firstCourse = allCourses[0];
      console.log('Creating sample resources for first available course:', firstCourse);
      await createSampleResourcesForCourse(firstCourse.id);

      // After creating resources, generate recommendations
      await handleGenerateRecommendations();
      setIsCreatingSamples(false);
      setNoResourcesFound(false);
    } catch (err: any) {
      console.error('Error creating sample resources:', err);
      setError(err.message || 'Failed to create sample resources');
      setIsCreatingSamples(false);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await markRecommendationCompleted(id);
      
      // Update the local state
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === id ? { ...rec, completed: true } : rec
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to mark recommendation as completed');
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <VideoLibraryIcon color="primary" />;
      case 'ARTICLE':
        return <ArticleIcon color="secondary" />;
      case 'PRACTICE_QUIZ':
        return <QuizIcon style={{ color: '#ff9800' }} />;
      case 'FLASHCARDS':
        return <FlashOnIcon style={{ color: '#4caf50' }} />;
      case 'TEXTBOOK':
        return <MenuBookIcon style={{ color: '#9c27b0' }} />;
      case 'NOTES':
        return <NotesIcon style={{ color: '#795548' }} />;
      default:
        return <HelpOutlineIcon />;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => {
            setError(null);
            fetchRecommendations();
          }} 
          sx={{ mr: 2 }}
        >
          Retry
        </Button>
        {noResourcesFound ? (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<LibraryAddIcon />}
            onClick={handleCreateSampleResourcesForAllCourses}
            sx={{ mr: 2 }}
          >
            Create Sample Resources (Override)
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<LibraryAddIcon />}
            onClick={handleCreateSampleResourcesForAllCourses}
          >
            Create Resources (Override)
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Study Recommendations</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<LibraryAddIcon />}
            onClick={handleCreateSampleResources}
            disabled={isCreatingSamples || isGenerating}
            sx={{ mr: 2 }}
          >
            {isCreatingSamples ? 'Creating...' : 'Create Sample Resources'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<LibraryAddIcon />}
            onClick={handleCreateSampleResourcesForAllCourses}
            disabled={isCreatingSamples || isGenerating}
            sx={{ mr: 2 }}
          >
            Override
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleGenerateRecommendations}
            disabled={isGenerating || isCreatingSamples}
          >
            {isGenerating ? 'Generating...' : 'Generate Recommendations'}
          </Button>
        </Box>
      </Box>

      {(isGenerating || isCreatingSamples) && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {noResourcesFound && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No study resources found for your enrolled courses. Click "Create Sample Resources" to create some.
        </Alert>
      )}

      {recommendations.length === 0 && !noResourcesFound ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            No study recommendations available. Click "Generate Recommendations" to generate some.
          </Typography>
          <Alert severity="info">
            If you've just enrolled in courses, you may need to create sample resources first.
          </Alert>
        </Box>
      ) : (
        <List>
          {recommendations.map((recommendation, index) => (
            <React.Fragment key={recommendation.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  {getResourceIcon(recommendation.resource?.type || 'OTHER')}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle1" 
                      component="span" 
                      sx={{ 
                        textDecoration: recommendation.completed ? 'line-through' : 'none',
                        color: recommendation.completed ? 'text.disabled' : 'text.primary'
                      }}
                    >
                      {recommendation.resource?.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: 'block' }}
                      >
                        {recommendation.resource?.description}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          size="small" 
                          label={recommendation.course?.code || 'Unknown Course'} 
                          color="primary" 
                          variant="outlined" 
                        />
                        <Chip 
                          size="small" 
                          label={recommendation.resource?.type || 'OTHER'} 
                          color="secondary" 
                          variant="outlined" 
                        />
                        {recommendation.completed && (
                          <Chip 
                            size="small" 
                            label="Completed" 
                            icon={<CheckCircleIcon />} 
                            color="success" 
                          />
                        )}
                      </Box>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!recommendation.completed && (
                      <Tooltip title="Mark as completed">
                        <IconButton 
                          edge="end" 
                          onClick={() => handleMarkCompleted(recommendation.id)}
                          color="success"
                        >
                          <DoneIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Open resource">
                      <IconButton 
                        edge="end" 
                        component="a" 
                        href={recommendation.resource?.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenInNewIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default StudyRecommendations; 