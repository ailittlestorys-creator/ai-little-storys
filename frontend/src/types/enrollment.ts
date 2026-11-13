import type { StudentCourse } from "./studentCourse";

export interface EnrolledCourse {
  enrollmentId: string;
  enrolledAt: string;
  accessType: "lifetime";
  course: StudentCourse;
}

export interface MyCoursesResponse {
  success: boolean;
  totalCourses: number;
  courses: EnrolledCourse[];
}
