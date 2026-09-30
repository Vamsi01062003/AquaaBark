import { useEffect } from "react";

import Collection from "./Collection";
import Visit from "./Visit";

import "./home.css";

export default function Home() {
  useEffect(() => {
    const handleKey = (event) => {
      if (
        event.key === "Enter" &&
        document.activeElement?.id === "hero-explore-button"
      ) {
        document.getElementById("fish-collection")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  const handleExplore = () => {
    document.getElementById("fish-collection")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="home-page">

      {/* 1. HERO */}
      <section className="hero-exact" id="home">
        <img
          src="/rebel_background.png"
          alt="Rebel Pets — Imported Premium Betta Breeding Pairs"
          className="hero-background"
        />

        <button
          id="hero-explore-button"
          className="hero-explore-button"
          onClick={handleExplore}
          aria-label="Explore Imported Betta Breeding Pairs"
        >
          <span>Explore Collection</span>
          <span className="hero-explore-arrow">→</span>
        </button>
      </section>

      {/* 2. BETTA COLLECTION */}
      <section id="fish-collection">
        <Collection />
      </section>

      {/* 3. VISIT */}
      <section id="visit-section">
        <Visit />
      </section>

    </main>
  );
}