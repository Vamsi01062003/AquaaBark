import { useRef } from "react";

import Collection from "./Collection";
import Visit from "./Visit";

import "./home.css";

export default function Home() {
  const collectionRef = useRef(null);

  const scrollToCollection = () => {
    if (collectionRef.current) {
      collectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <main className="home-page">

      {/* HERO */}
      <section
        id="home"
        className="hero-exact"
        aria-label="Mr. Aquatic Vizag"
      >
        {/* Background image */}
        <img
          src="/home_background.png"
          alt="Mr. Aquatic Vizag"
          className="hero-background"
        />

        {/* Transparent Explore Button */}
        <button
          type="button"
          className="hero-explore-button"
          onClick={scrollToCollection}
          aria-label="Explore Collection"
        >
          <span>Explore Collection</span>
          <span className="hero-explore-arrow">→</span>
        </button>
      </section>

      {/* COLLECTION */}
      <section
        ref={collectionRef}
        id="fish-collection"
        className="home-collection-section"
      >
        <Collection />
      </section>

      {/* VISIT */}
      <section
        id="visit-section"
        className="home-visit-section"
      >
        <Visit />
      </section>

    </main>
  );
}