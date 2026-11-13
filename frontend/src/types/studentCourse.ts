export interface StudentLesson {
  _id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isPreview: boolean;
}

export interface StudentModule {
  _id: string;
  title: string;
  order: number;
  lessons: StudentLesson[];
}

export interface StudentCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  language: string;
  level: string;
}

export interface StudentCourseResponse {
  success: boolean;
  course: StudentCourse;
  curriculum: StudentModule[];
  stats: {
    totalModules: number;
    totalLessons: number;
    totalDuration: number;
  };
}
