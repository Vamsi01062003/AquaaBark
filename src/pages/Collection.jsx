import "./collection.css";
import { Search, ArrowUpRight, MessageCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { site } from "../data/site";

function formatPrice(price) {
  if (price === null || price === undefined || price === "") {
    return "Price on enquiry";
  }

  const number = Number(price);

  if (Number.isNaN(number)) {
    return "Price on enquiry";
  }

  return `₹${number.toLocaleString("en-IN")}`;
}

function isSold(fish) {
  const value = String(fish.availability || "").toLowerCase();

  return (
    value.includes("sold") ||
    value.includes("unavailable") ||
    value.includes("out of stock")
  );
}

function whatsappUrl(fish) {
  const message = [
    "Hello,",
    "",
    `I am interested in ${fish.name}.`,
    fish.price ? `Price: ${formatPrice(fish.price)}` : "",
    fish.size ? `Size: ${fish.size}` : "",
    "",
    "Please share availability details.",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

function FishCard({ fish }) {
  const sold = isSold(fish);

  return (
    <article className="collection-card">
      <a
        className="collection-card-image"
        href={whatsappUrl(fish)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Enquire about ${fish.name}`}
      >
        {fish.image_url ? (
          <img
            src={fish.image_url}
            alt={fish.name}
            loading="lazy"
          />
        ) : (
          <div className="collection-image-placeholder">
            <span>REBEL PETS</span>
          </div>
        )}

        <span className={`collection-status ${sold ? "sold" : ""}`}>
          <span className="status-dot" />
          {sold ? "Sold Out" : "Available"}
        </span>

        <span className="collection-image-arrow">
          <ArrowUpRight size={17} />
        </span>
      </a>

      <div className="collection-card-content">
        <div className="collection-card-top">
          <span>Imported Betta</span>

          <span>{fish.size || "Breeding Pair"}</span>
        </div>

        <h3>{fish.name}</h3>

        {fish.description && (
          <p>
            {fish.description.length > 90
              ? `${fish.description.slice(0, 90)}…`
              : fish.description}
          </p>
        )}

        <div className="collection-card-bottom">
          <strong>{formatPrice(fish.price)}</strong>

          <a
            href={whatsappUrl(fish)}
            target="_blank"
            rel="noreferrer"
            className="collection-enquire"
          >
            <MessageCircle size={15} />
            Enquire
          </a>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="collection-card collection-skeleton">
      <div className="skeleton-image" />

      <div className="skeleton-content">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default function Collection() {
  const [fish, setFish] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadInventory() {
      setLoading(true);
      setError("");

      if (!supabase) {
        if (mounted) {
          setLoading(false);
          setError(
            "Inventory connection is not configured."
          );
        }

        return;
      }

      const { data, error: fishError } = await supabase
        .from("fish")
        .select(
          "id,name,slug,description,size,origin,price,price_label,availability,image_url,is_featured,is_active,created_at"
        )
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        });

      if (!mounted) {
        return;
      }

      if (fishError) {
        console.error(fishError);

        setError(
          "We couldn't load the Betta collection right now. Please try again."
        );

        setLoading(false);
        return;
      }

      setFish(data || []);
      setLoading(false);
    }

    loadInventory();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Real-time client-side search.
   *
   * Searches through all useful product fields so customers
   * can find a Betta by variety, name, origin, description,
   * size, availability or price label.
   */
  const filteredFish = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return fish;
    }

    return fish.filter((item) => {
      const searchableText = [
        item.name,
        item.slug,
        item.description,
        item.size,
        item.origin,
        item.price_label,
        item.availability,
        "betta",
        "breeding pair",
        "imported betta",
        "imported breeding pair",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [fish, query]);

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <main className="collection-page">
      <section className="collection-header">
        <div className="collection-container">
          <div className="collection-heading">
            <div>
              <span className="collection-eyebrow">
                REBEL PETS COLLECTION
              </span>

              <h1>
                Imported <em>Betta breeding pairs.</em>
              </h1>
            </div>

            <p>
              Explore our collection of imported rare Betta
              breeding pairs. Search by variety, colour,
              pattern, type or any other available detail.
            </p>
          </div>

          <div className="collection-controls">
            <div className="category-filter">
              <button
                type="button"
                className="category-pill active"
              >
                Imported Premium Bettas
                <span>{fish.length}</span>
              </button>
            </div>

            <div className="collection-search-row">
              <div className="collection-search-box">
                <Search size={19} />

                <input
                  type="search"
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Search Betta varieties, names, patterns..."
                  aria-label="Search imported Betta breeding pairs"
                />

                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <div className="collection-result-count">
                <span>{filteredFish.length}</span>

                {filteredFish.length === 1
                  ? " breeding pair"
                  : " breeding pairs"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="collection-gallery">
        <div className="collection-container">
          {loading ? (
            <div className="collection-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="collection-empty">
              <span className="collection-eyebrow">
                COLLECTION
              </span>

              <h2>
                Unable to load the Betta collection.
              </h2>

              <p>{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : filteredFish.length === 0 ? (
            <div className="collection-empty">
              <span className="collection-eyebrow">
                NO RESULTS
              </span>

              <h2>
                No Betta breeding pairs found.
              </h2>

              <p>
                Try another variety, pattern or Betta name.
              </p>

              <button
                type="button"
                onClick={clearSearch}
              >
                View all Bettas
              </button>
            </div>
          ) : (
            <div className="collection-grid">
              {filteredFish.map((item) => (
                <FishCard
                  key={item.id}
                  fish={item}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}