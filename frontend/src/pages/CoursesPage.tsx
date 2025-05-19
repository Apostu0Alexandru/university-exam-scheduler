import React, { useEffect, useState } from 'react';
import { Container, Typography, TextField, List, ListItem, ListItemText, Paper } from '@mui/material';
import { getAllCourses } from '../services/api';
import { Course } from '../types';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllCourses().then(res => setCourses(res.data));
  }, []);

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Courses</Typography>
      <TextField
        label="Search courses"
        value={search}
        onChange={e => setSearch(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Paper>
        <List>
          {filtered.map(course => (
            <ListItem key={course.id}>
              <ListItemText
                primary={`${course.code}: ${course.name}`}
                secondary={course.department}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default CoursesPage;
