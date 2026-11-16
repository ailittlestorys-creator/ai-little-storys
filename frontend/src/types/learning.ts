export interface LearningLesson {
  _id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isPreview: boolean;
  isLocked: boolean;
  prompts: string[];
}

export interface LearningModule {
  _id: string;
  title: string;
  order: number;
  lessons: LearningLesson[];
}

export interface LearningCourseResponse {
  success: boolean;
  course: {
    _id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail: string;
    language: string;
    level: string;
  };
  isEnrolled: boolean;
  accessType: string | null;
  curriculum: LearningModule[];
}
