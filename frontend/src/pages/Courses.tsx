import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import "../styles/courses.css";

interface Course {
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

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/courses");

        setCourses(response.data.courses || []);
      } catch (error) {
        console.error("Courses error:", error);
        toast.error("Unable to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return <div className="courses-loading">Loading courses...</div>;
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1>Explore Our Courses</h1>
        <p>Choose a course and start your learning journey.</p>
      </div>

      {courses.length === 0 ? (
        <div className="no-courses">
          <h2>No Courses Available</h2>
          <p>Please check back later.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div className="course-card" key={course._id}>
              <img
                src={course.thumbnail || "/placeholder-course.jpg"}
                alt={course.title}
              />

              <div className="course-card-content">
                <span className="course-level">{course.level}</span>

                <h2>{course.title}</h2>

                <div className="course-card-meta">
                  <span>{course.language}</span>
                </div>

                <div className="course-card-price">
                  <strong>₹{course.price}</strong>

                  {course.originalPrice &&
                    course.originalPrice > course.price && (
                      <del>₹{course.originalPrice}</del>
                    )}
                </div>

                <Link
                  to={`/courses/${course.slug}`}
                  className="view-course-btn"
                >
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
