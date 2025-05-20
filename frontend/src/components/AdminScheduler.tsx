import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format, parseISO, isAfter, isBefore, addHours, addMinutes } from 'date-fns';
import { Exam, Course, Room } from '../types';
import { createExam, updateExam, deleteExam, getAllExams } from '../services/api';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// Define our own getAllRooms function since it's not in the API
const getAllRooms = async (): Promise<{ data: Room[] }> => {
  // This is a mock function - you'll need to implement this in your API
  const now = new Date().toISOString();
  return { data: [
    { id: 'room1', building: 'Main Building', number: '101', capacity: 50, createdAt: now, updatedAt: now },
    { id: 'room2', building: 'Main Building', number: '102', capacity: 40, createdAt: now, updatedAt: now },
    { id: 'room3', building: 'Science Building', number: '201', capacity: 100, createdAt: now, updatedAt: now },
    { id: 'room4', building: 'Library', number: '001', capacity: 30, createdAt: now, updatedAt: now },
  ]};
};

interface AdminSchedulerProps {
  exams: Exam[];
  courses: Course[];
  onExamChange: () => void; // Callback to refresh exam data
}

const AdminScheduler: React.FC<AdminSchedulerProps> = ({ exams, courses, onExamChange }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // New exam form state with corrected types
  const [formData, setFormData] = useState({
    courseId: '',
    roomId: '',
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // Default to 3 hours later
    capacity: 0,
    status: 'SCHEDULED' as 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED'
  });

  // Add state for drag mode
  const [isDraggable, setIsDraggable] = useState(false);

  // Load rooms on component mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await getAllRooms();
        setRooms(response.data || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load rooms. Please try again.',
          severity: 'error'
        });
      }
    };
    
    fetchRooms();
  }, []);

  const handleNewExam = () => {
    setIsCreating(true);
    setSelectedExam(null);
    setFormData({
      courseId: '',
      roomId: '',
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
      capacity: 0,
      status: 'SCHEDULED'
    });
    setDialogOpen(true);
  };

  const handleEditExam = (exam: Exam) => {
    setIsCreating(false);
    setSelectedExam(exam);
    setFormData({
      courseId: exam.courseId || '',
      roomId: exam.roomId || '',
      startTime: parseISO(exam.startTime),
      endTime: parseISO(exam.endTime),
      capacity: 0, // Default since capacity might not be in your Exam type
      status: (exam.status as 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED') || 'SCHEDULED'
    });
    setDialogOpen(true);
  };

  const handleDeleteExam = async (examId: string) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await deleteExam(examId);
        setSnackbar({
          open: true,
          message: 'Exam deleted successfully',
          severity: 'success'
        });
        onExamChange(); // Refresh exam list
      } catch (error) {
        console.error('Error deleting exam:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete exam. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (field: 'startTime' | 'endTime', newDate: Date | null) => {
    if (newDate) {
      setFormData({
        ...formData,
        [field]: newDate
      });
    }
  };

  const validateForm = () => {
    if (!formData.courseId) return 'Please select a course';
    if (!formData.roomId) return 'Please select a room';
    if (isAfter(formData.startTime, formData.endTime)) 
      return 'Start time must be before end time';
    return null;
  };

  const checkTimeConflicts = () => {
    const conflictingExams = exams.filter(exam => {
      // Skip the current exam when editing
      if (selectedExam && exam.id === selectedExam.id) return false;
      
      const examStart = parseISO(exam.startTime);
      const examEnd = parseISO(exam.endTime);
      
      // Check if room is the same and times overlap
      return exam.roomId === formData.roomId && 
        (
          (isBefore(formData.startTime, examEnd) && isAfter(formData.endTime, examStart)) ||
          (isBefore(examStart, formData.endTime) && isAfter(examEnd, formData.startTime))
        );
    });
    
    return conflictingExams;
  };

  const handleSaveExam = async () => {
    const error = validateForm();
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
      return;
    }
    
    // Check for time conflicts
    const conflicts = checkTimeConflicts();
    if (conflicts.length > 0) {
      const confirmMessage = `There are scheduling conflicts with ${conflicts.length} existing exams in this room. Continue anyway?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    try {
      // Create exam data with the correct types
      const examData: Partial<Exam> = {
        courseId: formData.courseId,
        roomId: formData.roomId,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        status: formData.status
      };
      
      if (isCreating) {
        await createExam(examData);
        setSnackbar({
          open: true,
          message: 'Exam created successfully',
          severity: 'success'
        });
      } else if (selectedExam) {
        await updateExam(selectedExam.id, examData);
        setSnackbar({
          open: true,
          message: 'Exam updated successfully',
          severity: 'success'
        });
      }
      
      setDialogOpen(false);
      onExamChange(); // Refresh exam list
    } catch (error) {
      console.error('Error saving exam:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save exam. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Group exams by day for the scheduler view
  const groupedExams = exams.reduce((acc: Record<string, Exam[]>, exam) => {
    const day = format(parseISO(exam.startTime), 'yyyy-MM-dd');
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(exam);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedExams).sort();

  // Add a wrapper for Grid to resolve the TypeScript errors
  const GridItem = (props: any) => <Grid {...props} />;

  // Add the drag end handler function after checkTimeConflicts
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Didn't move anywhere
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    try {
      // Find the dragged exam
      const examId = draggableId;
      const exam = exams.find(e => e.id === examId);
      
      if (!exam) return;
      
      // Find the destination day
      const destDay = destination.droppableId;
      const currentDay = format(parseISO(exam.startTime), 'yyyy-MM-dd');
      
      // Calculate new time if dropped on a different day
      let newStartTime: Date;
      let newEndTime: Date;
      
      if (destDay !== currentDay) {
        // It's been moved to a different day
        const sourceStartTime = parseISO(exam.startTime);
        const sourceEndTime = parseISO(exam.endTime);
        const duration = sourceEndTime.getTime() - sourceStartTime.getTime();
        
        // Start with the base date from the destination day, preserving the time
        const destDate = new Date(destDay);
        destDate.setHours(sourceStartTime.getHours());
        destDate.setMinutes(sourceStartTime.getMinutes());
        destDate.setSeconds(sourceStartTime.getSeconds());
        
        newStartTime = destDate;
        newEndTime = new Date(destDate.getTime() + duration);
      } else {
        // Same day, let's just adjust the time slot based on the destination index
        // This is a simple implementation - you might want to do something more sophisticated
        const baseTime = new Date(destDay);
        baseTime.setHours(8); // Start at 8 AM
        
        // Each slot is 30 minutes
        const startTime = addMinutes(baseTime, destination.index * 30);
        const endTime = addMinutes(startTime, 120); // 2-hour exam by default
        
        newStartTime = startTime;
        newEndTime = endTime;
      }
      
      // Update the exam
      await updateExam(examId, {
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString()
      });
      
      setSnackbar({
        open: true,
        message: 'Exam rescheduled successfully',
        severity: 'success'
      });
      
      // Refresh exam list
      onExamChange();
    } catch (error) {
      console.error('Error rescheduling exam:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reschedule exam. Please try again.',
        severity: 'error'
      });
    }
  };

  const toggleDragMode = () => {
    setIsDraggable(prev => !prev);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Admin Exam Schedule Builder
          </Typography>
          <Box>
            <Button 
              variant="outlined"
              color={isDraggable ? "success" : "primary"}
              onClick={toggleDragMode}
              sx={{ mr: 1 }}
            >
              {isDraggable ? "Exit Drag Mode" : "Enable Drag & Drop"}
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleNewExam}
              sx={{ mr: 1 }}
            >
              New Exam
            </Button>
            <Button 
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onExamChange}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <DragDropContext onDragEnd={handleDragEnd}>
          {sortedDays.map(day => (
            <Paper 
              key={day} 
              sx={{ 
                mb: 2, 
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                {format(new Date(day), 'EEEE, MMMM d, yyyy')}
              </Typography>
              
              <Droppable droppableId={day} direction="horizontal" isDropDisabled={!isDraggable}>
                {(provided) => (
                  <Grid 
                    container 
                    spacing={2}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {groupedExams[day]
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((exam, index) => {
                        const course = courses.find(c => c.id === exam.courseId);
                        const room = rooms.find(r => r.id === exam.roomId);
                        
                        return (
                          <Draggable 
                            key={exam.id} 
                            draggableId={exam.id} 
                            index={index}
                            isDragDisabled={!isDraggable}
                          >
                            {(provided, snapshot) => (
                              <GridItem 
                                item 
                                xs={12} 
                                md={6} 
                                lg={4}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1
                                }}
                              >
                                <Paper
                                  elevation={3}
                                  sx={{
                                    p: 2,
                                    position: 'relative',
                                    borderLeft: `4px solid ${
                                      exam.status === 'COMPLETED' ? '#4caf50' :
                                      exam.status === 'CANCELLED' ? '#f44336' :
                                      '#2196f3'
                                    }`,
                                    '&:hover': {
                                      boxShadow: 6
                                    }
                                  }}
                                >
                                  {isDraggable && (
                                    <Box 
                                      sx={{ 
                                        position: 'absolute', 
                                        top: 8, 
                                        left: 8,
                                        cursor: 'grab',
                                        color: 'text.secondary'
                                      }}
                                      {...provided.dragHandleProps}
                                    >
                                      <DragIndicatorIcon />
                                    </Box>
                                  )}
                                  
                                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                    <Tooltip title="Edit">
                                      <IconButton 
                                        size="small" 
                                        onClick={() => handleEditExam(exam)}
                                        sx={{ mr: 1 }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => handleDeleteExam(exam.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                  
                                  <Typography variant="h6" sx={{ mb: 1, pr: 6, pl: isDraggable ? 4 : 0 }}>
                                    {course?.code}
                                  </Typography>
                                  
                                  <Typography variant="body1" sx={{ mb: 2 }}>
                                    {course?.name}
                                  </Typography>
                                  
                                  <Typography variant="body2" color="text.secondary">
                                    {format(parseISO(exam.startTime), 'h:mm a')} - {format(parseISO(exam.endTime), 'h:mm a')}
                                  </Typography>
                                  
                                  <Typography variant="body2" color="text.secondary">
                                    {room ? `${room.building}, Room ${room.number}` : 'No room assigned'}
                                  </Typography>
                                  
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mt: 1,
                                      color: exam.status === 'COMPLETED' ? 'success.main' :
                                             exam.status === 'CANCELLED' ? 'error.main' :
                                             'info.main'
                                    }}
                                  >
                                    Status: {exam.status}
                                  </Typography>
                                </Paper>
                              </GridItem>
                            )}
                          </Draggable>
                        );
                      })}
                    {provided.placeholder}
                  </Grid>
                )}
              </Droppable>
            </Paper>
          ))}
        </DragDropContext>
        
        {/* Create/Edit Exam Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {isCreating ? 'Create New Exam' : 'Edit Exam'}
          </DialogTitle>
          
          <DialogContent dividers>
            <Grid container spacing={3}>
              <GridItem item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="course-label">Course</InputLabel>
                  <Select
                    labelId="course-label"
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleSelectChange}
                    label="Course"
                  >
                    {courses.map(course => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="room-label">Room</InputLabel>
                  <Select
                    labelId="room-label"
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleSelectChange}
                    label="Room"
                  >
                    {rooms.map(room => (
                      <MenuItem key={room.id} value={room.id}>
                        {room.building}, Room {room.number} (Capacity: {room.capacity})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  name="capacity"
                  label="Capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="Status"
                  >
                    <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(newValue) => handleDateChange('startTime', newValue)}
                  sx={{ width: '100%', mb: 3 }}
                />
                
                <DateTimePicker
                  label="End Time"
                  value={formData.endTime}
                  onChange={(newValue) => handleDateChange('endTime', newValue)}
                  sx={{ width: '100%' }}
                />
              </GridItem>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              onClick={handleSaveExam}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AdminScheduler; 