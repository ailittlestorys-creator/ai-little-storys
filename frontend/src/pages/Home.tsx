import { Link } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import { useEffect, useState } from "react";
import api from "../services/api";
import type { Course } from "../types/course";

function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/courses");

        setCourses(response.data.courses);
      } catch (error) {
        console.error("Course fetching failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <main>
      <section className="courses-section">
        <div className="section-heading">
          <div>
            <h2>Our Courses</h2>
            <p>Choose your course and start learning.</p>
          </div>

          <Link to="/courses">View All</Link>
        </div>

        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p>No courses available yet.</p>
        ) : (
          <div className="course-grid">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;
