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

import { 
  getUserRecommendations, 
  markRecommendationCompleted,
  generateRecommendationsForUser
} from '../services/api';
import { LearningRecommendation } from '../types';

const StudyRecommendations: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!isUserLoaded || !user) return;
    try {
      setIsLoading(true);
      const response = await getUserRecommendations(user.id);
      setRecommendations(response.data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendations');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line
  }, [user, isUserLoaded]);

  const handleGenerateRecommendations = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      await generateRecommendationsForUser(user.id);
      await fetchRecommendations();
      setIsGenerating(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations');
      setIsGenerating(false);
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
        <Typography color="error">{error}</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => setError(null)} 
          sx={{ mt: 1 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Study Recommendations</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Recommendations'}
        </Button>
      </Box>

      {recommendations.length === 0 ? (
        <Typography color="textSecondary">
          No study recommendations available. Click "Generate Recommendations" to generate some.
        </Typography>
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