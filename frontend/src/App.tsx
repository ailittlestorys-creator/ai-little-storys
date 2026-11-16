import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminStudents from "./admin/AdminStudents";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Dashboard from "./pages/Dashboard";
import LessonPlayer from "./pages/LessonPlayer";
import LearningPage from "./pages/LearningPage";
import CourseContent from "./admin/CourseContent";
import AdminDashboard from "./admin/AdminDashboard";
import AdminCourses from "./admin/AdminCourses";
import AddCourse from "./admin/AddCourse";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Toaster position="top-right" />

        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetails />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Student Pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learn/courses/:slug" element={<LearningPage />} />
            <Route path="/learn/lessons/:lessonId" element={<LessonPlayer />} />
          </Route>

          {/* Admin Pages */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/courses/add" element={<AddCourse />} />

            <Route path="/admin/courses/:id/edit" element={<AddCourse />} />

            <Route path="/admin/students" element={<AdminStudents />} />

            <Route
              path="/admin/courses/:id/content"
              element={<CourseContent />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
