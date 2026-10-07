import { useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";

import "./collection.css";

/* =========================================================

   MR. AQUATIC VIZAG

   COLLECTION

   Supabase:

   - Table: products

   - Table: categories

   - Storage bucket: products

   image_url supports:

   - Full public URL

   - fish/example.jpeg

   - products/fish/example.jpeg

   ========================================================= */

/* =========================================================

   CATEGORIES

   ========================================================= */

const CATEGORIES = [

  "All",

  "Imported Bettas",

  "Bettas",

  "Guppies",

  "Arwanas",

  "Flowerhorns",

  "Alligator ghar",

  "Imported Mollies",

  "Koi's",

  "Albino plecos",

  "Polar Parrots pair",

  "Green veltail zebras",

  "Tiger Barbs",

  "Tetras",

  "Shrimp",

  "Other",

  "Plants",

];

/* =========================================================

   HELPERS

   ========================================================= */

const normalize = (value) =>

  String(value ?? "")

    .trim()

    .toLowerCase()

    .replace(/\s+/g, " ");

/* =========================================================

   PRICE FORMATTER

   ========================================================= */

const formatPrice = (price) => {

  if (

    price === null ||

    price === undefined ||

    price === ""

  ) {

    return "";

  }

  const number = Number(price);

  if (Number.isNaN(number)) {

    return `₹${price}`;

  }

  return `₹${number.toLocaleString("en-IN")}`;

};

/* =========================================================

   IMAGE URL HELPER

   ========================================================= */

const getFishImageUrl = (imagePath) => {

  if (!imagePath) {

    return "";

  }

  let storagePath = String(imagePath).trim();

  if (!storagePath) {

    return "";

  }

  /* -------------------------------------------------------

     Already a complete URL

     ------------------------------------------------------- */

  if (

    storagePath.startsWith("http://") ||

    storagePath.startsWith("https://") ||

    storagePath.startsWith("data:image/")

  ) {

    return storagePath;

  }

  /* -------------------------------------------------------

     Remove leading slash

     ------------------------------------------------------- */

  storagePath = storagePath.replace(/^\/+/, "");

  /* -------------------------------------------------------

     Remove bucket name if database contains:

     products/fish/example.jpeg

     Bucket itself is already "products".

     ------------------------------------------------------- */

  if (storagePath.startsWith("products/")) {

    storagePath = storagePath.slice(

      "products/".length

    );

  }

  /* -------------------------------------------------------

     Generate public URL from Supabase Storage

     ------------------------------------------------------- */

  const { data } = supabase.storage

  .from("aquaa-bark-images")

  .getPublicUrl(storagePath);

  return data?.publicUrl || "";

};

/* =========================================================

   CATEGORY HELPER

   ========================================================= */

const getProductCategoryName = (

  product,

  categories

) => {

  /* -------------------------------------------------------

     1. Try category_id

     ------------------------------------------------------- */

  if (

    product.category_id !== undefined &&

    product.category_id !== null &&

    product.category_id !== ""

  ) {

    const categoryById = categories.find(

      (category) =>

        String(category.id) ===

        String(product.category_id)

    );

    if (categoryById) {

      return categoryById.name;

    }

  }

  /* -------------------------------------------------------

     2. Try category text

     ------------------------------------------------------- */

  if (

    product.category !== undefined &&

    product.category !== null &&

    String(product.category).trim() !== ""

  ) {

    const productCategory =

      normalize(product.category);

    const matchingCategory =

      categories.find((categoryItem) => {

        const categoryName =

          normalize(categoryItem.name);

        const categorySlug =

          normalize(categoryItem.slug);

        return (

          categoryName === productCategory ||

          categorySlug === productCategory

        );

      });

    if (matchingCategory) {

      return matchingCategory.name;

    }

    /*

      If the product already contains a category

      name that isn't currently in the categories

      table, keep the product's own category.

    */

    return String(product.category).trim();

  }

  /* -------------------------------------------------------

     3. No category

     ------------------------------------------------------- */

  return "Other";

};

/* =========================================================

   COMPONENT

   ========================================================= */

export default function Collection() {

  const [fish, setFish] = useState([]);

  const [categories, setCategories] =

    useState([]);

  const [activeCategory, setActiveCategory] =

    useState("All");

  const [search, setSearch] =

    useState("");

  const [loading, setLoading] =

    useState(true);

  const [error, setError] =

    useState("");

  /* =======================================================

     LOAD PRODUCTS + CATEGORIES

     ======================================================= */

  useEffect(() => {

    let active = true;

    const loadCollection = async () => {

      setLoading(true);

      setError("");

      try {

        const [

          productsResult,

          categoriesResult,

        ] = await Promise.all([

          /* -----------------------------------------------

             PRODUCTS

             ----------------------------------------------- */

          supabase

            .from("products")

            .select("*")

            .order("created_at", {

              ascending: false,

            }),

          /* -----------------------------------------------

             CATEGORIES

             ----------------------------------------------- */

          supabase

            .from("categories")

            .select("*")

            .order("name", {

              ascending: true,

            }),

        ]);

        if (!active) {

          return;

        }

        /* =================================================

           PRODUCTS

           ================================================= */

        if (productsResult.error) {

          console.error(

            "Supabase products error:",

            productsResult.error

          );

          setFish([]);

          setError(

            "Unable to load fish collection."

          );

        } else {

          console.log(

            "Products loaded:",

            productsResult.data

          );

          console.log(

            "Number of products:",

            productsResult.data?.length || 0

          );

          setFish(

            productsResult.data || []

          );

        }

        /* =================================================

           CATEGORIES

           ================================================= */

        if (categoriesResult.error) {

          console.error(

            "Supabase categories error:",

            categoriesResult.error

          );

          /*

            Categories are not required for the

            products themselves to appear.

          */

          setCategories([]);

        } else {

          console.log(

            "Categories loaded:",

            categoriesResult.data

          );

          setCategories(

            categoriesResult.data || []

          );

        }

        /* =================================================

           BOTH FAILED

           ================================================= */

        if (

          productsResult.error &&

          categoriesResult.error

        ) {

          setError(

            "Unable to load the aquarium collection."

          );

        }

      } catch (loadError) {

        console.error(

          "Collection loading error:",

          loadError

        );

        if (active) {

          setFish([]);

          setCategories([]);

          setError(

            "Unable to load the aquarium collection."

          );

        }

      }

      if (active) {

        setLoading(false);

      }

    };

    loadCollection();

    /* =====================================================

       REALTIME PRODUCTS

       ===================================================== */

    const productsChannel = supabase

      .channel(

        "collection-products-live"

      )

      .on(

        "postgres_changes",

        {

          event: "*",

          schema: "public",

          table: "products",

        },

        (payload) => {

          if (!active) {

            return;

          }

          console.log(

            "Products realtime update:",

            payload

          );

          /* ---------------------------------------------

             INSERT

             --------------------------------------------- */

          if (

            payload.eventType ===

            "INSERT"

          ) {

            setFish((current) => {

              const exists =

                current.some(

                  (item) =>

                    item.id ===

                    payload.new.id

                );

              if (exists) {

                return current;

              }

              return [

                payload.new,

                ...current,

              ];

            });

            return;

          }

          /* ---------------------------------------------

             UPDATE

             --------------------------------------------- */

          if (

            payload.eventType ===

            "UPDATE"

          ) {

            setFish((current) => {

              const exists =

                current.some(

                  (item) =>

                    item.id ===

                    payload.new.id

                );

              if (!exists) {

                return [

                  payload.new,

                  ...current,

                ];

              }

              return current.map(

                (item) =>

                  item.id ===

                  payload.new.id

                    ? payload.new

                    : item

              );

            });

            return;

          }

          /* ---------------------------------------------

             DELETE

             --------------------------------------------- */

          if (

            payload.eventType ===

            "DELETE"

          ) {

            setFish((current) =>

              current.filter(

                (item) =>

                  item.id !==

                  payload.old.id

              )

            );

          }

        }

      )

      .subscribe();

    /* =====================================================

       REALTIME CATEGORIES

       ===================================================== */

    const categoriesChannel =

      supabase

        .channel(

          "collection-categories-live"

        )

        .on(

          "postgres_changes",

          {

            event: "*",

            schema: "public",

            table: "categories",

          },

          async () => {

            if (!active) {

              return;

            }

            const result =

              await supabase

                .from("categories")

                .select("*")

                .order("name", {

                  ascending: true,

                });

            if (!active) {

              return;

            }

            if (!result.error) {

              setCategories(

                result.data || []

              );

            }

          }

        )

        .subscribe();

    /* =====================================================

       CLEANUP

       ===================================================== */

    return () => {

      active = false;

      supabase.removeChannel(

        productsChannel

      );

      supabase.removeChannel(

        categoriesChannel

      );

    };

  }, []);

  /* =======================================================

     CATEGORY LOOKUP

     ======================================================= */

  const categoryMap = useMemo(() => {

    const map = new Map();

    categories.forEach(

      (category) => {

        map.set(

          String(category.id),

          category

        );

      }

    );

    return map;

  }, [categories]);

  /* =======================================================

     ADD CATEGORY INFORMATION TO PRODUCTS

     ======================================================= */

  const fishWithCategories =

    useMemo(() => {

      return fish.map((item) => {

        let category = null;

        /* -----------------------------------------------

           Try category_id first

           ----------------------------------------------- */

        if (

          item.category_id !==

            undefined &&

          item.category_id !== null &&

          item.category_id !== ""

        ) {

          category =

            categoryMap.get(

              String(

                item.category_id

              )

            );

        }

        /* -----------------------------------------------

           Try product.category

           ----------------------------------------------- */

        if (!category) {

          const productCategory =

            getProductCategoryName(

              item,

              categories

            );

          category = categories.find(

            (categoryItem) =>

              normalize(

                categoryItem.name

              ) ===

                normalize(

                  productCategory

                ) ||

              normalize(

                categoryItem.slug

              ) ===

                normalize(

                  productCategory

                )

          );

        }

        const categoryName =

          category?.name ||

          getProductCategoryName(

            item,

            categories

          );

        const categorySlug =

          category?.slug ||

          normalize(categoryName);

        return {

          ...item,

          categoryName:

            categoryName || "Other",

          categorySlug:

            categorySlug || "other",

        };

      });

    }, [

      fish,

      categories,

      categoryMap,

    ]);

  /* =======================================================

     FILTER + SEARCH

     ======================================================= */

  const filteredFish =

    useMemo(() => {

      const query =

        normalize(search);

      const selectedCategory =

        normalize(activeCategory);

      return fishWithCategories.filter(

        (item) => {

          const name =

            normalize(item.name);

          const categoryName =

            normalize(

              item.categoryName

            );

          const categorySlug =

            normalize(

              item.categorySlug

            );

          const description =

            normalize(

              item.description

            );

          const category =

            normalize(

              item.category

            );

          const price =

            normalize(item.price);

          /* ---------------------------------------------

             CATEGORY MATCH

             --------------------------------------------- */

          /*

            IMPORTANT:

            When "All" is selected, do not check

            category at all.

            This guarantees every product returned

            from Supabase can appear.

          */

          const matchesCategory =

            activeCategory ===

              "All"

              ? true

              : categoryName ===

                  selectedCategory ||

                categorySlug ===

                  selectedCategory ||

                category ===

                  selectedCategory;

          /* ---------------------------------------------

             SEARCH MATCH

             --------------------------------------------- */

          const matchesSearch =

            query.length === 0 ||

            name.includes(query) ||

            categoryName.includes(query) ||

            categorySlug.includes(query) ||

            category.includes(query) ||

            description.includes(query) ||

            price.includes(query);

          return (

            matchesCategory &&

            matchesSearch

          );

        }

      );

    }, [

      fishWithCategories,

      activeCategory,

      search,

    ]);

  /* =======================================================

     DEBUG

     ======================================================= */

  useEffect(() => {

    console.log(

      "Collection state:",

      {

        totalProducts:

          fish.length,

        totalCategories:

          categories.length,

        activeCategory,

        search,

        filteredProducts:

          filteredFish.length,

      }

    );

  }, [

    fish.length,

    categories.length,

    activeCategory,

    search,

    filteredFish.length,

  ]);

  /* =======================================================

     RENDER

     ======================================================= */

  return (

    <section

      id="collection"

      className="collection-page"

    >

      {/* ==================================================

          PREMIUM BACKGROUND

          ================================================== */}

      <div

        className="collection-background"

        aria-hidden="true"

      />

      <div

        className="collection-overlay"

        aria-hidden="true"

      />

      {/* ==================================================

          CONTENT

          ================================================== */}

      <div className="collection-content">

        {/* =================================================

            SEARCH

            ================================================= */}

        <div className="collection-search-wrapper">

          <div className="collection-search">

            <span

              className="collection-search-icon"

              aria-hidden="true"

            >

              ⌕

            </span>

            <input

              type="search"

              value={search}

              onChange={(event) =>

                setSearch(

                  event.currentTarget.value

                )

              }

              onInput={(event) =>

                setSearch(

                  event.currentTarget.value

                )

              }

              placeholder="Search fish or category..."

              aria-label="Search fish or category"

              autoComplete="off"

            />

            {search && (

              <button

                type="button"

                className="collection-search-clear"

                onClick={() =>

                  setSearch("")

                }

                aria-label="Clear search"

              >

                ×

              </button>

            )}

          </div>

        </div>

        {/* =================================================

            CATEGORY FILTERS

            ================================================= */}

        <nav

          className="collection-categories"

          aria-label="Fish categories"

        >

          <div className="collection-category-list">

            {CATEGORIES.map(

              (category) => (

                <button

                  key={category}

                  type="button"

                  className={

                    activeCategory ===

                    category

                      ? "collection-category active"

                      : "collection-category"

                  }

                  onClick={() =>

                    setActiveCategory(

                      category

                    )

                  }

                >

                  {category}

                </button>

              )

            )}

          </div>

        </nav>

        {/* =================================================

            RESULTS

            ================================================= */}

        <div className="collection-results">

          {/* =================================================

              LOADING

              ================================================= */}

          {loading && (

            <div className="collection-state">

              <div className="collection-loader" />

              <p>

                Loading fish...

              </p>

            </div>

          )}

          {/* =================================================

              ERROR

              ================================================= */}

          {!loading &&

            error && (

              <div className="collection-state collection-error">

                <p>

                  {error}

                </p>

                <button

                  type="button"

                  onClick={() =>

                    window.location.reload()

                  }

                >

                  Try Again

                </button>

              </div>

            )}

          {/* =================================================

              EMPTY

              ================================================= */}

          {!loading &&

            !error &&

            filteredFish.length === 0 && (

              <div className="collection-state">

                <div className="collection-empty-icon">

                  ◌

                </div>

                <p>

                  {search

                    ? `No fish found for "${search}".`

                    : activeCategory !==

                      "All"

                    ? `No fish available in ${activeCategory}.`

                    : "No fish found."}

                </p>

              </div>

            )}

          {/* =================================================

              FISH GRID

              ================================================= */}

          {!loading &&

            !error &&

            filteredFish.length > 0 && (

              <div className="collection-grid">

                {filteredFish.map(

                  (item) => {

                    const imageUrl =

                      getFishImageUrl(

                        item.image_url

                      );

                    return (

                      <article

                        key={item.id}

                        className="collection-card"

                      >

                        {/* =====================================

                            IMAGE

                            ===================================== */}

                        <div className="collection-card-image-wrapper">

                          {imageUrl ? (

                            <img

                              src={imageUrl}

                              alt={

                                item.name ||

                                "Aquarium fish"

                              }

                              className="collection-card-image"

                              loading="lazy"

                              decoding="async"

                              onError={(event) => {

                                console.error(

                                  "FAILED TO LOAD FISH IMAGE:",

                                  {

                                    fish:

                                      item.name,

                                    databaseValue:

                                      item.image_url,

                                    generatedUrl:

                                      event

                                        .currentTarget

                                        .src,

                                  }

                                );

                                event.currentTarget.style.display =

                                  "none";

                              }}

                            />

                          ) : (

                            <div className="collection-card-no-image">

                              <span>

                                No Image

                              </span>

                            </div>

                          )}

                        </div>

                        {/* =====================================

                            DETAILS

                            ===================================== */}

                        <div className="collection-card-content">

                          {/* CATEGORY */}

                          {item.categoryName && (

                            <p className="collection-card-category">

                              {item.categoryName}

                            </p>

                          )}

                          {/* FISH NAME */}

                          <h2>

                            {item.name ||

                              "Unnamed Fish"}

                          </h2>

                          {/* DESCRIPTION */}

                          {item.description && (

                            <p className="collection-card-description">

                              {item.description}

                            </p>

                          )}

                          {/* SIZE */}

                          {item.size && (

                            <div className="collection-card-meta">

                              <span>

                                {item.size}

                              </span>

                            </div>

                          )}

                          {/* PRICE + STOCK */}

                          <div className="collection-card-bottom">

                            {item.price !==

                              null &&

                              item.price !==

                                undefined &&

                              item.price !==

                                "" && (

                                <span className="collection-card-price">

                                  {formatPrice(

                                    item.price

                                  )}

                                </span>

                              )}

                            {item.stock !==

                              null &&

                              item.stock !==

                                undefined && (

                                <span

                                  className={

                                    `collection-card-stock ${

                                      Number(

                                        item.stock

                                      ) > 0

                                        ? "available"

                                        : "sold-out"

                                    }`

                                  }

                                >

                                  <span className="stock-dot" />

                                  {Number(

                                    item.stock

                                  ) > 0

                                    ? "Available"

                                    : "Sold Out"}

                                </span>

                              )}

                          </div>

                          {/* =================================

                              WHATSAPP ENQUIRY

                              ================================= */}

                          <a

                            href={

                              `https://wa.me/918639955181?text=${encodeURIComponent(

                                `Hi, I am interested in ${

                                  item.name ||

                                  "this fish"

                                }. Please share the details and availability.`

                              )}`

                            }

                            target="_blank"

                            rel="noopener noreferrer"

                            className="collection-whatsapp-button"

                            aria-label={

                              `Enquire about ${

                                item.name ||

                                "this fish"

                              } on WhatsApp`

                            }

                          >

                            <span

                              className="collection-whatsapp-icon"

                              aria-hidden="true"

                            >

                              ◉

                            </span>

                            <span>

                              WhatsApp Enquire

                            </span>

                          </a>

                        </div>

                      </article>

                    );

                  }

                )}

              </div>

            )}

        </div>

      </div>

    </section>

  );

}