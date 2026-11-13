import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";
import { uploadVideo } from "../services/cloudinary";

interface Module {
  _id: string;
  title: string;
  order: number;
}

interface Lesson {
  _id: string;
  title: string;
  duration: number;
  order: number;
  isPreview: boolean;
}

function CourseContent() {
  const { id: courseId } = useParams();

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState("");

  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [moduleTitle, setModuleTitle] = useState("");

  const [lessonTitle, setLessonTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);

  const [isPreview, setIsPreview] = useState(false);

  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const fetchModules = async () => {
    if (!courseId) return;

    try {
      const response = await api.get(`/content/courses/${courseId}/modules`);

      setModules(response.data.modules);
    } catch {
      toast.error("Failed to load modules");
    }
  };

  const fetchLessons = async (moduleId: string) => {
    if (!courseId) return;

    try {
      const response = await api.get(
        `/content/courses/${courseId}/modules/${moduleId}/lessons`,
      );

      setLessons(response.data.lessons);
    } catch {
      toast.error("Failed to load lessons");
    }
  };

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  useEffect(() => {
    if (selectedModule) {
      fetchLessons(selectedModule);
    } else {
      setLessons([]);
    }
  }, [selectedModule]);

  const addModule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!courseId) return;

    try {
      await api.post(`/content/courses/${courseId}/modules`, {
        title: moduleTitle,
        order: modules.length + 1,
      });

      toast.success("Module created");

      setModuleTitle("");

      await fetchModules();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create module");
    }
  };

  const addLesson = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!courseId || !selectedModule || !video) {
      toast.error("Select a module and video");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Upload video to Cloudinary
      const uploaded = await uploadVideo(video, setProgress);

      // Save lesson details in MongoDB
      await api.post(
        `/content/courses/${courseId}/modules/${selectedModule}/lessons`,
        {
          title: lessonTitle,
          description,
          videoPublicId: uploaded.public_id,
          order: lessons.length + 1,
          isPreview,
        },
      );

      toast.success("Lesson uploaded successfully");

      setLessonTitle("");
      setDescription("");
      setVideo(null);
      setIsPreview(false);
      setProgress(0);

      await fetchLessons(selectedModule);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Lesson upload failed",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeLesson = async (lessonId: string) => {
    if (!window.confirm("Delete this lesson and video?")) {
      return;
    }

    try {
      await api.delete(`/content/lessons/${lessonId}`);

      toast.success("Lesson deleted");

      await fetchLessons(selectedModule);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete lesson");
    }
  };

  return (
    <div className="admin-page">
      <h1>Course Content Management</h1>

      {/* ADD MODULE */}

      <div className="content-box">
        <h2>Add New Module</h2>

        <form onSubmit={addModule} className="course-form">
          <label>Module Title</label>

          <input
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            placeholder="Example: HTML Fundamentals"
            required
            minLength={2}
          />

          <button className="admin-submit" type="submit">
            Add Module
          </button>
        </form>
      </div>

      {/* MODULE LIST */}

      <div className="content-box">
        <h2>Course Modules</h2>

        {modules.map((module) => (
          <button
            key={module._id}
            className={
              selectedModule === module._id
                ? "module-button active"
                : "module-button"
            }
            onClick={() => setSelectedModule(module._id)}
          >
            {module.order}. {module.title}
          </button>
        ))}
      </div>

      {/* ADD LESSON */}

      {selectedModule && (
        <div className="content-box">
          <h2>Add Video Lesson</h2>

          <form className="course-form" onSubmit={addLesson}>
            <label>Lesson Title</label>

            <input
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="Introduction to HTML"
              required
            />

            <label>Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Lesson description"
              rows={3}
            />

            <label>Choose Video</label>

            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideo(e.target.files?.[0] || null)}
              required
            />

            <label className="publish-option">
              <input
                type="checkbox"
                checked={isPreview}
                onChange={(e) => setIsPreview(e.target.checked)}
              />
              Allow free preview
            </label>

            {uploading && (
              <div className="upload-progress">
                <p>Uploading: {progress}%</p>

                <progress value={progress} max="100" />
              </div>
            )}

            <button type="submit" className="admin-submit" disabled={uploading}>
              {uploading ? "Uploading Video..." : "Upload Lesson"}
            </button>
          </form>

          {/* LESSON LIST */}

          <h2>Existing Lessons</h2>

          {lessons.map((lesson) => (
            <div className="lesson-item" key={lesson._id}>
              <div>
                <strong>
                  {lesson.order}. {lesson.title}
                </strong>

                <p>
                  {Math.floor(lesson.duration / 60)} min{" "}
                  {lesson.isPreview ? " • Free Preview" : " • Paid"}
                </p>
              </div>

              <button
                className="delete-button"
                onClick={() => removeLesson(lesson._id)}
              >
                Delete
              </button>
            </div>
          ))}

          {lessons.length === 0 && <p>No lessons added yet.</p>}
        </div>
      )}
    </div>
  );
}

export default CourseContent;
