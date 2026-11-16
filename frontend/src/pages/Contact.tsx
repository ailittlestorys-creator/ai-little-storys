import { Send, Camera, Mail, ArrowUpRight } from "lucide-react";
import "../styles/contact.css";

const socialLinks = {
  telegram: "https://t.me/ailittlestorys_support",
  instagram: "https://www.instagram.com/ai_little_storys_support/",
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
            contact us on Telegram for quick support and updates. Our team is
            ready to assist you with any inquiries or concerns you may have.
          </p>

          <a
            href={socialLinks.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-button telegram-button"
          >
            Telegram link
            <ArrowUpRight size={18} />
          </a>
        </div>

        <div className="contact-card">
          <div className="contact-icon instagram-icon">
            <Camera size={30} />
          </div>

          <h2>Instagram</h2>
          <p>you can contact us on Instagram </p>

          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-button instagram-button"
          >
            Instagram link
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
