import { useEffect, useState } from "react";
import { BookOpen, Users, LayoutDashboard, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

import api from "../services/api";

interface Stats {
  totalCourses: number;
  totalStudents: number;
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/admin/stats");
        setStats(response.data.stats);
      } catch (error) {
        console.error("Stats loading failed", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2>Ai little stories Admin</h2>

        <Link to="/admin">
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link to="/admin/courses">
          <BookOpen size={18} />
          Courses
        </Link>

        <Link to="/admin/courses/add">
          <PlusCircle size={18} />
          Add Course
        </Link>
        <Link to="/admin/students">
          <Users size={18} />
          Students
        </Link>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1>Dashboard</h1>
            <p>Manage your learning platform.</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <BookOpen size={30} />
            <p>Total Courses</p>
            <h2>{stats.totalCourses}</h2>
          </div>

          <div className="stat-card">
            <Users size={30} />
            <p>Total Students</p>
            <h2>{stats.totalStudents}</h2>
          </div>
        </div>

        <div className="admin-welcome">
          <h2>Welcome Admin</h2>
          <p>Manage your courses and grow your online learning platform.</p>

          <Link to="/admin/courses/add" className="admin-button">
            Add New Course
          </Link>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
