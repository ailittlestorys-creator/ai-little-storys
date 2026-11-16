import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Users, BookOpen, IndianRupee } from "lucide-react";

import api from "../services/api";
import type { Course } from "../types/course";

function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/admin/courses");
      setCourses(response.data.courses || []);
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

      await fetchCourses();
    } catch {
      toast.error("Unable to update course");
    }
  };

  const deleteCourse = async (id: string) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      await api.delete(`/admin/courses/${id}`);

      toast.success("Course deleted");
      await fetchCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete course");
    }
  };

  const totalPurchases = courses.reduce(
    (total, course) => total + (course.purchaseCount || 0),
    0,
  );

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

      {/* COURSE SUMMARY */}
      <div className="admin-course-summary">
        <div className="admin-summary-card">
          <BookOpen size={22} />
          <div>
            <span>Total Courses</span>
            <h2>{courses.length}</h2>
          </div>
        </div>

        <div className="admin-summary-card">
          <Users size={22} />
          <div>
            <span>Total Purchases</span>
            <h2>{totalPurchases}</h2>
          </div>
        </div>
      </div>

      {/* COURSE LIST */}
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

                <p>
                  <IndianRupee size={14} />
                  {course.price}
                </p>

                <span>{course.isPublished ? "Published" : "Draft"}</span>

                {/* PURCHASE COUNT */}
                <div className="course-purchase-count">
                  <Users size={17} />
                  <strong>{course.purchaseCount ?? 0}</strong>
                  <span>Students Purchased</span>
                </div>
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
