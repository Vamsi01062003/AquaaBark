import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const STORAGE_BUCKET = "mr.aquaticvizag";

const DEFAULT_CATEGORIES = [
  {
    name: "Imported Bettas",
    slug: "imported-bettas",
    sort_order: 1,
  },
  {
    name: "Bettas",
    slug: "bettas",
    sort_order: 2,
  },
  {
    name: "Guppies",
    slug: "guppies",
    sort_order: 3,
  },
  {
    name: "Arwanas",
    slug: "arwanas",
    sort_order: 4,
  },
  {
    name: "Flowerhorns",
    slug: "flowerhorns",
    sort_order: 5,
  },
  {
    name: "Alligator ghar",
    slug: "alligator-ghar",
    sort_order: 6,
  },
  {
    name: "Imported Mollies",
    slug: "imported-mollies",
    sort_order: 7,
  },
  {
    name: "Koi's",
    slug: "kois",
    sort_order: 8,
  },
  {
    name: "Albino plecos",
    slug: "albino-plecos",
    sort_order: 9,
  },
  {
    name: "Polar Parrots pair",
    slug: "polar-parrots-pair",
    sort_order: 10,
  },
  {
    name: "Green veltail zebras",
    slug: "green-veltail-zebras",
    sort_order: 11,
  },
  {
    name: "Tiger Barbs",
    slug: "tiger-barbs",
    sort_order: 12,
  },
  {
    name: "Tetras",
    slug: "tetras",
    sort_order: 13,
  },
  {
    name: "Shrimp",
    slug: "shrimp",
    sort_order: 14,
  },
  {
    name: "Other",
    slug: "other",
    sort_order: 15,
  },
  {
    name: "Plants",
    slug: "plants",
    sort_order: 16,
  },
];

const EMPTY_FISH = {
  id: null,
  name: "",
  category: "",
  price: "",
  description: "",
  stock: 1,
  image_url: "",
};

const EMPTY_CATEGORY = {
  id: null,
  name: "",
  slug: "",
  image_url: "",
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `₹${number.toLocaleString("en-IN")}`;
}

function getPublicUrl(path) {
  if (!path) return "";

  if (
    String(path).startsWith("http://") ||
    String(path).startsWith("https://")
  ) {
    return path;
  }

  let storagePath = String(path).trim();

  storagePath = storagePath.replace(/^\/+/, "");

  if (storagePath.startsWith(`${STORAGE_BUCKET}/`)) {
    storagePath = storagePath.slice(
      `${STORAGE_BUCKET}/`.length
    );
  }

  const result = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return result?.data?.publicUrl || "";
}

async function uploadImage(file, folder) {
  if (!file) return null;

  const extension =
    file.name.indexOf(".") >= 0
      ? file.name.split(".").pop().toLowerCase()
      : "jpg";

  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();

  const fileName =
    `${Date.now()}-${safeName || "image"}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;

  const filePath = `${folder}/${fileName}`;

  const uploadResult = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  return getPublicUrl(filePath);
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    onLogin(result.data.user);

    setLoading(false);
  }

  return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <div style={styles.loginLogo}>
          MR. AQUATIC VIZAG
        </div>

        <div style={styles.loginSubtitle}>
          Admin Dashboard
        </div>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>

          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Admin email"
            required
          />

          <label style={styles.label}>Password</label>

          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Password"
            required
          />

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <button
            style={styles.loginButton}
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

function FishModal({
  fish,
  categories,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(
    fish || EMPTY_FISH
  );

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [preview, setPreview] = useState(
    fish?.image_url || ""
  );

  useEffect(() => {
    setForm(fish || EMPTY_FISH);
    setSelectedFile(null);
    setPreview(fish?.image_url || "");
  }, [fish]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);

    setPreview(objectUrl);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter product name.");
      return;
    }

    if (!form.category) {
      alert("Please select a category.");
      return;
    }

    await onSave(form, selectedFile);
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>
              {form.id
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <div style={styles.modalSubtitle}>
              Add product information and image
            </div>
          </div>

          <button
            style={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formColumn}>
              <label style={styles.label}>
                Fish Name *
              </label>

              <input
                style={styles.input}
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Example: Galaxy Koi Betta"
                required
              />

              <label style={styles.label}>
                Category *
              </label>

              <select
                style={styles.input}
                value={form.category}
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select category
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              <label style={styles.label}>
                Price
              </label>

              <input
                style={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  updateField(
                    "price",
                    event.target.value
                  )
                }
                placeholder="2500"
              />

              <label style={styles.label}>
                Stock
              </label>

              <input
                style={styles.input}
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) =>
                  updateField(
                    "stock",
                    event.target.value
                  )
                }
                placeholder="1"
              />

              <div style={styles.stockHelper}>
                Enter <strong>0</strong> if this
                product is sold out.
              </div>
            </div>

            <div style={styles.formColumn}>
              <label style={styles.label}>
                Fish Image
              </label>

              <div style={styles.imageUploadBox}>
                {preview ? (
                  <img
                    src={preview}
                    alt={
                      form.name || "Fish"
                    }
                    style={styles.previewImage}
                  />
                ) : (
                  <div style={styles.noImage}>
                    No image selected
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={styles.fileInput}
              />

              <div style={styles.helperText}>
                Images are uploaded to the{" "}
                <strong>
                  {STORAGE_BUCKET}
                </strong>{" "}
                bucket under the{" "}
                <strong>fish</strong> folder.
              </div>

              <label style={styles.label}>
                Description
              </label>

              <textarea
                style={styles.textarea}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe this fish..."
                rows={7}
              />
            </div>
          </div>

          <div style={styles.modalFooter}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : form.id
                ? "Update Product"
                : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryModal({
  category,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(
    category || EMPTY_CATEGORY
  );

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [preview, setPreview] = useState(
    category?.image_url || ""
  );

  useEffect(() => {
    setForm(category || EMPTY_CATEGORY);
    setSelectedFile(null);
    setPreview(category?.image_url || "");
  }, [category]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleNameChange(value) {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: previous.id
        ? previous.slug
        : slugify(value),
    }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);

    setPreview(objectUrl);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter category name.");
      return;
    }

    await onSave(form, selectedFile);
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalSmall}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>
              {form.id
                ? "Edit Category"
                : "Add Category"}
            </h2>

            <div style={styles.modalSubtitle}>
              Manage aquarium categories
            </div>
          </div>

          <button
            style={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>
            Category Name *
          </label>

          <input
            style={styles.input}
            value={form.name}
            onChange={(event) =>
              handleNameChange(
                event.target.value
              )
            }
            placeholder="Example: Imported Bettas"
            required
          />

          <label style={styles.label}>
            Slug
          </label>

          <input
            style={styles.input}
            value={form.slug}
            onChange={(event) =>
              updateField(
                "slug",
                slugify(
                  event.target.value
                )
              )
            }
            placeholder="imported-bettas"
          />

          <label style={styles.label}>
            Category Image
          </label>

          {preview ? (
            <img
              src={preview}
              alt={form.name}
              style={styles.categoryPreview}
            />
          ) : (
            <div style={styles.noImage}>
              No image selected
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />

          <div style={styles.helperText}>
            Category images are uploaded to the{" "}
            <strong>
              {STORAGE_BUCKET}/categories
            </strong>{" "}
            folder.
          </div>

          <div style={styles.modalFooter}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : form.id
                ? "Update Category"
                : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StorageView({
  fish,
  categories,
}) {
  const fishImages = fish.filter(
    (item) => item.image_url
  );

  const categoryImages =
    categories.filter(
      (item) => item.image_url
    );

  return (
    <div>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>
            Image Storage
          </h2>

          <p style={styles.sectionSubtitle}>
            Images currently referenced by
            your catalogue.
          </p>
        </div>
      </div>

      <div style={styles.storageInfo}>
        <div style={styles.storageInfoCard}>
          <strong>Bucket</strong>
          <div>{STORAGE_BUCKET}</div>
        </div>

        <div style={styles.storageInfoCard}>
          <strong>Fish Images</strong>
          <div>{fishImages.length}</div>
        </div>

        <div style={styles.storageInfoCard}>
          <strong>Category Images</strong>
          <div>
            {categoryImages.length}
          </div>
        </div>
      </div>

      {fishImages.length === 0 &&
      categoryImages.length === 0 ? (
        <div style={styles.emptyState}>
          No images have been uploaded yet.
        </div>
      ) : (
        <div style={styles.storageGrid}>
          {fishImages.map((item) => (
            <div
              key={`fish-${item.id}`}
              style={styles.storageCard}
            >
              <img
                src={item.image_url}
                alt={item.name}
                style={styles.storageImage}
              />

              <div
                style={
                  styles.storageCardBody
                }
              >
                <strong>
                  {item.name}
                </strong>

                <span>Fish</span>
              </div>
            </div>
          ))}

          {categoryImages.map(
            (item) => (
              <div
                key={`category-${item.id}`}
                style={
                  styles.storageCard
                }
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={
                    styles.storageImage
                  }
                />

                <div
                  style={
                    styles.storageCardBody
                  }
                >
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    Category
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function AdminDashboard({
  user,
  onLogout,
}) {
  const [activeTab, setActiveTab] =
    useState("fish");

  const [fish, setFish] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [fishModal, setFishModal] =
    useState(null);

  const [categoryModal, setCategoryModal] =
    useState(null);

  const [search, setSearch] =
    useState("");

  async function loadFish() {
    if (!supabase) return;

    const result = await supabase
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (result.error) {
      console.error(
        "Products loading error:",
        result.error
      );

      return;
    }

    setFish(result.data || []);
  }

  async function ensureDefaultCategories() {
    if (!supabase) return;

    const existingResult =
      await supabase
        .from("categories")
        .select(
          "id,name,slug,image_url,created_at"
        );

    if (existingResult.error) {
      console.error(
        "Category loading error:",
        existingResult.error
      );

      return;
    }

    const existing =
      existingResult.data || [];

    const existingSlugs =
      new Set(
        existing.map(
          (item) => item.slug
        )
      );

    const missing =
      DEFAULT_CATEGORIES.filter(
        (category) =>
          !existingSlugs.has(
            category.slug
          )
      );

    if (missing.length > 0) {
      const insertResult =
        await supabase
          .from("categories")
          .insert(
            missing.map(
              (category) => ({
                name: category.name,
                slug: category.slug,
                image_url: "",
              })
            )
          );

      if (insertResult.error) {
        console.error(
          "Default category creation error:",
          insertResult.error
        );
      }
    }
  }

  async function loadCategories() {
    if (!supabase) return;

    await ensureDefaultCategories();

    const result =
      await supabase
        .from("categories")
        .select("*")
        .order("name", {
          ascending: true,
        });

    if (result.error) {
      console.error(
        "Category loading error:",
        result.error
      );

      return;
    }

    setCategories(
      result.data || []
    );
  }

  async function loadAll() {
    setLoading(true);

    await Promise.all([
      loadFish(),
      loadCategories(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const productsChannel =
      supabase
        .channel(
          "admin-products-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "products",
          },
          () => {
            loadFish();
          }
        )
        .subscribe();

    const categoriesChannel =
      supabase
        .channel(
          "admin-categories-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "categories",
          },
          () => {
            loadCategories();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        productsChannel
      );

      supabase.removeChannel(
        categoriesChannel
      );
    };
  }, []);

  async function handleSaveFish(
    form,
    file
  ) {
    if (!supabase) return;

    setSaving(true);

    try {
      let imageUrl =
        form.image_url || "";

      if (file) {
        imageUrl =
          await uploadImage(
            file,
            "fish"
          );
      }

      // Keep this payload aligned with the public.products table:
      // id, name, category, price, description, image_url, stock, created_at.
      const payload = {
        name: form.name.trim(),

        category:
          form.category?.trim() || "",

        price:
          form.price === "" ||
          form.price === null ||
          form.price === undefined
            ? null
            : Number(form.price),

        description:
          form.description?.trim() || "",

        stock:
          form.stock === "" ||
          form.stock === null ||
          form.stock === undefined
            ? 0
            : Number(form.stock),

        image_url: imageUrl,
      };

      let result;

      if (form.id) {
        result = await supabase
          .from("products")
          .update(payload)
          .eq("id", form.id);
      } else {
        result = await supabase
          .from("products")
          .insert(payload);
      }

      if (result.error) {
        throw result.error;
      }

      await loadFish();

      setFishModal(null);
    } catch (error) {
      console.error(
        "Product save error:",
        error
      );

      alert(
        `Unable to save product.\n\n${
          error?.message ||
          "Unknown error"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteFish(
    item
  ) {
    const confirmed =
      window.confirm(
        `Delete "${item.name}"?\n\nThis will remove the product from the website catalogue.`
      );

    if (!confirmed) return;

    const result =
      await supabase
        .from("products")
        .delete()
        .eq("id", item.id);

    if (result.error) {
      alert(
        `Unable to delete product.\n\n${result.error.message}`
      );

      return;
    }

    await loadFish();
  }

  async function handleSaveCategory(
    form,
    file
  ) {
    if (!supabase) return;

    setSaving(true);

    try {
      let imageUrl =
        form.image_url || "";

      if (file) {
        imageUrl =
          await uploadImage(
            file,
            "categories"
          );
      }

      // Keep this payload aligned with the public.categories table:
      // id, name, slug, image_url, created_at.
      const payload = {
        name: form.name.trim(),

        slug:
          slugify(form.slug) ||
          slugify(form.name),

        image_url: imageUrl,
      };

      let result;

      if (form.id) {
        result =
          await supabase
            .from("categories")
            .update(payload)
            .eq(
              "id",
              form.id
            );
      } else {
        result =
          await supabase
            .from("categories")
            .insert(payload);
      }

      if (result.error) {
        throw result.error;
      }

      await loadCategories();

      setCategoryModal(null);
    } catch (error) {
      console.error(
        "Category save error:",
        error
      );

      alert(
        `Unable to save category.\n\n${
          error?.message ||
          "Unknown error"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(
    category
  ) {
    const productsUsingCategory =
      fish.filter(
        (item) =>
          String(
            item.category
          ).trim().toLowerCase() ===
          String(
            category.name
          ).trim().toLowerCase()
      );

    if (
      productsUsingCategory.length >
      0
    ) {
      alert(
        `Cannot delete "${category.name}" because ${productsUsingCategory.length} product(s) are using this category.\n\nMove those products to another category first.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${category.name}"?`
      );

    if (!confirmed) return;

    const result =
      await supabase
        .from("categories")
        .delete()
        .eq(
          "id",
          category.id
        );

    if (result.error) {
      alert(
        `Unable to delete category.\n\n${result.error.message}`
      );

      return;
    }

    await loadCategories();
  }

  const filteredFish =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) return fish;

      return fish.filter(
        (item) => {
          return [
            item.name,
            item.description,
            item.category,
            item.price,
            item.stock,
          ]
            .filter(
              (value) =>
                value !== null &&
                value !== undefined
            )
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(query)
            );
        }
      );
    }, [fish, search]);

  const stats =
    useMemo(() => {
      return {
        fish: fish.length,

        activeFish:
          fish.filter(
            (item) =>
              Number(item.stock) >
              0
          ).length,

        categories:
          categories.length,

        featured: 0,
      };
    }, [fish, categories]);

  if (loading) {
    return (
      <div
        style={
          styles.loadingPage
        }
      >
        <div
          style={
            styles.loadingSpinner
          }
        />

        <div>
          Loading Mr. Aquatic
          Vizag...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.adminPage}>
      <header style={styles.topbar}>
        <div style={styles.brandArea}>
          <div style={styles.brand}>
            MR. AQUATIC VIZAG
          </div>

          <div
            style={
              styles.brandSubtitle
            }
          >
            Aquarium Management
          </div>
        </div>

        <div
          style={
            styles.topbarRight
          }
        >
          <div
            style={
              styles.userEmail
            }
          >
            {user?.email}
          </div>

          <button
            style={
              styles.logoutButton
            }
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={styles.dashboard}>
        <aside
          style={styles.sidebar}
        >
          <div
            style={
              styles.sidebarTitle
            }
          >
            Dashboard
          </div>

          <button
            style={{
              ...styles.sidebarButton,
              ...(activeTab ===
              "fish"
                ? styles.sidebarButtonActive
                : {}),
            }}
            onClick={() =>
              setActiveTab("fish")
            }
          >
            <span>🐟</span>
            Fish Management
          </button>

          <button
            style={{
              ...styles.sidebarButton,
              ...(activeTab ===
              "categories"
                ? styles.sidebarButtonActive
                : {}),
            }}
            onClick={() =>
              setActiveTab(
                "categories"
              )
            }
          >
            <span>📂</span>
            Categories
          </button>

          <button
            style={{
              ...styles.sidebarButton,
              ...(activeTab ===
              "storage"
                ? styles.sidebarButtonActive
                : {}),
            }}
            onClick={() =>
              setActiveTab("storage")
            }
          >
            <span>🖼️</span>
            Image Storage
          </button>

          <div
            style={
              styles.sidebarStats
            }
          >
            <div
              style={
                styles.sidebarStat
              }
            >
              <span>
                Total Products
              </span>

              <strong>
                {stats.fish}
              </strong>
            </div>

            <div
              style={
                styles.sidebarStat
              }
            >
              <span>
                Available
              </span>

              <strong>
                {stats.activeFish}
              </strong>
            </div>

            <div
              style={
                styles.sidebarStat
              }
            >
              <span>
                Categories
              </span>

              <strong>
                {stats.categories}
              </strong>
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          {activeTab ===
            "fish" && (
            <div>
              <div
                style={
                  styles.sectionHeader
                }
              >
                <div>
                  <h1
                    style={
                      styles.sectionTitle
                    }
                  >
                    Fish Management
                  </h1>

                  <p
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Manage the fish
                    displayed on
                    the Mr. Aquatic
                    Vizag website.
                  </p>
                </div>

                <button
                  style={
                    styles.primaryButton
                  }
                  onClick={() =>
                    setFishModal({
                      ...EMPTY_FISH,
                    })
                  }
                >
                  + Add Fish
                </button>
              </div>

              <div
                style={
                  styles.statsGrid
                }
              >
                <div
                  style={
                    styles.statCard
                  }
                >
                  <span>
                    Total Fish
                  </span>

                  <strong>
                    {stats.fish}
                  </strong>
                </div>

                <div
                  style={
                    styles.statCard
                  }
                >
                  <span>
                    Available Fish
                  </span>

                  <strong>
                    {
                      stats.activeFish
                    }
                  </strong>
                </div>

                <div
                  style={
                    styles.statCard
                  }
                >
                  <span>
                    Sold Out
                  </span>

                  <strong>
                    {fish.filter(
                      (item) =>
                        Number(
                          item.stock
                        ) <= 0
                    ).length}
                  </strong>
                </div>

                <div
                  style={
                    styles.statCard
                  }
                >
                  <span>
                    Categories
                  </span>

                  <strong>
                    {
                      stats.categories
                    }
                  </strong>
                </div>
              </div>

              <div
                style={
                  styles.toolbar
                }
              >
                <input
                  style={
                    styles.searchInput
                  }
                  value={search}
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search fish, category..."
                />

                <button
                  style={
                    styles.refreshButton
                  }
                  onClick={
                    loadAll
                  }
                >
                  ↻ Refresh
                </button>
              </div>

              {filteredFish.length ===
              0 ? (
                <div
                  style={
                    styles.emptyState
                  }
                >
                  <div
                    style={
                      styles.emptyIcon
                    }
                  >
                    🐟
                  </div>

                  <h3>
                    No fish found
                  </h3>

                  <p>
                    Add your first
                    fish using the
                    "Add Fish"
                    button.
                  </p>
                </div>
              ) : (
                <div
                  style={
                    styles.tableWrapper
                  }
                >
                  <table
                    style={
                      styles.table
                    }
                  >
                    <thead>
                      <tr>
                        <th
                          style={
                            styles.th
                          }
                        >
                          Image
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Fish
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Category
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Price
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Stock
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Status
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredFish.map(
                        (item) => (
                          <tr
                            key={
                              item.id
                            }
                          >
                            <td
                              style={
                                styles.td
                              }
                            >
                              {item.image_url ? (
                                <img
                                  src={
                                    getPublicUrl(
                                      item.image_url
                                    )
                                  }
                                  alt={
                                    item.name
                                  }
                                  style={
                                    styles.tableImage
                                  }
                                />
                              ) : (
                                <div
                                  style={
                                    styles.tableNoImage
                                  }
                                >
                                  —
                                </div>
                              )}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <div
                                style={
                                  styles.fishName
                                }
                              >
                                {
                                  item.name
                                }
                              </div>

                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <span
                                style={
                                  styles.categoryBadge
                                }
                              >
                                {
                                  item.category ||
                                  "Other"
                                }
                              </span>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {formatPrice(
                                item.price
                              ) ||
                                "—"}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {
                                item.stock ??
                                0
                              }
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <span
                                style={{
                                  ...styles.statusBadge,
                                  ...(Number(
                                    item.stock
                                  ) >
                                  0
                                    ? styles.statusAvailable
                                    : styles.statusOther),
                                }}
                              >
                                {Number(
                                  item.stock
                                ) >
                                0
                                  ? "Available"
                                  : "Sold Out"}
                              </span>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <div
                                style={
                                  styles.actionButtons
                                }
                              >
                                <button
                                  style={
                                    styles.editButton
                                  }
                                  onClick={() =>
                                    setFishModal({
                                      ...item,
                                    })
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  style={
                                    styles.deleteButton
                                  }
                                  onClick={() =>
                                    handleDeleteFish(
                                      item
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab ===
            "categories" && (
            <div>
              <div
                style={
                  styles.sectionHeader
                }
              >
                <div>
                  <h1
                    style={
                      styles.sectionTitle
                    }
                  >
                    Categories
                  </h1>

                  <p
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Manage fish
                    categories used
                    by your website.
                  </p>
                </div>

                <button
                  style={
                    styles.primaryButton
                  }
                  onClick={() =>
                    setCategoryModal({
                      ...EMPTY_CATEGORY,
                    })
                  }
                >
                  + Add Category
                </button>
              </div>

              <div
                style={
                  styles.categoryGrid
                }
              >
                {categories.map(
                  (category) => (
                    <div
                      key={
                        category.id
                      }
                      style={
                        styles.categoryCard
                      }
                    >
                      <div
                        style={
                          styles.categoryImageWrapper
                        }
                      >
                        {category.image_url ? (
                          <img
                            src={
                              getPublicUrl(
                                category.image_url
                              )
                            }
                            alt={
                              category.name
                            }
                            style={
                              styles.categoryCardImage
                            }
                          />
                        ) : (
                          <div
                            style={
                              styles.categoryPlaceholder
                            }
                          >
                            🐟
                          </div>
                        )}
                      </div>

                      <div
                        style={
                          styles.categoryCardContent
                        }
                      >
                        <h3
                          style={
                            styles.categoryCardTitle
                          }
                        >
                          {
                            category.name
                          }
                        </h3>

                        <div
                          style={
                            styles.categorySlug
                          }
                        >
                          /
                          {
                            category.slug
                          }
                        </div>

                        <div
                          style={
                            styles.categoryActions
                          }
                        >
                          <button
                            style={
                              styles.editButton
                            }
                            onClick={() =>
                              setCategoryModal({
                                ...category,
                              })
                            }
                          >
                            Edit
                          </button>

                          <button
                            style={
                              styles.deleteButton
                            }
                            onClick={() =>
                              handleDeleteCategory(
                                category
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeTab ===
            "storage" && (
            <StorageView
              fish={fish}
              categories={
                categories
              }
            />
          )}
        </main>
      </div>

      {fishModal && (
        <FishModal
          fish={fishModal}
          categories={categories}
          onClose={() =>
            setFishModal(null)
          }
          onSave={
            handleSaveFish
          }
          saving={saving}
        />
      )}

      {categoryModal && (
        <CategoryModal
          category={
            categoryModal
          }
          onClose={() =>
            setCategoryModal(
              null
            )
          }
          onSave={
            handleSaveCategory
          }
          saving={saving}
        />
      )}
    </div>
  );
}

export default function Admin() {
  const [user, setUser] =
    useState(null);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [authError, setAuthError] =
    useState("");

  async function checkAdmin(
    userToCheck
  ) {
    if (
      !supabase ||
      !userToCheck
    ) {
      setAuthError(
        "Authentication unavailable."
      );

      setCheckingAuth(false);

      return;
    }

    const result =
      await supabase
        .from("admins")
        .select("*")
        .eq(
          "email",
          userToCheck.email
        )
        .maybeSingle();

    if (result.error) {
      console.error(
        "Admin verification error:",
        result.error
      );

      setAuthError(
        "Unable to verify admin access."
      );

      await supabase.auth.signOut();

      setUser(null);
      setCheckingAuth(false);

      return;
    }

    if (!result.data) {
      setAuthError(
        "This account does not have admin access."
      );

      await supabase.auth.signOut();

      setUser(null);
      setCheckingAuth(false);

      return;
    }

    setUser(userToCheck);
    setAuthError("");
    setCheckingAuth(false);
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (!supabase) {
        setAuthError(
          "Supabase is not configured. Check your .env file."
        );

        setCheckingAuth(false);

        return;
      }

      const result =
        await supabase.auth.getSession();

      if (!mounted) return;

      if (result.error) {
        setAuthError(
          result.error.message
        );

        setCheckingAuth(false);

        return;
      }

      if (
        result.data.session
          ?.user
      ) {
        await checkAdmin(
          result.data.session
            .user
        );
      } else {
        setCheckingAuth(false);
      }
    }

    initialize();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {
          if (!mounted) return;

          if (
            session?.user
          ) {
            await checkAdmin(
              session.user
            );
          } else {
            setUser(null);
            setCheckingAuth(
              false
            );
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
  }

  if (checkingAuth) {
    return (
      <div
        style={
          styles.loadingPage
        }
      >
        <div
          style={
            styles.loadingSpinner
          }
        />

        <div>
          Checking admin
          access...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {authError && (
          <div
            style={
              styles.globalError
            }
          >
            {authError}
          </div>
        )}

        <AdminLogin
          onLogin={(
            loggedInUser
          ) =>
            checkAdmin(
              loggedInUser
            )
          }
        />
      </>
    );
  }

  return (
    <AdminDashboard
      user={user}
      onLogout={handleLogout}
    />
  );
}

const styles = {
  loginPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  loginCard: {
    width: "100%",
    maxWidth: "440px",
    boxSizing: "border-box",
    background: "#ffffff",
    border: "1px solid #e5ecef",
    borderTop: "4px solid #087f8c",
    borderRadius: "18px",
    padding: "42px 44px 40px",
    boxShadow: "0 20px 55px rgba(15, 39, 48, 0.10)",
  },

  loginLogo: {
    fontSize: "25px",
    fontWeight: 900,
    letterSpacing: "1.8px",
    color: "#063b48",
    textAlign: "center",
  },

  loginSubtitle: {
    textAlign: "center",
    marginTop: "8px",
    marginBottom: "30px",
    color: "#55727a",
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.2px",
  },

  loginButton: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #087f8c, #075e69)",
    color: "#fff",
    borderRadius: "10px",
    padding: "13px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    marginTop: "8px",
    boxShadow: "0 8px 18px rgba(8,127,140,0.18)",
  },

  adminPage: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#102a33",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  topbar: {
    minHeight: "72px",
    height: "auto",
    background: "linear-gradient(135deg, #03252e 0%, #064452 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 28px",
    boxSizing: "border-box",
    gap: "20px",
    position: "relative",
    zIndex: 20,
    boxShadow:
      "0 2px 12px rgba(0,0,0,0.12)",
  },

  brandArea: {
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    fontSize: "19px",
    fontWeight: 900,
    letterSpacing: "1.5px",
  },

  brandSubtitle: {
    fontSize: "11px",
    opacity: 0.7,
    marginTop: "2px",
  },

  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    flexShrink: 0,
    justifyContent: "flex-end",
  },

  userEmail: {
    fontSize: "13px",
    opacity: 0.85,
  },

  logoutButton: {
    border:
      "1px solid rgba(255,255,255,0.3)",
    background:
      "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: "8px",
    padding: "9px 15px",
    cursor: "pointer",
    fontWeight: 600,
  },

  dashboard: {
    display: "flex",
    minHeight:
      "calc(100vh - 72px)",
  },

  sidebar: {
    width: "245px",
    background: "#062f3b",
    borderRight:
      "1px solid rgba(255,255,255,0.08)",
    padding: "25px 15px",
    flexShrink: 0,
  },

  sidebarTitle: {
    fontSize: "12px",
    fontWeight: 800,
    textTransform:
      "uppercase",
    letterSpacing: "1px",
    color: "#7fa9b1",
    padding:
      "0 12px 12px",
  },

  sidebarButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "12px 13px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: 600,
    color: "#c4dde1",
    cursor: "pointer",
    marginBottom: "4px",
  },

  sidebarButtonActive: {
    background: "linear-gradient(135deg, rgba(39, 205, 201, 0.20), rgba(13, 133, 151, 0.18))",
    color: "#68e1dc",
    boxShadow: "inset 3px 0 0 #45d7d2",
  },

  sidebarStats: {
    marginTop: "30px",
    borderTop:
      "1px solid rgba(255,255,255,0.10)",
    paddingTop: "20px",
  },

  sidebarStat: {
    display: "flex",
    justifyContent:
      "space-between",
    padding: "9px 12px",
    color: "#9fc0c5",
    fontSize: "13px",
  },

  main: {
    flex: 1,
    padding: "32px",
    minWidth: 0,
    background: "#ffffff",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: "20px",
    marginBottom: "25px",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 1,
  },

  sectionTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 800,
    color: "#0f2730",
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },

  statCard: {
    background: "#fff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  toolbar: {
    display: "flex",
    gap: "12px",
    marginBottom: "18px",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border:
      "1px solid #dbe2e8",
    borderRadius: "9px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },

  refreshButton: {
    border:
      "1px solid #dbe2e8",
    background: "#fff",
    borderRadius: "9px",
    padding: "0 16px",
    cursor: "pointer",
    fontWeight: 600,
    color: "#475569",
  },

  primaryButton: {
    border: "none",
    background:
      "linear-gradient(135deg, #087f8c, #0b6470)",
    color: "#fff",
    borderRadius: "9px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxShadow:
      "0 5px 14px rgba(8,127,140,0.18)",
  },

  secondaryButton: {
    border:
      "1px solid #dbe2e8",
    background: "#fff",
    color: "#475569",
    borderRadius: "9px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: 600,
  },

  tableWrapper: {
    background: "#fff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "13px",
    overflow: "auto",
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
    minWidth: "1050px",
  },

  th: {
    textAlign: "left",
    padding: "14px 15px",
    background: "#f8fafc",
    borderBottom:
      "1px solid #e5e7eb",
    fontSize: "12px",
    textTransform:
      "uppercase",
    letterSpacing: "0.5px",
    color: "#64748b",
  },

  td: {
    padding: "13px 15px",
    borderBottom:
      "1px solid #edf0f2",
    verticalAlign:
      "middle",
    fontSize: "14px",
  },

  tableImage: {
    width: "58px",
    height: "58px",
    objectFit: "cover",
    borderRadius: "9px",
    display: "block",
  },

  tableNoImage: {
    width: "58px",
    height: "58px",
    borderRadius: "9px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
  },

  fishName: {
    fontWeight: 700,
    color: "#17212b",
  },

  smallText: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "4px",
  },

  categoryBadge: {
    display: "inline-flex",
    background: "#edf8f9",
    color: "#087f8c",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
  },

  statusAvailable: {
    background: "#e8f8ee",
    color: "#15803d",
  },

  statusOther: {
    background: "#f1f5f9",
    color: "#64748b",
  },

  actionButtons: {
    display: "flex",
    gap: "7px",
  },

  editButton: {
    border:
      "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    borderRadius: "7px",
    padding: "7px 10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "12px",
  },

  deleteButton: {
    border:
      "1px solid #fecaca",
    background: "#fff",
    color: "#dc2626",
    borderRadius: "7px",
    padding: "7px 10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "12px",
  },

  emptyState: {
    background: "#fff",
    border:
      "1px dashed #cbd5e1",
    borderRadius: "13px",
    padding: "60px 20px",
    textAlign: "center",
    color: "#64748b",
  },

  emptyIcon: {
    fontSize: "45px",
    marginBottom: "10px",
  },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "18px",
  },

  categoryCard: {
    background: "#fff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "13px",
    overflow: "hidden",
  },

  categoryImageWrapper: {
    width: "100%",
    height: "150px",
    background: "#eef4f6",
  },

  categoryCardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  categoryPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "45px",
  },

  categoryCardContent: {
    padding: "16px",
  },

  categoryCardTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#17212b",
  },

  categorySlug: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "5px",
  },

  categoryActions: {
    display: "flex",
    gap: "8px",
    marginTop: "15px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(2,15,20,0.68)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
    overflowY: "auto",
  },

  modal: {
    width: "100%",
    maxWidth: "900px",
    maxHeight: "94vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "16px",
    padding: "25px",
    boxShadow:
      "0 30px 90px rgba(0,0,0,0.35)",
  },

  modalSmall: {
    width: "100%",
    maxWidth: "540px",
    maxHeight: "94vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "16px",
    padding: "25px",
    boxShadow:
      "0 30px 90px rgba(0,0,0,0.35)",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    marginBottom: "24px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#102b34",
  },

  modalSubtitle: {
    color: "#94a3b8",
    fontSize: "13px",
    marginTop: "5px",
  },

  closeButton: {
    width: "34px",
    height: "34px",
    border: "none",
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "23px",
    cursor: "pointer",
    lineHeight: 1,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "25px",
  },

  formColumn: {
    minWidth: 0,
  },

  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#31545d",
    marginBottom: "7px",
    marginTop: "15px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #c9dfe3",
    borderRadius: "10px",
    padding: "12px 13px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#17343c",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #dbe2e8",
    borderRadius: "8px",
    padding: "11px 12px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },

  imageUploadBox: {
    width: "100%",
    height: "230px",
    borderRadius: "10px",
    background: "#f1f5f9",
    overflow: "hidden",
    marginBottom: "10px",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },

  noImage: {
    width: "100%",
    minHeight: "100px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    color: "#94a3b8",
    fontSize: "13px",
  },

  fileInput: {
    width: "100%",
    fontSize: "13px",
    marginTop: "5px",
  },

  helperText: {
    color: "#94a3b8",
    fontSize: "11px",
    marginTop: "7px",
  },

  stockHelper: {
    color: "#94a3b8",
    fontSize: "11px",
    marginTop: "7px",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    borderTop:
      "1px solid #e5e7eb",
    marginTop: "25px",
    paddingTop: "18px",
  },

  categoryPreview: {
    width: "100%",
    height: "170px",
    objectFit: "cover",
    borderRadius: "9px",
    display: "block",
    marginBottom: "10px",
  },

  storageInfo: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },

  storageInfoCard: {
    background: "#fff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
  },

  storageGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(210px, 1fr))",
    gap: "18px",
  },

  storageCard: {
    background: "#fff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
  },

  storageImage: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    display: "block",
  },

  storageCardBody: {
    padding: "13px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
    background: "#f5f8fa",
    color: "#475569",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  loadingSpinner: {
    width: "30px",
    height: "30px",
    border:
      "3px solid #dbeafe",
    borderTopColor:
      "#087f8c",
    borderRadius: "50%",
    animation:
      "spin 1s linear infinite",
  },

  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border:
      "1px solid #fecaca",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    marginTop: "15px",
  },

  globalError: {
    position: "fixed",
    top: "15px",
    left: "50%",
    transform:
      "translateX(-50%)",
    zIndex: 2000,
    background: "#fee2e2",
    color: "#991b1b",
    border:
      "1px solid #fecaca",
    borderRadius: "8px",
    padding: "10px 15px",
    fontSize: "13px",
    boxShadow:
      "0 8px 25px rgba(0,0,0,0.15)",
  },
};