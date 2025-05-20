import { PrismaClient, ResourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding database...');

    // Create test admin user if it doesn't exist
    const adminEmail = 'admin@university.edu';
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          clerkId: 'admin_clerk_id',
          email: adminEmail,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
      console.log('Created admin user');
    }

    // Create test student user if it doesn't exist
    const studentEmail = 'student@university.edu';
    let student = await prisma.user.findUnique({
      where: { email: studentEmail },
    });

    if (!student) {
      student = await prisma.user.create({
        data: {
          clerkId: 'student_clerk_id',
          email: studentEmail,
          firstName: 'Student',
          lastName: 'User',
          role: 'STUDENT',
        },
      });
      console.log('Created student user');
    }

    // Create test courses
    const courseData = [
      { code: 'CS101', name: 'Introduction to Computer Science', department: 'Computer Science' },
      { code: 'MATH201', name: 'Calculus II', department: 'Mathematics' },
      { code: 'ENG105', name: 'World Literature', department: 'English' },
      { code: 'BIO110', name: 'Introduction to Biology', department: 'Biology' },
    ];

    for (const course of courseData) {
      const existingCourse = await prisma.course.findUnique({
        where: { code: course.code },
      });

      if (!existingCourse) {
        await prisma.course.create({
          data: course,
        });
        console.log(`Created course: ${course.code}`);
      }
    }

    // Get all courses
    const courses = await prisma.course.findMany();

    // Create test rooms
    const roomData = [
      { building: 'Main Building', number: '101', capacity: 100 },
      { building: 'Science Building', number: '203', capacity: 80 },
      { building: 'Library', number: '305', capacity: 50 },
      { building: 'Engineering Building', number: '110', capacity: 120 },
    ];

    for (const room of roomData) {
      const existingRoom = await prisma.room.findUnique({
        where: { building_number: { building: room.building, number: room.number } },
      });

      if (!existingRoom) {
        await prisma.room.create({
          data: room,
        });
        console.log(`Created room: ${room.building} ${room.number}`);
      }
    }

    // Get all rooms
    const rooms = await prisma.room.findMany();

    // Enroll student in courses
    for (const course of courses) {
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId_semester: {
            userId: student.id,
            courseId: course.id,
            semester: 'Spring 2025',
          },
        },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            userId: student.id,
            courseId: course.id,
            semester: 'Spring 2025',
          },
        });
        console.log(`Enrolled student in course: ${course.code}`);
      }
    }

    // Create exams for courses
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const room = rooms[i % rooms.length];
      
      // Check if exam exists
      const existingExam = await prisma.exam.findFirst({
        where: {
          courseId: course.id,
          startTime: new Date(2025, 4, 20 + i, 10, 0),
        },
      });

      if (!existingExam) {
        await prisma.exam.create({
          data: {
            courseId: course.id,
            startTime: new Date(2025, 4, 20 + i, 10, 0), // May 20-23, 2025 at 10 AM
            endTime: new Date(2025, 4, 20 + i, 12, 0),   // 2 hours duration
            roomId: room.id,
            status: 'SCHEDULED',
          },
        });
        console.log(`Created exam for course: ${course.code}`);
      }
    }

    // Create study resources
    const resourceTypes: ResourceType[] = ['VIDEO', 'ARTICLE', 'PRACTICE_QUIZ', 'TEXTBOOK', 'NOTES'];
    
    for (const course of courses) {
      // Create one resource of each type for each course
      for (const type of resourceTypes) {
        const existingResource = await prisma.studyResource.findFirst({
          where: {
            courseId: course.id,
            type,
          },
        });

        if (!existingResource) {
          await prisma.studyResource.create({
            data: {
              title: `${type} for ${course.code}`,
              description: `A ${type.toLowerCase()} resource for ${course.name}`,
              url: `https://university.edu/resources/${course.code}/${type.toLowerCase()}`,
              type,
              courseId: course.id,
            },
          });
          console.log(`Created ${type} resource for course: ${course.code}`);
        }
      }
    }

    // Create learning preferences for student
    const existingPreference = await prisma.learningPreference.findFirst({
      where: {
        userId: student.id,
      },
    });

    if (!existingPreference) {
      await prisma.learningPreference.create({
        data: {
          userId: student.id,
          preferredType: 'VIDEO',
          studyDuration: 60, // 60 minutes
        },
      });
      console.log('Created learning preference for student');
    }

    // Generate recommendations for student
    const resources = await prisma.studyResource.findMany({
      include: {
        course: true,
      },
    });

    for (const resource of resources) {
      const existingRecommendation = await prisma.learningRecommendation.findFirst({
        where: {
          userId: student.id,
          resourceId: resource.id,
        },
      });

      if (!existingRecommendation) {
        // Prioritize VIDEO resources since that's the student's preference
        const priority = resource.type === 'VIDEO' ? 10 : 5;
        
        await prisma.learningRecommendation.create({
          data: {
            userId: student.id,
            courseId: resource.courseId,
            resourceId: resource.id,
            reason: `Recommended based on your enrollment in ${resource.course.name}`,
            priority,
            completed: false,
          },
        });
        console.log(`Created recommendation for ${resource.type} resource in course: ${resource.course.code}`);
      }
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 