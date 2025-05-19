import React, { useEffect, useState } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';
import { getExamsForUser } from '../services/api';
import { Exam } from '../types';
import { useUser } from '@clerk/clerk-react';

const SchedulePage: React.FC = () => {
  const { user } = useUser();
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    if (user) {
      getExamsForUser(user.id).then(res => setExams(res.data));
    }
  }, [user]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>My Exam Schedule</Typography>
      <Paper>
        <List>
          {exams.map(exam => (
            <ListItem key={exam.id}>
              <ListItemText
                primary={`${exam.course?.code}: ${exam.course?.name}`}
                secondary={`${new Date(exam.startTime).toLocaleString()} - ${new Date(exam.endTime).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default SchedulePage;
