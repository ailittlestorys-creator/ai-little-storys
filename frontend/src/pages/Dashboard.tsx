import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock, PlayCircle, User, Mail } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { EnrolledCourse, MyCoursesResponse } from "../types/enrollment";

import "../styles/dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();

  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const response = await api.get<MyCoursesResponse>(
          "/student/courses/my-courses",
        );

        setCourses(response.data.courses || []);
      } catch (error) {
        console.error("Dashboard error:", error);
        toast.error("Unable to load your courses");
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading your courses...</div>;
  }

  return (
    <div className="student-dashboard">
      {/* STUDENT PROFILE / WELCOME SECTION */}

      <section className="dashboard-welcome">
        <div className="welcome-avatar">
          <User size={30} />
        </div>

        <div className="welcome-content">
          <span>STUDENT DASHBOARD</span>

          <h1>Welcome, {user?.name || "Student"}!</h1>

          <div className="welcome-email">
            <Mail size={16} />
            <span>{user?.email || "Email not available"}</span>
          </div>
        </div>
      </section>

      {/* DASHBOARD HEADER */}

      <div className="dashboard-header">
        <div>
          <h1>My Learning Dashboard</h1>
          <p>Continue learning from where you left off.</p>
        </div>

        <span className="course-count">
          <BookOpen size={18} />
          {courses.length} Purchased Courses
        </span>
      </div>

      {/* EMPTY STATE */}

      {courses.length === 0 ? (
        <div className="empty-dashboard">
          <BookOpen size={55} />

          <h2>No Purchased Courses Yet</h2>

          <p>
            You haven't enrolled in any courses. Explore our courses and start
            learning.
          </p>

          <Link to="/courses" className="browse-courses-btn">
            Browse Courses
          </Link>
        </div>
      ) : (
        /* ENROLLED COURSES */

        <div className="enrolled-courses-grid">
          {courses.map(({ enrollmentId, enrolledAt, course }) => (
            <div className="enrolled-course-card" key={enrollmentId}>
              <img
                src={course.thumbnail || "/placeholder-course.jpg"}
                alt={course.title}
              />

              <div className="enrolled-course-content">
                <span className="lifetime-badge">Lifetime Access</span>

                <h3>{course.title}</h3>

                <p>{course.description}</p>

                <div className="enrolled-course-meta">
                  <span>
                    <BookOpen size={15} />
                    {course.level}
                  </span>

                  <span>
                    <Clock size={15} />
                    {new Date(enrolledAt).toLocaleDateString()}
                  </span>
                </div>

                <Link
                  to={`/learn/courses/${course.slug}`}
                  className="continue-learning-btn"
                >
                  <PlayCircle size={18} />
                  Start Learning
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
