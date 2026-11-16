import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Infinity as InfinityIcon,
  GraduationCap,
} from "lucide-react";

import CourseCard from "../components/CourseCard";
import api from "../services/api";
import type { Course } from "../types/course";

function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/courses");
        setCourses(response.data?.courses ?? []);
      } catch (error) {
        console.error("Course fetching failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="hero-badge">
            <GraduationCap size={16} />
            Start Your Learning Journey
          </span>

          <h1>
            Learn New Skills.
            <span> Build Your Future.</span>
          </h1>

          <p>
            Explore practical courses, learn at your own pace, and take the next
            step toward your goals with AI Little Stories.
          </p>

          <div className="hero-actions">
            <Link to="/courses" className="hero-primary-btn">
              Explore Courses
              <ArrowRight size={18} />
            </Link>

            <Link to="/register" className="hero-secondary-btn">
              Get Started
            </Link>
          </div>

          <div className="hero-trust-text">
            <BookOpen size={17} />
            <span>Learn anytime, anywhere</span>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="hero-visual-card">
            <div className="hero-visual-icon">
              <GraduationCap size={48} />
            </div>

            <h3>Your Learning Journey Starts Here</h3>
            <p>Learn. Practice. Grow.</p>

            <div className="hero-visual-decoration">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="home-benefits">
        <div className="benefit-item">
          <div className="benefit-icon">
            <InfinityIcon size={25} />
          </div>
          <div>
            <h3>Lifetime Access</h3>
            <p>Access your purchased courses anytime.</p>
          </div>
        </div>

        <div className="benefit-item">
          <div className="benefit-icon">
            <Clock size={25} />
          </div>
          <div>
            <h3>Learn at Your Pace</h3>
            <p>Learn whenever it suits you.</p>
          </div>
        </div>

        <div className="benefit-item">
          <div className="benefit-icon">
            <BookOpen size={25} />
          </div>
          <div>
            <h3>One-Time Payment</h3>
            <p>Pay once for lifetime course access.</p>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="courses-section home-courses-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">START LEARNING</span>
            <h2>Explore Our Courses</h2>
            <p>Choose a course and start building your skills.</p>
          </div>

          <Link to="/courses" className="view-all-link">
            View All Courses
            <ArrowRight size={17} />
          </Link>
        </div>

        {loading ? (
          <p className="home-status">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="home-status">
            Courses will be available soon. Stay tuned!
          </p>
        ) : (
          <div className="course-grid">
            {courses.slice(0, 3).map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="home-cta">
        <div>
          <span>YOUR NEXT STEP STARTS HERE</span>
          <h2>Ready to Start Learning?</h2>
          <p>Find the right course and start learning today.</p>
        </div>

        <Link to="/courses" className="home-cta-button">
          Browse All Courses
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}

export default Home;
