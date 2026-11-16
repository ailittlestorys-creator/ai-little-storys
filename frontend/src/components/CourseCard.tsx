import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import type { Course } from "../types/course";

interface Props {
  course: Course;
}

function CourseCard({ course }: Props) {
  return (
    <div className="course-card">
      <img
        src={course.thumbnail || "https://placehold.co/600x350"}
        alt={course.title}
      />

      <div className="course-content">
        <span className="course-level">{course.level}</span>

        <h3>{course.title}</h3>

        <div className="course-info">
          <span>
            <BookOpen size={16} />
            {course.language}
          </span>
        </div>

        <div className="price">
          <strong>₹{course.price}</strong>

          {course.originalPrice > course.price && (
            <del>₹{course.originalPrice}</del>
          )}
        </div>

        <Link to={`/courses/${course.slug}`}>View Course</Link>
      </div>
    </div>
  );
}

export default CourseCard;
