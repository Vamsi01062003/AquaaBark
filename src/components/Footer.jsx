import { Instagram, Youtube, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { site, categories } from "../data/site";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer>
      <div className="container foot-grid">
        <div>
          <Logo />

          <p>
            Imported premium Betta breeding pairs,
            <br />
            selected for serious Betta enthusiasts.
            <br />
            {site.city}
          </p>

          <div className="social">
            <a
              href={site.instagram}
              target="_blank"
              rel="noreferrer"
            >
              <Instagram />
              Instagram
            </a>

            <a
              href={site.youtube}
              target="_blank"
              rel="noreferrer"
            >
              <Youtube />
              YouTube
            </a>
          </div>

          <p>
            <strong>Enquiries</strong>
            <br />
            {site.onlineHours}
            <br />
            <strong>Location</strong>
            <br />
            {site.city}
          </p>
        </div>

        <div>
          <label>Explore</label>

          <Link to="/collection">Collection</Link>
          <Link to="/about">Our Story</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div>
          <label>Collection</label>

          {categories.map((item) => (
            <Link
              key={item.id}
              to={`/collection/${item.id}`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div>
          <label>Private enquiries</label>

          <p>
            For current availability and imported premium
            Betta breeding pairs, contact us directly.
          </p>

          <a
            className="gold-link"
            href={`https://wa.me/${site.whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp us
            <ArrowUpRight />
          </a>
        </div>
      </div>

      <div className="container foot-bottom">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>

        <span>
          {site.city} · Imported Premium Bettas
        </span>
      </div>
    </footer>
  );
}