import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  PlayCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import type { LearningCourseResponse, LearningLesson } from "../types/learning";

import "../styles/learning.css";

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
};

export default function LearningPage() {
  const { slug } = useParams<{ slug: string }>();

  const [data, setData] = useState<LearningCourseResponse | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LearningLesson | null>(
    null,
  );

  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const allLessons = useMemo(
    () => data?.curriculum.flatMap((module) => module.lessons) || [],
    [data],
  );

  const accessibleLessons = useMemo(
    () => allLessons.filter((lesson) => !lesson.isLocked),
    [allLessons],
  );

  const selectedIndex = accessibleLessons.findIndex(
    (lesson) => lesson._id === selectedLesson?._id,
  );

  const loadLesson = async (lesson: LearningLesson) => {
    if (lesson.isLocked) {
      toast.error("Purchase this course to unlock this lesson");
      return;
    }

    try {
      setSelectedLesson(lesson);
      setVideoUrl("");
      setVideoLoading(true);

      const response = await api.get(`/content/lessons/${lesson._id}/play`);

      setVideoUrl(response.data.videoUrl);
    } catch (error) {
      console.error("Lesson playback error:", error);
      toast.error("Unable to load this lesson");
    } finally {
      setVideoLoading(false);
    }
  };

  useEffect(() => {
    const fetchLearningCourse = async () => {
      try {
        setLoading(true);

        const response = await api.get<LearningCourseResponse>(
          `/student/courses/${slug}/learning`,
        );

        setData(response.data);

        if (response.data.curriculum.length > 0) {
          setExpandedModules([response.data.curriculum[0]._id]);
        }
      } catch (error) {
        console.error("Learning page error:", error);
        toast.error("Unable to load course");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchLearningCourse();
  }, [slug]);

  useEffect(() => {
    if (!data || selectedLesson || accessibleLessons.length === 0) {
      return;
    }

    loadLesson(accessibleLessons[0]);
  }, [data, selectedLesson, accessibleLessons]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((previous) =>
      previous.includes(moduleId)
        ? previous.filter((id) => id !== moduleId)
        : [...previous, moduleId],
    );
  };

  const goToLesson = (direction: "previous" | "next") => {
    const nextIndex =
      direction === "next" ? selectedIndex + 1 : selectedIndex - 1;

    const lesson = accessibleLessons[nextIndex];

    if (lesson) loadLesson(lesson);
  };

  if (loading) {
    return <div className="learning-loading">Loading course...</div>;
  }

  if (!data) {
    return (
      <div className="learning-loading">
        <h2>Unable to load course</h2>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  const totalLessons = allLessons.length;

  return (
    <div className="learning-page">
      <header className="learning-header">
        <Link to="/dashboard" className="learning-back">
          <ChevronLeft size={18} />
          Dashboard
        </Link>

        <div>
          <h1>{data.course.title}</h1>
          <span>
            {data.isEnrolled ? "Lifetime Course Access" : "Preview Access"}
          </span>
        </div>
      </header>

      <div className="learning-layout">
        <main className="learning-main">
          <div className="learning-video-container">
            {videoLoading ? (
              <div className="video-message">Loading video...</div>
            ) : videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="video-message">
                <PlayCircle size={55} />
                <p>Select a lesson to start learning</p>
              </div>
            )}
          </div>

          {selectedLesson && (
            <section className="current-lesson">
              <div>
                <h2>{selectedLesson.title}</h2>
                <p>{selectedLesson.description}</p>

                <span>
                  <Clock size={15} />
                  {formatDuration(selectedLesson.duration)}
                </span>
              </div>

              <div className="lesson-navigation">
                <button
                  disabled={selectedIndex <= 0}
                  onClick={() => goToLesson("previous")}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <button
                  disabled={
                    selectedIndex === -1 ||
                    selectedIndex >= accessibleLessons.length - 1
                  }
                  onClick={() => goToLesson("next")}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </section>
          )}

          {!data.isEnrolled && (
            <div className="preview-notice">
              You are watching free preview lessons. Purchase this course to
              unlock all lessons.
              <Link to={`/courses/${data.course.slug}`}>View Course</Link>
            </div>
          )}
        </main>

        <aside className="learning-sidebar">
          <div className="sidebar-title">
            <h2>Course Content</h2>
            <span>
              <BookOpen size={15} />
              {totalLessons} Lessons
            </span>
          </div>

          {data.curriculum.map((module, index) => (
            <div className="learning-module" key={module._id}>
              <button
                className="learning-module-heading"
                onClick={() => toggleModule(module._id)}
              >
                <div>
                  <strong>
                    Module {index + 1}: {module.title}
                  </strong>

                  <small>{module.lessons.length} Lessons</small>
                </div>

                <ChevronRight
                  className={
                    expandedModules.includes(module._id)
                      ? "module-chevron expanded"
                      : "module-chevron"
                  }
                />
              </button>

              {expandedModules.includes(module._id) && (
                <div className="learning-lesson-list">
                  {module.lessons.map((lesson) => {
                    const isActive = selectedLesson?._id === lesson._id;

                    return (
                      <button
                        key={lesson._id}
                        className={`learning-lesson ${
                          isActive ? "active" : ""
                        } ${lesson.isLocked ? "locked" : ""}`}
                        onClick={() => loadLesson(lesson)}
                      >
                        <span className="lesson-icon">
                          {lesson.isLocked ? (
                            <Lock size={17} />
                          ) : (
                            <PlayCircle size={17} />
                          )}
                        </span>

                        <span className="lesson-text">
                          <strong>{lesson.title}</strong>

                          <small>
                            {formatDuration(lesson.duration)}
                            {lesson.isPreview && " · Free Preview"}
                          </small>
                        </span>

                        {isActive && (
                          <CheckCircle size={17} className="active-indicator" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
