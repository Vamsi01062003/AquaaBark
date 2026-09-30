import "./visit.css";

const MAP_URL = "https://maps.app.goo.gl/pT8Wf6ptfnSHg2J38";
const WHATSAPP = "https://wa.me/919384719311";
const YOUTUBE = "https://youtube.com/@rebelpets5121?si=NVx5cArb57hhqAsC";
const INSTAGRAM =
  "https://www.instagram.com/rebel_bettas_171?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==";

export default function Visit() {
  return (
    <main className="visit-page">
      <section className="visit-hero">
        <div className="visit-container">
          <div className="visit-copy">
            <p className="visit-eyebrow">REBAL PETS · THIRUCHENDUR</p>

            <h1>
              Discover
              <br />
              <em>premium Bettas.</em>
            </h1>

            <p className="visit-intro">
              Rebal Pets specialises in imported premium Betta breeding pairs,
              with a focus on rare varieties, distinctive colours and quality
              breeding stock for Betta enthusiasts.
            </p>

            <div className="visit-details">
              <div className="visit-detail">
                <span className="visit-label">SPECIALITY</span>
                <strong>Imported Premium Bettas</strong>
                <small>Breeding pairs only</small>
              </div>

              <div className="visit-detail">
                <span className="visit-label">LOCATION</span>
                <strong>Thiruchendur</strong>
                <small>Visit through the location link below</small>
              </div>

              <div className="visit-detail">
                <span className="visit-label">WHATSAPP</span>
                <strong>93847 19311</strong>
                <small>For Betta availability & enquiries</small>
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
                <span>REBAL PETS</span>
              </div>

              <div className="visit-video">
                <iframe
                  src="https://www.youtube.com/embed/LPctBS38Tqg"
                  title="Rebal Pets Featured Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="visit-video-bottom">
                <span>Rebal Pets · 25.9K+ Subscribers</span>

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