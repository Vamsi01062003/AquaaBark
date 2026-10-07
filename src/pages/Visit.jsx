import "./visit.css";

const MAP_URL =
  "https://www.google.com/maps/dir/?api=1&destination=17.7365259,83.2878451";

const WHATSAPP = "https://wa.me/918639955181";

const YOUTUBE_CHANNEL =
  "https://youtube.com/@mr_aquatic_vizag?si=42hjlyyo0rzO9pzx";

const INSTAGRAM =
  "https://www.instagram.com/mr_aquatic_vizag?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==";

const YOUTUBE_VIDEO = "https://www.youtube.com/embed/LmYtmc3O8g0";

export default function Visit() {
  return (
    <main className="visit-page">
      <section className="visit-hero">
        <div className="visit-container">
          {/* LEFT SIDE — CONTENT */}
          <div className="visit-copy">
            <p className="visit-eyebrow">MR. AQUATIC VIZAG · VIZAG</p>

            <h1>
              Discover
              <br />
              <em>premium Bettas.</em>
            </h1>

            <p className="visit-intro">
              Mr. Aquatic Vizag specialises in premium aquarium fishes,
              with a focus on quality varieties, distinctive colours and
              carefully selected fish for aquarium enthusiasts.
            </p>

            <div className="visit-details">
              <div className="visit-detail">
                <span className="visit-label">SPECIALITY</span>
                <strong>Premium Aquarium Fishes</strong>
                <small>Quality varieties for aquarium enthusiasts</small>
              </div>

              <div className="visit-detail">
                <span className="visit-label">LOCATION</span>
                <strong>Vizag</strong>
                <small>Visit through the location link below</small>
              </div>

              <div className="visit-detail">
                <span className="visit-label">WHATSAPP</span>
                <strong>86399 55181</strong>
                <small>For fish availability & enquiries</small>
              </div>
            </div>

            <div className="visit-actions">
              <a
                className="visit-button visit-button-gold"
                href={MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions
                <span>↗</span>
              </a>

              <a
                className="visit-button visit-button-outline"
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Us
                <span>↗</span>
              </a>
            </div>

            <div className="visit-socials">
              <a
                href={YOUTUBE_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube ↗
              </a>

              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram ↗
              </a>
            </div>
          </div>

          {/* RIGHT SIDE — YOUTUBE VIDEO CARD */}
          <div className="visit-video-card">
            <div className="visit-video-header">
              <span className="visit-video-label">MR. AQUATIC VIZAG</span>
              <span className="visit-video-status">YOUTUBE</span>
            </div>

            <div className="visit-video-wrapper">
              <iframe
                src={YOUTUBE_VIDEO}
                title="Mr. Aquatic Vizag YouTube Video"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="visit-video-footer">
              <div>
                <strong>Explore Our Aquarium</strong>
                <small>
                  Discover premium fishes and aquarium varieties.
                </small>
              </div>

              <a
                href={YOUTUBE_VIDEO.replace("/embed/", "/watch?v=")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Watch video on YouTube"
              >
                ↗
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}