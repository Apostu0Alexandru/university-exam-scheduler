import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  CircularProgress,
  Alert,
  Grid as MuiGrid,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { useUser } from '@clerk/clerk-react';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ArticleIcon from '@mui/icons-material/Article';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotesIcon from '@mui/icons-material/Notes';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { 
  getUserLearningPreferences, 
  updateLearningPreference,
  generateRecommendationsForUser
} from '../services/api';
import { LearningPreference } from '../types';

// Grid component wrapper to fix TypeScript errors
const Grid = (props: any) => <MuiGrid {...props} />;

const resourceTypeOptions = [
  { value: 'VIDEO', label: 'Video Lectures', icon: <VideoLibraryIcon color="primary" /> },
  { value: 'ARTICLE', label: 'Articles', icon: <ArticleIcon color="secondary" /> },
  { value: 'PRACTICE_QUIZ', label: 'Practice Quizzes', icon: <QuizIcon style={{ color: '#ff9800' }} /> },
  { value: 'FLASHCARDS', label: 'Flashcards', icon: <FlashOnIcon style={{ color: '#4caf50' }} /> },
  { value: 'TEXTBOOK', label: 'Textbooks', icon: <MenuBookIcon style={{ color: '#9c27b0' }} /> },
  { value: 'NOTES', label: 'Study Notes', icon: <NotesIcon style={{ color: '#795548' }} /> },
  { value: 'OTHER', label: 'Other Resources', icon: <HelpOutlineIcon /> },
];

const LearningPreferences: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [preferences, setPreferences] = useState<LearningPreference | null>(null);
  const [selectedType, setSelectedType] = useState<string>('VIDEO');
  const [studyDuration, setStudyDuration] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    if (!isUserLoaded || !user) return;
    try {
      setIsLoading(true);
      const response = await getUserLearningPreferences(user.id);
      if (response.data && response.data.length > 0) {
        setPreferences(response.data[0]);
        setSelectedType(response.data[0].preferredType);
        setStudyDuration(response.data[0].studyDuration);
      }
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch learning preferences');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
    // eslint-disable-next-line
  }, [user, isUserLoaded]);

  const handleTypeChange = (event: SelectChangeEvent) => {
    setSelectedType(event.target.value);
  };

  const handleDurationChange = (event: Event, newValue: number | number[]) => {
    setStudyDuration(newValue as number);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      setError(null);
      console.log('Saving learning preferences for user:', user.id);
      console.log('Preferred type:', selectedType);
      console.log('Study duration:', studyDuration);
      await updateLearningPreference(user.id, selectedType, studyDuration);
      setSuccess('Learning preferences saved successfully');
      await fetchPreferences();
      setIsSaving(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Learning preferences error:', err);
      setError(err.message || 'Failed to save learning preferences');
      setIsSaving(false);
    }
  };

  const handleRegenerateRecommendations = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      setError(null);
      await generateRecommendationsForUser(user.id);
      setSuccess('Recommendations regenerated successfully based on your new preferences');
      setIsGenerating(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate recommendations');
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Learning Preferences
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Set your preferred learning style to get personalized study recommendations.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Preferred Resource Type
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="resource-type-label">Resource Type</InputLabel>
              <Select
                labelId="resource-type-label"
                value={selectedType}
                label="Resource Type"
                onChange={handleTypeChange}
                startAdornment={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    {resourceTypeOptions.find(option => option.value === selectedType)?.icon}
                  </Box>
                }
              >
                {resourceTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1 }}>{option.icon}</Box>
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Preferred Study Duration (minutes)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Box sx={{ width: '100%' }}>
                <Slider
                  value={studyDuration}
                  onChange={handleDurationChange}
                  aria-labelledby="study-duration-slider"
                  step={15}
                  marks={[
                    { value: 15, label: '15m' },
                    { value: 30, label: '30m' },
                    { value: 60, label: '1h' },
                    { value: 90, label: '1.5h' },
                    { value: 120, label: '2h' },
                  ]}
                  min={15}
                  max={120}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          </Box>
        </Grid>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>
              Current Preferences
            </Typography>
            
            {preferences ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Preferred Resource Type:
                  </Typography>
                  <Chip 
                    icon={resourceTypeOptions.find(option => option.value === preferences.preferredType)?.icon}
                    label={resourceTypeOptions.find(option => option.value === preferences.preferredType)?.label}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Study Duration:
                  </Typography>
                  <Chip 
                    icon={<AccessTimeIcon />}
                    label={`${preferences.studyDuration} minutes`}
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No preferences set yet. Save your preferences to see them here.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<RefreshIcon />}
          onClick={handleRegenerateRecommendations}
          disabled={isGenerating || !preferences}
        >
          {isGenerating ? 'Regenerating...' : 'Regenerate Recommendations'}
        </Button>
      </Box>
    </Paper>
  );
};

export default LearningPreferences; 