import { Send, Camera, Mail, ArrowUpRight } from "lucide-react";
import "../styles/contact.css";

const socialLinks = {
  telegram: "https://t.me/YOUR_TELEGRAM",
  instagram: "https://www.instagram.com/YOUR_INSTAGRAM/",
};

function Contact() {
  return (
    <main className="contact-page">
      <section className="contact-hero">
        <span className="contact-eyebrow">WE ARE HERE TO HELP</span>

        <h1>
          Get in <span>Touch</span>
        </h1>

        <p>
          Have questions about our courses or need assistance? Connect with us
          through our social media channels.
        </p>
      </section>

      <section className="contact-content">
        <div className="contact-card">
          <div className="contact-icon telegram-icon">
            <Send size={30} />
          </div>

          <h2>Telegram</h2>
          <p>
            Join our Telegram community for updates, announcements and support.
          </p>

          <a
            href={socialLinks.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-button telegram-button"
          >
            Connect on Telegram
            <ArrowUpRight size={18} />
          </a>
        </div>

        <div className="contact-card">
          <div className="contact-icon instagram-icon">
            <Camera size={30} />
          </div>

          <h2>Instagram</h2>
          <p>Follow us on Instagram for latest updates and learning content.</p>

          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-button instagram-button"
          >
            Follow on Instagram
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>

      <section className="contact-bottom">
        <Mail size={22} />
        <div>
          <h3>We're happy to hear from you!</h3>
          <p>Choose your preferred platform and connect with us.</p>
        </div>
      </section>
    </main>
  );
}

export default Contact;
