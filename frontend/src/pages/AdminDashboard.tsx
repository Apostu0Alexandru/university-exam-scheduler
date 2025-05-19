import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid as MuiGrid,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Layout from '../components/Layout';
import { Exam } from '../types';
import { getAllExams } from '../services/api';

// Grid component wrapper to fix TypeScript errors
const Grid = (props: any) => <MuiGrid {...props} />;

const AdminDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        const response = await getAllExams();
        setExams(response.data);
        setFilteredExams(response.data);
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Layout title="Admin Dashboard">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage university exam schedules
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {/* Handle create new exam */}}
          >
            Create Exam
          </Button>
        </Box>
        
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
          
          {/* Exam Table */}
          <Grid item xs={12} component="div">
            <Paper sx={{ width: '100%' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Loading exam schedule...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" style={{ color: 'red' }}>
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : filteredExams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No exams found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExams
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((exam) => (
                          <TableRow key={exam.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {exam.course?.code}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {exam.course?.name}
                              </Typography>
                            </TableCell>
                            <TableCell>{formatDate(exam.startTime)}</TableCell>
                            <TableCell>
                              {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                            </TableCell>
                            <TableCell>
                              {exam.room ? `${exam.room.building}, Room ${exam.room.number}` : 'Location TBD'}
                            </TableCell>
                            <TableCell>
                              <Chip label={exam.status} color={getStatusColor(exam.status) as any} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton color="primary" size="small" onClick={() => {/* Handle edit */}}>
                                <EditIcon />
                              </IconButton>
                              <IconButton color="error" size="small" onClick={() => {/* Handle delete */}}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredExams.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default AdminDashboard;
