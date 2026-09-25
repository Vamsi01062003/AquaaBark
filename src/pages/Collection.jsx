import "./collection.css";
import { Search, ArrowUpRight, MessageCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { site } from "../data/site";

const CATEGORY_ORDER = [
  "Premium Flowerhorns",
  "Flowerhorns",
  "Imported Bettas",
  "Imported Guppies",
  "Snakehead Fish (Channa)",
  "Imported Mollies",
  "Discus Fish",
  "Marine Fish",
  "Shrimps",
  "Arowanas",
  "Polar Parrots",
  "Aquatic Plants",
  "Live Cultures",
  "Others",
];

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
    "Hello AquaaBark,",
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
            <span>AQUAABARK</span>
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
          <span>
            {fish.categories?.name || fish.category || "Aquatic Life"}
          </span>

          <span>
            {fish.size || ""}
          </span>
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
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
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
          setError("Inventory connection is not configured.");
        }
        return;
      }

      const [categoryResult, fishResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id,slug,name,is_active,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),

        supabase
          .from("fish")
          .select(
            "id,category_id,name,slug,description,size,origin,price,price_label,availability,image_url,is_featured,is_active,created_at"
          )
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;

      if (categoryResult.error || fishResult.error) {
        console.error(categoryResult.error || fishResult.error);
        setError(
          "We couldn't load the collection right now. Please try again."
        );
        setLoading(false);
        return;
      }

      const categoryMap = Object.fromEntries(
        (categoryResult.data || []).map((category) => [
          category.id,
          category,
        ])
      );

      const mappedFish = (fishResult.data || []).map((item) => ({
        ...item,
        categories: categoryMap[item.category_id] || null,
      }));

      const databaseCategories = categoryResult.data || [];

      const orderedCategories = [
        ...CATEGORY_ORDER
          .map((name) =>
            databaseCategories.find(
              (category) =>
                category.name.toLowerCase() === name.toLowerCase()
            )
          )
          .filter(Boolean),
        ...databaseCategories.filter(
          (category) =>
            !CATEGORY_ORDER.some(
              (name) =>
                name.toLowerCase() === category.name.toLowerCase()
            )
        ),
      ];

      setCategories(orderedCategories);
      setFish(mappedFish);
      setLoading(false);
    }

    loadInventory();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredFish = useMemo(() => {
    const search = query.trim().toLowerCase();

    return fish.filter((item) => {
      const categoryName = item.categories?.name || "";

      const matchesCategory =
        activeCategory === "All" ||
        categoryName.toLowerCase() === activeCategory.toLowerCase();

      if (!matchesCategory) return false;

      if (!search) return true;

      const searchableText = [
        item.name,
        categoryName,
        item.description,
        item.size,
        item.origin,
        item.price_label,
        item.availability,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [fish, activeCategory, query]);

  const categoryCounts = useMemo(() => {
    const counts = {};

    categories.forEach((category) => {
      counts[category.name] = fish.filter(
        (item) =>
          item.categories?.name?.toLowerCase() ===
          category.name.toLowerCase()
      ).length;
    });

    return counts;
  }, [categories, fish]);

  const clearFilters = () => {
    setActiveCategory("All");
    setQuery("");
  };

  return (
    <main className="collection-page">
      <section className="collection-header">
        <div className="collection-container">
          <div className="collection-heading">
            <div>
              <span className="collection-eyebrow">
                AQUAABARK COLLECTION
              </span>

              <h1>
                Discover the{" "}
                <em>collection.</em>
              </h1>
            </div>

            <p>
              A carefully selected collection of premium fish and
              aquatic life. Explore by category or search directly
              for the specimen you are looking for.
            </p>
          </div>

          <div className="collection-controls">
            <div className="category-filter">
              <button
                type="button"
                className={
                  activeCategory === "All"
                    ? "category-pill active"
                    : "category-pill"
                }
                onClick={() => setActiveCategory("All")}
              >
                All
                <span>{fish.length}</span>
              </button>

              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  className={
                    activeCategory === category.name
                      ? "category-pill active"
                      : "category-pill"
                  }
                  onClick={() => {
                    setActiveCategory(category.name);
                    setQuery("");
                  }}
                >
                  {category.name}
                  <span>{categoryCounts[category.name] || 0}</span>
                </button>
              ))}
            </div>

            <div className="collection-search-row">
              <div className="collection-search-box">
                <Search size={19} />

                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search fish, category, size..."
                  aria-label="Search fish"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <div className="collection-result-count">
                <span>
                  {filteredFish.length}
                </span>
                {filteredFish.length === 1
                  ? " specimen"
                  : " specimens"}
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

              <h2>Unable to load the collection.</h2>

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

              <h2>No specimens found.</h2>

              <p>
                Try another search or browse a different
                category.
              </p>

              <button
                type="button"
                onClick={clearFilters}
              >
                View all specimens
              </button>
            </div>
          ) : (
            <div className="collection-grid">
              {filteredFish.map((item) => (
                <FishCard key={item.id} fish={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}