import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import type { Course } from "../types/course";

function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/admin/courses");
      setCourses(response.data.courses);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const togglePublish = async (course: Course) => {
    try {
      await api.put(`/admin/courses/${course._id}`, {
        isPublished: !course.isPublished,
      });

      toast.success(
        course.isPublished ? "Course unpublished" : "Course published",
      );

      fetchCourses();
    } catch {
      toast.error("Unable to update course");
    }
  };

  const deleteCourse = async (id: string) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      await api.delete(`/admin/courses/${id}`);

      toast.success("Course deleted");
      fetchCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete course");
    }
  };

  if (loading) return <p>Loading courses...</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Manage Courses</h1>
          <p>Manage all your courses here.</p>
        </div>

        <Link to="/admin/courses/add" className="admin-button">
          + Add Course
        </Link>
      </div>

      <div className="admin-course-list">
        {courses.length === 0 ? (
          <p>No courses created yet.</p>
        ) : (
          courses.map((course) => (
            <div className="admin-course-item" key={course._id}>
              <img
                src={course.thumbnail || "https://placehold.co/120x80"}
                alt={course.title}
              />

              <div className="admin-course-info">
                <h3>{course.title}</h3>
                <p>₹{course.price}</p>

                <span>{course.isPublished ? "Published" : "Draft"}</span>
              </div>

              <div className="admin-course-actions">
                <Link
                  to={`/admin/courses/${course._id}/edit`}
                  className="edit-button"
                >
                  Edit
                </Link>
                <Link
                  to={`/admin/courses/${course._id}/content`}
                  className="edit-button"
                >
                  Manage Content
                </Link>

                <button onClick={() => togglePublish(course)}>
                  {course.isPublished ? "Unpublish" : "Publish"}
                </button>

                <button
                  className="delete-button"
                  onClick={() => deleteCourse(course._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminCourses;
