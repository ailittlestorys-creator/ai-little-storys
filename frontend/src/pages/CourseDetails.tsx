import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BuyNowButton from "../components/BuyNowButton";
import {
  BookOpen,
  PlayCircle,
  Lock,
  Globe,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import type {
  StudentCourseResponse,
  StudentModule,
} from "../types/studentCourse";

import "../styles/course-details.css";

type MyCoursesResponse = {
  courses?: Array<{
    _id?: string;
    courseId?: string | { _id?: string };
    course?: { _id?: string };
  }>;
};

export default function CourseDetails() {
  const { slug } = useParams<{ slug: string }>();

  const [data, setData] = useState<StudentCourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setIsEnrolled(false);

        const response = await api.get<StudentCourseResponse>(
          `/student/courses/${slug}`,
        );

        setData(response.data);

        if (response.data.curriculum.length > 0) {
          setExpandedModules([response.data.curriculum[0]._id]);
        }

        // Check whether the logged-in student purchased this course
        try {
          const myCoursesResponse = await api.get<MyCoursesResponse>(
            "/student/courses/my-courses",
          );

          const courses = myCoursesResponse.data.courses || [];

          const purchased = courses.some((item) => {
            const courseId =
              item.course?._id ||
              (typeof item.courseId === "object"
                ? item.courseId?._id
                : item.courseId) ||
              item._id;

            return courseId === response.data.course._id;
          });

          setIsEnrolled(purchased);
        } catch {
          // Not logged in or no access to my-courses
          setIsEnrolled(false);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchCourse();
  }, [slug]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((previous) =>
      previous.includes(moduleId)
        ? previous.filter((id) => id !== moduleId)
        : [...previous, moduleId],
    );
  };

  if (loading) {
    return <div className="course-loading">Loading course...</div>;
  }

  if (!data?.course) {
    return (
      <div className="course-not-found">
        <h2>Course not found</h2>
        <Link to="/courses">Browse Courses</Link>
      </div>
    );
  }

  const { course, curriculum, stats } = data;

  return (
    <div className="course-details-page">
      <section className="course-hero">
        <div className="course-hero-content">
          <Link to="/courses" className="back-link">
            ← All Courses
          </Link>

          <h1>{course.title}</h1>

          <p>{course.description}</p>

          <div className="course-meta">
            <span>
              <Globe size={17} />
              {course.language}
            </span>

            <span>
              <BarChart3 size={17} />
              {course.level}
            </span>

            <span>
              <BookOpen size={17} />
              {stats.totalLessons} Lessons
            </span>
          </div>
        </div>

        <div className="course-purchase-card">
          <img
            src={course.thumbnail || "/placeholder-course.jpg"}
            alt={course.title}
          />

          {isEnrolled ? (
            <div className="enrolled-course-action">
              <p className="enrolled-message">You already own this course.</p>

              <Link
                to={`/learn/courses/${course.slug}`}
                className="start-learning-button"
              >
                <PlayCircle size={19} />
                Start Learning
              </Link>

              <p>Lifetime access</p>
            </div>
          ) : (
            <>
              <div className="purchase-price">
                <strong>₹{course.price}</strong>

                {course.originalPrice &&
                  course.originalPrice > course.price && (
                    <del>₹{course.originalPrice}</del>
                  )}
              </div>

              <BuyNowButton
                courseId={course._id}
                courseTitle={course.title}
                courseSlug={course.slug}
              />

              <p>One-time payment · Lifetime access</p>
            </>
          )}
        </div>
      </section>

      <section className="curriculum-section">
        <h2>Course Curriculum</h2>

        <p className="curriculum-summary">
          {stats.totalModules} Modules · {stats.totalLessons} Lessons
        </p>

        {curriculum.length === 0 ? (
          <p>No lessons available yet.</p>
        ) : (
          <div className="curriculum-list">
            {curriculum.map((module: StudentModule, index) => {
              const isExpanded = expandedModules.includes(module._id);

              return (
                <div className="curriculum-module" key={module._id}>
                  <button
                    className="module-heading"
                    onClick={() => toggleModule(module._id)}
                  >
                    <div>
                      <strong>
                        Module {index + 1}: {module.title}
                      </strong>

                      <small>{module.lessons.length} Lessons</small>
                    </div>

                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </button>

                  {isExpanded && (
                    <div className="module-lessons">
                      {module.lessons.map((lesson) => (
                        <div className="curriculum-lesson" key={lesson._id}>
                          <div className="lesson-name">
                            {lesson.isPreview ? (
                              <PlayCircle size={19} />
                            ) : (
                              <Lock size={18} />
                            )}

                            <span>{lesson.title}</span>
                          </div>

                          <div className="lesson-info">
                            {lesson.isPreview && (
                              <span className="preview-label">
                                Free Preview
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
