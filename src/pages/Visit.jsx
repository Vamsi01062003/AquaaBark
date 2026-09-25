import "./visit.css";

const MAP_URL = "https://maps.app.goo.gl/4J5snstRWTvMWBe3A";
const WHATSAPP = "https://wa.me/918121637269";
const YOUTUBE = "https://youtu.be/OXWMIhZqvjU?si=CY7SP7h3OqHLSYuI";
const INSTAGRAM = "https://www.instagram.com/aquaa_bark_telugu/";

export default function Visit() {
  return (
    <main className="visit-page">
      <section className="visit-hero">
        <div className="visit-container">
          <div className="visit-copy">
            <p className="visit-eyebrow">AQUAABARK · HYDERABAD</p>

            <h1>
              Come closer to
              <br />
              <em>aquatic life.</em>
            </h1>

            <p className="visit-intro">
              AquaaBark is a premium aquarium destination built around
              extraordinary aquatic life, carefully selected specimens and a
              genuine passion for the hobby.
            </p>

            <div className="visit-details">
              <div className="visit-detail">
                <span className="visit-label">ONLINE STORE</span>
                <strong>10:30 AM — 8:00 PM</strong>
                <small>Daily online enquiries</small>
              </div>

              <div className="visit-detail">
                <span className="visit-label">PUBLIC VISITS</span>
                <strong>Saturday · 3:30 PM — 8:00 PM</strong>
                <small>Public visits are available every Saturday</small>
              </div>

              <div className="visit-detail">
                <span className="visit-label">WHATSAPP</span>
                <strong>81216 37269</strong>
                <small>WhatsApp enquiries only</small>
              </div>
            </div>

            <div className="visit-actions">
              <a
                className="visit-button visit-button-gold"
                href={MAP_URL}
                target="_blank"
                rel="noreferrer"
              >
                Get Directions
                <span>↗</span>
              </a>

              <a
                className="visit-button visit-button-outline"
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp Us
                <span>↗</span>
              </a>
            </div>

            <div className="visit-socials">
              <a
                href={YOUTUBE}
                target="_blank"
                rel="noreferrer"
              >
                YouTube ↗
              </a>

              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noreferrer"
              >
                Instagram ↗
              </a>
            </div>
          </div>

          <div className="visit-video-wrap">
            <div className="visit-video-card">
              <div className="visit-video-top">
                <span>FEATURED VIDEO</span>
                <span>AQUAABARK</span>
              </div>

              <div className="visit-video">
                <iframe
                  src="https://www.youtube.com/embed/OXWMIhZqvjU"
                  title="AquaaBark YouTube Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="visit-video-bottom">
                <span>AquaaBark Telugu</span>
                <a
                  href={YOUTUBE}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch on YouTube ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}