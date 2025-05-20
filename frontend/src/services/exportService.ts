import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { format, parseISO } from 'date-fns';
import { Exam } from '../types';

// Format utilities
const formatDate = (dateString: string) => format(parseISO(dateString), 'MMM dd, yyyy');
const formatTime = (dateString: string) => format(parseISO(dateString), 'h:mm a');

// Convert date to iCal format
const formatICalDate = (date: Date): string => {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
};

// Generate a single event for an exam
export const generateICalEvent = (exam: Exam): string => {
  const start = parseISO(exam.startTime);
  const end = parseISO(exam.endTime);
  
  return [
    'BEGIN:VEVENT',
    `UID:exam-${exam.id}@university-exam-scheduler.com`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(start)}`,
    `DTEND:${formatICalDate(end)}`,
    `SUMMARY:${exam.course?.code} Exam`,
    `DESCRIPTION:Exam for ${exam.course?.name}`,
    `LOCATION:${exam.room ? `${exam.room.building}, Room ${exam.room.number}` : 'TBD'}`,
    'END:VEVENT'
  ].join('\r\n');
};

// Generate iCal file with multiple events
export const generateICalFile = (exams: Exam[]): string => {
  const calendarEvents = exams.map(generateICalEvent).join('\r\n');
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//University Exam Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    calendarEvents,
    'END:VCALENDAR'
  ].join('\r\n');
};

// Export exams to iCal file
export const exportToCalendar = (exams: Exam[], filename = 'exam-schedule.ics'): void => {
  try {
    const calendarData = generateICalFile(exams);
    const blob = new Blob([calendarData], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error generating calendar file:', error);
    throw new Error('Failed to generate calendar file. Please try again.');
  }
};

// Export exams to PDF
export const exportToPDF = (exams: Exam[], filename = 'exam-schedule.pdf'): void => {
  try {
    const doc = new jsPDF();
    
    // Add title and header
    doc.setFontSize(20);
    doc.text('Exam Schedule', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
    
    let yPos = 35;
    
    // Sort exams by date/time
    const sortedExams = [...exams].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    // Group exams by day
    const examsByDay: Record<string, Exam[]> = {};
    
    sortedExams.forEach(exam => {
      const day = formatDate(exam.startTime);
      if (!examsByDay[day]) {
        examsByDay[day] = [];
      }
      examsByDay[day].push(exam);
    });
    
    // Loop through days
    Object.keys(examsByDay).forEach(day => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add day header
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text(day, 20, yPos);
      yPos += 8;
      
      // Add exams for the day
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      examsByDay[day].forEach((exam, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        // Course code and name
        doc.setFont('helvetica', 'bold');
        doc.text(`${exam.course?.code}: ${exam.course?.name}`, 20, yPos);
        yPos += 6;
        
        // Time
        doc.setFont('helvetica', 'normal');
        doc.text(`Time: ${formatTime(exam.startTime)} - ${formatTime(exam.endTime)}`, 25, yPos);
        yPos += 5;
        
        // Location
        doc.text(`Location: ${exam.room ? `${exam.room.building}, Room ${exam.room.number}` : 'TBD'}`, 25, yPos);
        yPos += 5;
        
        // Status
        let statusColor;
        switch (exam.status) {
          case 'COMPLETED':
            statusColor = [0, 153, 0]; // Green
            break;
          case 'CANCELLED':
            statusColor = [204, 0, 0]; // Red
            break;
          default:
            statusColor = [0, 102, 204]; // Blue
        }
        
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(`Status: ${exam.status}`, 25, yPos);
        doc.setTextColor(0, 0, 0);
        
        yPos += 10;
      });
      
      yPos += 5;
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

// Check for scheduling conflicts
export const checkForConflicts = (exams: Exam[]): {
  hasConflicts: boolean;
  conflicts: { examA: Exam; examB: Exam }[];
} => {
  const conflicts: { examA: Exam; examB: Exam }[] = [];
  
  // Check for time overlaps between exams
  for (let i = 0; i < exams.length; i++) {
    const examA = exams[i];
    const startA = new Date(examA.startTime).getTime();
    const endA = new Date(examA.endTime).getTime();
    
    for (let j = i + 1; j < exams.length; j++) {
      const examB = exams[j];
      const startB = new Date(examB.startTime).getTime();
      const endB = new Date(examB.endTime).getTime();
      
      // Check if the exams overlap in time
      if ((startA <= endB && startB <= endA)) {
        conflicts.push({ examA, examB });
      }
    }
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}; 