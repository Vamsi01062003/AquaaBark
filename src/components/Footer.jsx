import { Instagram, Youtube, ArrowUpRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { site } from "../data/site";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Logo />

          <p>
            Premium aquarium fishes,
            <br />
            selected for aquarium enthusiasts.
          </p>

          <div className="social">
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Instagram />
              <span>Instagram</span>
            </a>

            <a
              href={site.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <Youtube />
              <span>YouTube</span>
            </a>
          </div>
        </div>

        <div className="footer-links">
          <label>Explore</label>

          <Link to="/">Home</Link>
          <Link to="/collection">Collection</Link>
          <Link to="/about">About</Link>
          <Link to="/visit">Visit</Link>
        </div>

        <div className="footer-contact">
          <label>Contact</label>

          <a
            href={`https://wa.me/${site.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            <span>
              <small>WHATSAPP</small>
              <strong>86399 55181</strong>
            </span>
            <ArrowUpRight />
          </a>

          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram />
            <span>
              <small>INSTAGRAM</small>
              <strong>@mr.aquatic.vizag</strong>
            </span>
            <ArrowUpRight />
          </a>
        </div>
      </div>

      <div className="container foot-bottom">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>

        <span>
          {site.city} · Premium Aquarium Fishes
        </span>
      </div>
    </footer>
  );
}