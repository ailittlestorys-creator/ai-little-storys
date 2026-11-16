import { useEffect, useMemo, useState } from "react";
import { Copy, Search, Users, ShoppingBag, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import "../styles/admin-students.css";
import api from "../services/api";

interface Student {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface StudentEmailResponse {
  success: boolean;
  purchasedStudents: Student[];
  notPurchasedStudents: Student[];
  counts: {
    purchased: number;
    notPurchased: number;
  };
}

type StudentTab = "purchased" | "notPurchased";

function AdminStudents() {
  const [data, setData] = useState<StudentEmailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<StudentTab>("purchased");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const response = await api.get<StudentEmailResponse>(
        "/admin/students/emails",
      );

      setData(response.data);
    } catch (error) {
      console.error("Student fetch error:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const students = useMemo(() => {
    if (!data) return [];

    return activeTab === "purchased"
      ? data.purchasedStudents
      : data.notPurchasedStudents;
  }, [data, activeTab]);

  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return students;

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(value) ||
        student.email.toLowerCase().includes(value),
    );
  }, [students, search]);

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copied");
    } catch {
      toast.error("Unable to copy email");
    }
  };

  const copyAllEmails = async () => {
    if (filteredStudents.length === 0) {
      toast.error("No emails available");
      return;
    }

    const emails = filteredStudents.map((student) => student.email).join("\n");

    try {
      await navigator.clipboard.writeText(emails);
      toast.success(`${filteredStudents.length} emails copied`);
    } catch {
      toast.error("Unable to copy emails");
    }
  };

  if (loading) {
    return <div className="admin-page">Loading students...</div>;
  }

  if (!data) {
    return (
      <div className="admin-page">
        <h2>Unable to load students</h2>
        <button onClick={fetchStudents}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="admin-page admin-students-page">
      <div className="admin-page-header">
        <div>
          <h1>Student Management</h1>
          <p>Manage registered students and their purchase status.</p>
        </div>
      </div>

      {/* STUDENT COUNTS */}
      <div className="student-stats-grid">
        <div className="student-stat-card">
          <Users size={23} />
          <div>
            <span>Total Registered</span>
            <h2>{data.counts.purchased + data.counts.notPurchased}</h2>
          </div>
        </div>

        <div className="student-stat-card">
          <ShoppingBag size={23} />
          <div>
            <span>Purchased Students</span>
            <h2>{data.counts.purchased}</h2>
          </div>
        </div>

        <div className="student-stat-card">
          <UserPlus size={23} />
          <div>
            <span>Not Purchased</span>
            <h2>{data.counts.notPurchased}</h2>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="student-tabs">
        <button
          className={activeTab === "purchased" ? "active" : ""}
          onClick={() => {
            setActiveTab("purchased");
            setSearch("");
          }}
        >
          Purchased ({data.counts.purchased})
        </button>

        <button
          className={activeTab === "notPurchased" ? "active" : ""}
          onClick={() => {
            setActiveTab("notPurchased");
            setSearch("");
          }}
        >
          Not Purchased ({data.counts.notPurchased})
        </button>
      </div>

      {/* SEARCH AND COPY */}
      <div className="student-toolbar">
        <div className="student-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="copy-all-emails-button"
          onClick={copyAllEmails}
          disabled={filteredStudents.length === 0}
        >
          <Copy size={16} />
          Copy All Emails
        </button>
      </div>

      {/* STUDENT LIST */}
      <div className="student-table-wrapper">
        <table className="student-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Email Address</th>
              <th>Registered Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="student-empty">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => (
                <tr key={student._id}>
                  <td>{index + 1}</td>

                  <td>{student.name}</td>

                  <td>{student.email}</td>

                  <td>
                    {student.createdAt
                      ? new Date(student.createdAt).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="student-copy-button"
                      onClick={() => copyEmail(student.email)}
                      title="Copy email"
                    >
                      <Copy size={15} />
                      Copy
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="student-results-count">
        Showing {filteredStudents.length} of {students.length} students
      </p>
    </div>
  );
}

export default AdminStudents;
