import { Link, useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <BookOpen size={28} />
        <span>Ai little storys</span>
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>

        <Link to="/courses">Courses</Link>

        {user ? (
          <>
            <Link to={user.role === "admin" ? "/admin" : "/dashboard"}>
              Dashboard
            </Link>
            <Link to="/contact">Contact Us</Link>

            <button className="nav-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>

            <Link to="/register" className="nav-button">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
