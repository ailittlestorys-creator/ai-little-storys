import { Link } from "react-router-dom";
import { BookOpen, Camera, Send, ArrowUp } from "lucide-react";
import "../styles/footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <BookOpen size={27} />
            <span>AI Little Stories</span>
          </Link>

          <p>
            Learn new skills, explore new possibilities and build your future
            with AI Little Stories.
          </p>

          <div className="footer-socials">
            <a
              href="https://t.me/YOUR_TELEGRAM"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
            >
              <Send size={19} />
            </a>

            <a
              href="https://www.instagram.com/YOUR_INSTAGRAM/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Camera size={19} />
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/courses">Courses</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        <div className="footer-links">
          <h3>Account</h3>
          <Link to="/login">Login</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/dashboard">My Dashboard</Link>
        </div>

        <div className="footer-links">
          <h3>Support</h3>
          <Link to="/contact">Contact Support</Link>
          <Link to="/courses">Explore Courses</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} AI Little Stories. All rights reserved.</p>

        <Link to="/" className="footer-top-link">
          Back to top <ArrowUp size={15} />
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
