import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Grid,
} from '@mui/material';
import { useUser } from '@clerk/clerk-react';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { 
  getUserEnrollments, 
  getAvailableCourses,
  enrollUserInCourse,
  unenrollUserFromCourse,
  generateRecommendationsForUser
} from '../services/api';
import { Course, Enrollment } from '../types';

const SEMESTERS = [
  'Fall 2023',
  'Spring 2024',
  'Summer 2024',
  'Fall 2024',
];

const CourseEnrollment: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(SEMESTERS[0]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchEnrollments = async () => {
    if (!isUserLoaded || !user) return;
    try {
      setIsLoading(true);
      const response = await getUserEnrollments(user.id);
      setEnrollments(response.data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch enrollments');
      setIsLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const response = await getAvailableCourses();
      setAvailableCourses(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch available courses');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isUserLoaded || !user) return;
      setIsLoading(true);
      try {
        const [coursesResponse, enrollmentsResponse] = await Promise.all([
          getAvailableCourses(),
          getUserEnrollments(user.id),
        ]);
        setEnrollments(enrollmentsResponse.data || []);
        setAvailableCourses(coursesResponse.data || []);
        
        // Debug info
        console.log('Courses:', coursesResponse.data);
        console.log('Enrollments:', enrollmentsResponse.data);
        console.log('User ID:', user.id);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load courses or enrollments');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, isUserLoaded]);

  const handleEnrollModalOpen = () => {
    setIsDialogOpen(true);
  };

  const handleEnrollModalClose = () => {
    setIsDialogOpen(false);
    setSelectedCourse('');
  };

  const handleEnroll = async () => {
    if (!selectedCourse || !selectedSemester) {
      setError('Please select a course and semester');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to enroll in a course');
      return;
    }
    
    console.log('Attempting to enroll:', {
      userId: user.id,
      courseId: selectedCourse,
      semester: selectedSemester
    });
    
    setIsEnrolling(true);
    
    try {
      const result = await enrollUserInCourse(user.id, selectedCourse, selectedSemester);
      console.log('Enrollment result:', result);
      
      // Refresh enrollments after enrolling
      const updatedEnrollments = await getUserEnrollments(user.id);
      console.log('Updated enrollments:', updatedEnrollments.data);
      setEnrollments(updatedEnrollments.data || []);
      
      setSnackbarMessage('Successfully enrolled in course!');
      setSnackbarOpen(true);
      handleEnrollModalClose();
      setIsEnrolling(false);
      
      // Close success message after 3 seconds
      setTimeout(() => {
        setSnackbarOpen(false);
      }, 3000);
    } catch (error: any) {
      console.error('Enrollment error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to enroll in course');
      setIsEnrolling(false);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    try {
      await unenrollUserFromCourse(enrollmentId);
      await fetchEnrollments();
      setSnackbarMessage('Successfully unenrolled from course');
      setSnackbarOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to unenroll from course');
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            My Enrolled Courses
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleEnrollModalOpen}
          >
            Enroll in Course
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </Alert>
        )}

        {enrollments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="textSecondary">
              You are not enrolled in any courses yet.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleEnrollModalOpen}
              sx={{ mt: 2 }}
            >
              Enroll Now
            </Button>
          </Box>
        ) : (
          <List>
            {enrollments.map((enrollment, index) => (
              <React.Fragment key={enrollment.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">
                      <BookIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                      {enrollment.course?.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {enrollment.course?.code} • {enrollment.course?.department}
                    </Typography>
                    <Chip
                      size="small"
                      label={enrollment.semester}
                      color="secondary"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleUnenroll(enrollment.id)}
                  >
                    Unenroll
                  </Button>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Enrollment Dialog */}
      <Dialog open={isDialogOpen} onClose={handleEnrollModalClose}>
        <DialogTitle>Enroll in a Course</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="course-select-label">Course</InputLabel>
              <Select
                labelId="course-select-label"
                value={selectedCourse}
                label="Course"
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                {availableCourses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="semester-select-label">Semester</InputLabel>
              <Select
                labelId="semester-select-label"
                value={selectedSemester}
                label="Semester"
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                {SEMESTERS.map((semester) => (
                  <MenuItem key={semester} value={semester}>
                    {semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEnrollModalClose}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEnroll}
            disabled={!selectedCourse || isEnrolling}
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </>
  );
};

export default CourseEnrollment; 