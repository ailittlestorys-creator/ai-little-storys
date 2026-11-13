import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";
import type { Course } from "../types/course";

function AddCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail: "",
    price: 0,
    originalPrice: 0,
    language: "Telugu",
    level: "Beginner",
    isPublished: false,
  });

  useEffect(() => {
    if (!id) return;

    const loadCourse = async () => {
      try {
        const response = await api.get("/admin/courses");

        const course = response.data.courses.find(
          (item: Course) => item._id === id,
        );

        if (!course) {
          toast.error("Course not found");
          navigate("/admin/courses");
          return;
        }

        setForm({
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price,
          originalPrice: course.originalPrice,
          language: course.language,
          level: course.level,
          isPublished: course.isPublished,
        });
      } catch {
        toast.error("Failed to load course");
      }
    };

    loadCourse();
  }, [id, navigate]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "price" || name === "originalPrice" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (id) {
        await api.put(`/admin/courses/${id}`, form);
        toast.success("Course updated successfully");
      } else {
        await api.post("/admin/courses", form);
        toast.success("Course created successfully");
      }

      navigate("/admin/courses");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    setForm((previous) => ({
      ...previous,
      slug,
    }));
  };

  return (
    <div className="admin-page">
      <h1>{id ? "Edit Course" : "Add New Course"}</h1>

      <form className="course-form" onSubmit={handleSubmit}>
        <label>Course Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter course title"
          required
          minLength={3}
        />

        <label>Course Slug</label>
        <div className="slug-input">
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="course-name"
            required
          />

          <button type="button" onClick={generateSlug}>
            Generate
          </button>
        </div>

        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Course description"
          required
          minLength={10}
          rows={5}
        />

        <label>Thumbnail Image URL</label>
        <input
          name="thumbnail"
          type="url"
          value={form.thumbnail}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
        />

        <label>Course Price (₹)</label>
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          min="0"
          required
        />

        <label>Original Price (₹)</label>
        <input
          type="number"
          name="originalPrice"
          value={form.originalPrice}
          onChange={handleChange}
          min="0"
        />

        <label>Course Language</label>
        <select name="language" value={form.language} onChange={handleChange}>
          <option value="Telugu">Telugu</option>
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
        </select>

        <label>Course Level</label>
        <select name="level" value={form.level} onChange={handleChange}>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <label className="publish-option">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) =>
              setForm((previous) => ({
                ...previous,
                isPublished: e.target.checked,
              }))
            }
          />
          Publish course immediately
        </label>

        <button type="submit" disabled={loading} className="admin-submit">
          {loading ? "Saving..." : id ? "Update Course" : "Create Course"}
        </button>
      </form>
    </div>
  );
}

export default AddCourse;
