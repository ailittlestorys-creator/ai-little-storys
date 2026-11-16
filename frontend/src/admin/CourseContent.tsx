import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Pencil, X, Save, Plus, Trash2 } from "lucide-react";

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
  description: string;
  duration: number;
  order: number;
  isPreview: boolean;
  prompts: string[];
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

  // ADD LESSON PROMPTS
  const [newPrompts, setNewPrompts] = useState<string[]>([""]);

  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // EDIT LESSON STATES
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOrder, setEditOrder] = useState(1);
  const [editPreview, setEditPreview] = useState(false);
  const [editPrompts, setEditPrompts] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchModules = async () => {
    if (!courseId) return;

    try {
      const response = await api.get(`/content/courses/${courseId}/modules`);
      setModules(response.data.modules || []);
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

      setLessons(response.data.lessons || []);
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

  // PROMPT HELPERS
  const addPromptField = () => {
    if (newPrompts.length >= 30) {
      toast.error("Maximum 30 prompts allowed");
      return;
    }

    setNewPrompts((prev) => [...prev, ""]);
  };

  const updateNewPrompt = (index: number, value: string) => {
    setNewPrompts((prev) =>
      prev.map((prompt, i) => (i === index ? value : prompt)),
    );
  };

  const removeNewPrompt = (index: number) => {
    setNewPrompts((prev) => prev.filter((_, i) => i !== index));
  };

  const addEditPromptField = () => {
    if (editPrompts.length >= 30) {
      toast.error("Maximum 30 prompts allowed");
      return;
    }

    setEditPrompts((prev) => [...prev, ""]);
  };

  const updateEditPrompt = (index: number, value: string) => {
    setEditPrompts((prev) =>
      prev.map((prompt, i) => (i === index ? value : prompt)),
    );
  };

  const removeEditPrompt = (index: number) => {
    setEditPrompts((prev) => prev.filter((_, i) => i !== index));
  };

  // ADD MODULE
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

  // ADD LESSON
  const addLesson = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!courseId || !selectedModule || !video) {
      toast.error("Select a module and video");
      return;
    }

    const prompts = newPrompts.map((prompt) => prompt.trim()).filter(Boolean);

    if (prompts.length > 30) {
      toast.error("Maximum 30 prompts allowed");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const uploaded = await uploadVideo(video, setProgress);

      await api.post(
        `/content/courses/${courseId}/modules/${selectedModule}/lessons`,
        {
          title: lessonTitle,
          description,
          videoPublicId: uploaded.public_id,
          order: lessons.length + 1,
          isPreview,
          prompts,
        },
      );

      toast.success("Lesson uploaded successfully");

      setLessonTitle("");
      setDescription("");
      setVideo(null);
      setIsPreview(false);
      setNewPrompts([""]);
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

  // OPEN EDIT FORM
  const startEditing = (lesson: Lesson) => {
    setEditingLesson(lesson._id);
    setEditTitle(lesson.title);
    setEditDescription(lesson.description || "");
    setEditOrder(lesson.order);
    setEditPreview(lesson.isPreview);
    setEditPrompts(lesson.prompts || []);
  };

  // CANCEL EDIT
  const cancelEditing = () => {
    setEditingLesson(null);
    setEditTitle("");
    setEditDescription("");
    setEditOrder(1);
    setEditPreview(false);
    setEditPrompts([]);
  };

  // UPDATE LESSON
  const updateLesson = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingLesson) return;

    if (!editTitle.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    if (!Number.isInteger(editOrder) || editOrder < 1) {
      toast.error("Enter a valid lesson order");
      return;
    }

    const prompts = editPrompts.map((prompt) => prompt.trim()).filter(Boolean);

    try {
      setSavingEdit(true);

      await api.put(`/content/lessons/${editingLesson}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        order: editOrder,
        isPreview: editPreview,
        prompts,
      });

      toast.success("Lesson updated successfully");

      cancelEditing();
      await fetchLessons(selectedModule);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update lesson");
    } finally {
      setSavingEdit(false);
    }
  };

  // DELETE LESSON
  const removeLesson = async (lessonId: string) => {
    if (!window.confirm("Delete this lesson and video?")) return;

    try {
      await api.delete(`/content/lessons/${lessonId}`);

      toast.success("Lesson deleted");

      if (editingLesson === lessonId) {
        cancelEditing();
      }

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
            type="button"
            className={
              selectedModule === module._id
                ? "module-button active"
                : "module-button"
            }
            onClick={() => {
              setSelectedModule(module._id);
              cancelEditing();
            }}
          >
            {module.order}. {module.title}
          </button>
        ))}

        {modules.length === 0 && <p>No modules created yet.</p>}
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

            {/* ADD PROMPTS */}
            <div className="lesson-prompts-editor">
              <h3>Related Prompts</h3>
              <p>Add prompts related to this video lesson.</p>

              {newPrompts.map((prompt, index) => (
                <div className="prompt-input-item" key={index}>
                  <label>Prompt {index + 1}</label>

                  <textarea
                    value={prompt}
                    onChange={(e) => updateNewPrompt(index, e.target.value)}
                    placeholder="Enter your AI prompt here..."
                    rows={4}
                    maxLength={10000}
                  />

                  <button
                    type="button"
                    className="cancel-edit-button"
                    onClick={() => removeNewPrompt(index)}
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="add-prompt-button"
                onClick={addPromptField}
              >
                <Plus size={16} />
                Add Another Prompt
              </button>
            </div>

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

          {/* EXISTING LESSONS */}
          <h2>Existing Lessons</h2>

          {lessons.map((lesson) => (
            <div className="lesson-item" key={lesson._id}>
              {editingLesson === lesson._id ? (
                <form className="lesson-edit-form" onSubmit={updateLesson}>
                  <h3>Edit Lesson</h3>

                  <label>Lesson Title</label>

                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />

                  <label>Description</label>

                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />

                  <label>Lesson Order</label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editOrder}
                    onChange={(e) => setEditOrder(Number(e.target.value))}
                    required
                  />

                  <label className="publish-option">
                    <input
                      type="checkbox"
                      checked={editPreview}
                      onChange={(e) => setEditPreview(e.target.checked)}
                    />
                    Allow free preview
                  </label>

                  {/* EDIT PROMPTS */}
                  <div className="lesson-prompts-editor">
                    <h3>Related Prompts</h3>
                    <p>Edit or remove existing prompts, or add new ones.</p>

                    {editPrompts.map((prompt, index) => (
                      <div className="prompt-input-item" key={index}>
                        <label>Prompt {index + 1}</label>

                        <textarea
                          value={prompt}
                          onChange={(e) =>
                            updateEditPrompt(index, e.target.value)
                          }
                          placeholder="Enter your AI prompt..."
                          rows={4}
                          maxLength={10000}
                        />

                        <button
                          type="button"
                          className="cancel-edit-button"
                          onClick={() => removeEditPrompt(index)}
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="add-prompt-button"
                      onClick={addEditPromptField}
                    >
                      <Plus size={16} />
                      Add Another Prompt
                    </button>
                  </div>

                  <div className="lesson-edit-actions">
                    <button
                      type="submit"
                      className="admin-submit"
                      disabled={savingEdit}
                    >
                      <Save size={16} />
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      className="cancel-edit-button"
                      onClick={cancelEditing}
                      disabled={savingEdit}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <strong>
                      {lesson.order}. {lesson.title}
                    </strong>

                    <p>
                      {Math.floor(lesson.duration / 60)} min{" "}
                      {lesson.isPreview ? " • Free Preview" : " • Paid"}
                    </p>

                    <p>{lesson.prompts?.length || 0} related prompts</p>
                  </div>

                  <div className="lesson-actions">
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => startEditing(lesson)}
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => removeLesson(lesson._id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {lessons.length === 0 && <p>No lessons added yet.</p>}
        </div>
      )}
    </div>
  );
}

export default CourseContent;
