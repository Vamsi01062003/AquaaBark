import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const STORAGE_BUCKET = "aquaa-bark-images";

const EMPTY_FISH = {
  id: null,
  name: "",
  category_id: "",
  price: "",
  price_label: "",
  description: "",
  size: "",
  origin: "",
  availability: "Available",
  image_url: "",
  is_featured: false,
  is_active: true,
};

const EMPTY_CATEGORY = {
  id: null,
  name: "",
  slug: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

export default function Admin() {
  const [session, setSession] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [fish, setFish] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [activeSection, setActiveSection] = useState("dashboard");

  const [fishSearch, setFishSearch] = useState("");
  const [fishCategoryFilter, setFishCategoryFilter] = useState("all");

  const [categorySearch, setCategorySearch] = useState("");

  const [showFishModal, setShowFishModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [fishForm, setFishForm] = useState(EMPTY_FISH);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);

  const [fishImageFile, setFishImageFile] = useState(null);
  const [categoryImageFile, setCategoryImageFile] = useState(null);

  const [uploadingFishImage, setUploadingFishImage] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);

  useEffect(() => {
    checkAuthentication();

    const authListener = supabase.auth.onAuthStateChange(function (
      event,
      currentSession
    ) {
      setSession(currentSession);

      if (!currentSession) {
        setAdmin(null);
        setCheckingAuth(false);
      }
    });

    return function () {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    loadAdmin();

    const fishChannel = supabase
      .channel("admin-fish-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fish",
        },
        function () {
          loadFish();
        }
      )
      .subscribe();

    const categoryChannel = supabase
      .channel("admin-category-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        function () {
          loadCategories();
        }
      )
      .subscribe();

    return function () {
      supabase.removeChannel(fishChannel);
      supabase.removeChannel(categoryChannel);
    };
  }, [session]);

  async function checkAuthentication() {
    try {
      const result = await supabase.auth.getSession();

      if (result.error) {
        throw result.error;
      }

      setSession(result.data.session);

      if (!result.data.session) {
        setCheckingAuth(false);
        return;
      }

      await loadAdmin(result.data.session.user.id);
    } catch (err) {
      setError(err.message || "Authentication error");
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadAdmin(userId) {
    try {
      const currentUserId =
        userId || session?.user?.id || (await supabase.auth.getUser()).data.user
          ?.id;

      if (!currentUserId) return;

      const result = await supabase
        .from("admins")
        .select("id,email,name,is_active")
        .eq("id", currentUserId)
        .maybeSingle();

      if (result.error) {
        throw result.error;
      }

      if (!result.data || !result.data.is_active) {
        await supabase.auth.signOut();
        setError("You are not authorized to access the admin panel.");
        return;
      }

      setAdmin(result.data);

      await Promise.all([loadFish(), loadCategories()]);
    } catch (err) {
      setError(err.message || "Unable to load admin account.");
    }
  }

  async function loadFish() {
    const result = await supabase
      .from("fish")
      .select("*")
      .order("created_at", { ascending: false });

    if (!result.error) {
      setFish(result.data || []);
    }
  }

  async function loadCategories() {
    const result = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!result.error) {
      setCategories(result.data || []);
    }
  }

  function notify(text) {
    setMessage(text);
    setError("");

    window.setTimeout(function () {
      setMessage("");
    }, 3500);
  }

  function notifyError(text) {
    setError(text);
    setMessage("");

    window.setTimeout(function () {
      setError("");
    }, 5000);
  }

  function categoryName(categoryId) {
    const category = categories.find(function (item) {
      return item.id === categoryId;
    });

    return category ? category.name : "Uncategorized";
  }

  const filteredFish = useMemo(
    function () {
      const search = fishSearch.trim().toLowerCase();

      return fish.filter(function (item) {
        const matchesSearch =
          !search ||
          String(item.name || "").toLowerCase().includes(search) ||
          String(item.description || "").toLowerCase().includes(search) ||
          String(item.origin || "").toLowerCase().includes(search);

        const matchesCategory =
          fishCategoryFilter === "all" ||
          item.category_id === fishCategoryFilter;

        return matchesSearch && matchesCategory;
      });
    },
    [fish, fishSearch, fishCategoryFilter]
  );

  const filteredCategories = useMemo(
    function () {
      const search = categorySearch.trim().toLowerCase();

      return categories.filter(function (item) {
        return (
          !search ||
          String(item.name || "").toLowerCase().includes(search) ||
          String(item.slug || "").toLowerCase().includes(search)
        );
      });
    },
    [categories, categorySearch]
  );

  const activeFishCount = fish.filter(function (item) {
    return item.is_active;
  }).length;

  const featuredFishCount = fish.filter(function (item) {
    return item.is_featured && item.is_active;
  }).length;

  const activeCategoryCount = categories.filter(function (item) {
    return item.is_active;
  }).length;

  function openNewFish() {
    setFishForm(EMPTY_FISH);
    setFishImageFile(null);
    setShowFishModal(true);
  }

  function openEditFish(item) {
    setFishForm({
      id: item.id,
      name: item.name || "",
      category_id: item.category_id || "",
      price: item.price ?? "",
      price_label: item.price_label || "",
      description: item.description || "",
      size: item.size || "",
      origin: item.origin || "",
      availability: item.availability || "Available",
      image_url: item.image_url || "",
      is_featured: Boolean(item.is_featured),
      is_active: Boolean(item.is_active),
    });

    setFishImageFile(null);
    setShowFishModal(true);
  }

  function openNewCategory() {
    setCategoryForm({
      ...EMPTY_CATEGORY,
      sort_order: categories.length + 1,
    });

    setCategoryImageFile(null);
    setShowCategoryModal(true);
  }

  function openEditCategory(item) {
    setCategoryForm({
      id: item.id,
      name: item.name || "",
      slug: item.slug || "",
      image_url: item.image_url || "",
      sort_order: item.sort_order ?? 0,
      is_active: Boolean(item.is_active),
    });

    setCategoryImageFile(null);
    setShowCategoryModal(true);
  }

  function makeSlug(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function uploadImage(file, folder) {
    if (!file) return null;

    const extension =
      file.name.indexOf(".") >= 0
        ? file.name.split(".").pop().toLowerCase()
        : "jpg";

    const fileName =
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2) +
      "." +
      extension;

    const filePath = folder + "/" + fileName;

    const uploadResult = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    const publicResult = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return publicResult.data.publicUrl;
  }

  async function saveFish(event) {
    event.preventDefault();

    if (!fishForm.name.trim()) {
      notifyError("Fish name is required.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = fishForm.image_url || "";

      if (fishImageFile) {
        setUploadingFishImage(true);
        imageUrl = await uploadImage(fishImageFile, "fish");
        setUploadingFishImage(false);
      }

      const payload = {
        name: fishForm.name.trim(),
        category_id: fishForm.category_id || null,
        price: fishForm.price === "" ? null : Number(fishForm.price),
        price_label: fishForm.price_label.trim() || null,
        description: fishForm.description.trim() || null,
        size: fishForm.size.trim() || null,
        origin: fishForm.origin.trim() || null,
        availability: fishForm.availability || "Available",
        image_url: imageUrl || null,
        is_featured: Boolean(fishForm.is_featured),
        is_active: Boolean(fishForm.is_active),
      };

      let result;

      if (fishForm.id) {
        result = await supabase
          .from("fish")
          .update(payload)
          .eq("id", fishForm.id);
      } else {
        result = await supabase.from("fish").insert(payload);
      }

      if (result.error) {
        throw result.error;
      }

      setShowFishModal(false);
      setFishImageFile(null);

      await loadFish();

      notify(fishForm.id ? "Fish updated successfully." : "Fish added successfully.");
    } catch (err) {
      setUploadingFishImage(false);
      notifyError(err.message || "Unable to save fish.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteFish(item) {
    const confirmed = window.confirm(
      "Delete " + item.name + "? This cannot be undone."
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const result = await supabase.from("fish").delete().eq("id", item.id);

      if (result.error) {
        throw result.error;
      }

      await loadFish();
      notify("Fish deleted successfully.");
    } catch (err) {
      notifyError(err.message || "Unable to delete fish.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCategory(event) {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      notifyError("Category name is required.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = categoryForm.image_url || "";

      if (categoryImageFile) {
        setUploadingCategoryImage(true);
        imageUrl = await uploadImage(categoryImageFile, "categories");
        setUploadingCategoryImage(false);
      }

      const payload = {
        name: categoryForm.name.trim(),
        slug:
          categoryForm.slug.trim() ||
          makeSlug(categoryForm.name),
        image_url: imageUrl || null,
        sort_order: Number(categoryForm.sort_order) || 0,
        is_active: Boolean(categoryForm.is_active),
      };

      let result;

      if (categoryForm.id) {
        result = await supabase
          .from("categories")
          .update(payload)
          .eq("id", categoryForm.id);
      } else {
        result = await supabase.from("categories").insert(payload);
      }

      if (result.error) {
        throw result.error;
      }

      setShowCategoryModal(false);
      setCategoryImageFile(null);

      await loadCategories();

      notify(
        categoryForm.id
          ? "Category updated successfully."
          : "Category added successfully."
      );
    } catch (err) {
      setUploadingCategoryImage(false);
      notifyError(err.message || "Unable to save category.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(item) {
    const confirmed = window.confirm(
      "Delete " +
        item.name +
        "?\n\nFish assigned to this category will become uncategorized."
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const result = await supabase
        .from("categories")
        .delete()
        .eq("id", item.id);

      if (result.error) {
        throw result.error;
      }

      await Promise.all([loadCategories(), loadFish()]);

      notify("Category deleted successfully.");
    } catch (err) {
      notifyError(err.message || "Unable to delete category.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (checkingAuth) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.loadingBox}>Checking admin access...</div>
      </div>
    );
  }

  if (!session || !admin) {
    return (
      <LoginScreen
        onLogin={function (newSession) {
          setSession(newSession);
        }}
      />
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.topbar}>
        <div>
          <div style={styles.brand}>AquaaBark</div>
          <div style={styles.brandSub}>Admin Dashboard</div>
        </div>

        <div style={styles.topActions}>
          <button
            style={styles.websiteButton}
            onClick={function () {
              window.location.href = "/";
            }}
          >
            View Website
          </button>

          <button style={styles.logoutButton} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.adminBox}>
            <div style={styles.avatar}>
              {(admin.name || "A").charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{admin.name || "Admin"}</strong>
              <span>{admin.email}</span>
            </div>
          </div>

          <nav style={styles.nav}>
            <NavButton
              active={activeSection === "dashboard"}
              onClick={function () {
                setActiveSection("dashboard");
              }}
            >
              Dashboard
            </NavButton>

            <NavButton
              active={activeSection === "fish"}
              onClick={function () {
                setActiveSection("fish");
              }}
            >
              Fish Management
            </NavButton>

            <NavButton
              active={activeSection === "categories"}
              onClick={function () {
                setActiveSection("categories");
              }}
            >
              Categories
            </NavButton>

            <NavButton
              active={activeSection === "storage"}
              onClick={function () {
                setActiveSection("storage");
              }}
            >
              Image Storage
            </NavButton>
          </nav>
        </aside>

        <main style={styles.main}>
          {message && <div style={styles.success}>{message}</div>}
          {error && <div style={styles.error}>{error}</div>}

          {activeSection === "dashboard" && (
            <Dashboard
              fish={fish}
              categories={categories}
              activeFishCount={activeFishCount}
              featuredFishCount={featuredFishCount}
              activeCategoryCount={activeCategoryCount}
              onFish={function () {
                setActiveSection("fish");
              }}
              onCategory={function () {
                setActiveSection("categories");
              }}
              onAddFish={openNewFish}
              onAddCategory={openNewCategory}
            />
          )}

          {activeSection === "fish" && (
            <FishManagement
              fish={filteredFish}
              categories={categories}
              search={fishSearch}
              setSearch={setFishSearch}
              categoryFilter={fishCategoryFilter}
              setCategoryFilter={setFishCategoryFilter}
              onAdd={openNewFish}
              onEdit={openEditFish}
              onDelete={deleteFish}
            />
          )}

          {activeSection === "categories" && (
            <CategoryManagement
              categories={filteredCategories}
              search={categorySearch}
              setSearch={setCategorySearch}
              onAdd={openNewCategory}
              onEdit={openEditCategory}
              onDelete={deleteCategory}
            />
          )}

          {activeSection === "storage" && (
            <StorageView fish={fish} categories={categories} />
          )}
        </main>
      </div>

      {showFishModal && (
        <Modal
          title={fishForm.id ? "Edit Fish" : "Add New Fish"}
          onClose={function () {
            if (!loading) setShowFishModal(false);
          }}
        >
          <form onSubmit={saveFish}>
            <div style={styles.formGrid}>
              <Field label="Fish Name *">
                <input
                  style={styles.input}
                  value={fishForm.name}
                  onChange={function (e) {
                    setFishForm({
                      ...fishForm,
                      name: e.target.value,
                    });
                  }}
                  placeholder="Premium Flowerhorn"
                />
              </Field>

              <Field label="Category">
                <select
                  style={styles.input}
                  value={fishForm.category_id}
                  onChange={function (e) {
                    setFishForm({
                      ...fishForm,
                      category_id: e.target.value,
                    });
                  }}
                >
                  <option value="">Select category</option>

                  {categories.map(function (category) {
                    return (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    );
                  })}
                </select>
              </Field>

              <Field label="Price">
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  value={fishForm.price}
                  onChange={function (e) {
                    setFishForm({
                      ...fishForm,
                      price: e.target.value,
                    });
                  }}
                  placeholder="5000"
                />
              </Field>

              <Field label="Price Label">
                <input
                  style={styles.input}
                  value={fishForm.price_label}
                  onChange={function (e) {
                    setFishForm({
                      ...fishForm,
                      price_label: e.target.value,
                    });
                  }}
                  placeholder="Starting from ₹5,000"
                />
              </Field>

              <Field label="Size">
                <input
                  style={styles.input}
                  value={fishForm.size}
                  onChange={function (e) {
                    setFishForm({
                      ...fishForm,
                      size: e.target.value,
                    });
                  }}
                  placeholder="3 - 4 inches"
                />
              </Field>

              <Field label="Origin">
                <input
                  style={styles.input}
                  value={fishForm.origin}
                  onChange={function (e) {
                    setFishForm({
                      ...fishForm,
                      origin: e.target.value,
                    });
                  }}
                  placeholder="Thailand"
                />
              </Field>

              <Field label="Availability">
                <select
                  style={styles.input}
                  value={fishForm.availability}
                  onChange={function (e) {
                    setFishForm({
                      ...fishForm,
                      availability: e.target.value,
                    });
                  }}
                >
                  <option value="Available">Available</option>
                  <option value="Limited">Limited</option>
                  <option value="Pre-Order">Pre-Order</option>
                  <option value="Sold Out">Sold Out</option>
                </select>
              </Field>

              <Field label="Fish Image">
                <input
                  style={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={function (e) {
                    setFishImageFile(e.target.files?.[0] || null);
                  }}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                style={styles.textarea}
                rows="4"
                value={fishForm.description}
                onChange={function (e) {
                  setFishForm({
                    ...fishForm,
                    description: e.target.value,
                  });
                }}
                placeholder="Describe this fish..."
              />
            </Field>

            {fishForm.image_url && !fishImageFile && (
              <div style={styles.currentImageBox}>
                <span>Current Image</span>
                <img
                  src={fishForm.image_url}
                  alt={fishForm.name}
                  style={styles.previewImage}
                />
              </div>
            )}

            {fishImageFile && (
              <div style={styles.selectedFile}>
                New image selected: {fishImageFile.name}
              </div>
            )}

            <div style={styles.checkboxRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={fishForm.is_featured}
                  onChange={function (e) {
                    setFishForm({
                      ...fishForm,
                      is_featured: e.target.checked,
                    });
                  }}
                />
                Featured fish
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={fishForm.is_active}
                  onChange={function (e) {
                    setFishForm({
                      ...fishForm,
                      is_active: e.target.checked,
                    });
                  }}
                />
                Active on website
              </label>
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={function () {
                  setShowFishModal(false);
                }}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={loading}
              >
                {loading
                  ? uploadingFishImage
                    ? "Uploading image..."
                    : "Saving..."
                  : fishForm.id
                  ? "Update Fish"
                  : "Add Fish"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showCategoryModal && (
        <Modal
          title={categoryForm.id ? "Edit Category" : "Add Category"}
          onClose={function () {
            if (!loading) setShowCategoryModal(false);
          }}
        >
          <form onSubmit={saveCategory}>
            <Field label="Category Name *">
              <input
                style={styles.input}
                value={categoryForm.name}
                onChange={function (e) {
                  setCategoryForm({
                    ...categoryForm,
                    name: e.target.value,
                  });
                }}
                placeholder="Premium Flowerhorns"
              />
            </Field>

            <Field label="Slug">
              <input
                style={styles.input}
                value={categoryForm.slug}
                onChange={function (e) {
                  setCategoryForm({
                    ...categoryForm,
                    slug: e.target.value,
                  });
                }}
                placeholder="premium-flowerhorns"
              />
            </Field>

            <div style={styles.formGrid}>
              <Field label="Sort Order">
                <input
                  style={styles.input}
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={function (e) {
                    setCategoryForm({
                      ...categoryForm,
                      sort_order: e.target.value,
                    });
                  }}
                />
              </Field>

              <Field label="Category Image">
                <input
                  style={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={function (e) {
                    setCategoryImageFile(e.target.files?.[0] || null);
                  }}
                />
              </Field>
            </div>

            {categoryForm.image_url && !categoryImageFile && (
              <div style={styles.currentImageBox}>
                <span>Current Image</span>
                <img
                  src={categoryForm.image_url}
                  alt={categoryForm.name}
                  style={styles.previewImage}
                />
              </div>
            )}

            {categoryImageFile && (
              <div style={styles.selectedFile}>
                New image selected: {categoryImageFile.name}
              </div>
            )}

            <div style={styles.checkboxRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={categoryForm.is_active}
                  onChange={function (e) {
                    setCategoryForm({
                      ...categoryForm,
                      is_active: e.target.checked,
                    });
                  }}
                />
                Active on website
              </label>
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={function () {
                  setShowCategoryModal(false);
                }}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={loading}
              >
                {loading
                  ? uploadingCategoryImage
                    ? "Uploading image..."
                    : "Saving..."
                  : categoryForm.id
                  ? "Update Category"
                  : "Add Category"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const result = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    onLogin(result.data.session);
    setLoading(false);
  }

  return (
    <div style={styles.loginScreen}>
      <div style={styles.loginCard}>
        <div style={styles.loginLogo}>AquaaBark</div>
        <div style={styles.loginSubtitle}>Admin Panel</div>

        <form onSubmit={login}>
          <label style={styles.loginLabel}>Email</label>

          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={function (e) {
              setEmail(e.target.value);
            }}
            placeholder="Admin email"
            required
          />

          <label style={styles.loginLabel}>Password</label>

          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={function (e) {
              setPassword(e.target.value);
            }}
            placeholder="Password"
            required
          />

          {error && <div style={styles.loginError}>{error}</div>}

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

function Dashboard({
  fish,
  categories,
  activeFishCount,
  featuredFishCount,
  activeCategoryCount,
  onFish,
  onCategory,
  onAddFish,
  onAddCategory,
}) {
  return (
    <section>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.pageSubtitle}>
            Manage your AquaaBark catalogue and website content.
          </p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard title="Total Fish" value={fish.length} />
        <StatCard title="Active Fish" value={activeFishCount} />
        <StatCard title="Featured Fish" value={featuredFishCount} />
        <StatCard title="Categories" value={activeCategoryCount} />
      </div>

      <div style={styles.dashboardGrid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Quick Actions</h2>
              <p style={styles.panelSubtitle}>
                Manage your catalogue quickly.
              </p>
            </div>
          </div>

          <div style={styles.quickActions}>
            <button style={styles.quickButton} onClick={onAddFish}>
              <strong>+ Add Fish</strong>
              <span>Create a new fish listing</span>
            </button>

            <button style={styles.quickButton} onClick={onAddCategory}>
              <strong>+ Add Category</strong>
              <span>Create a new collection category</span>
            </button>

            <button style={styles.quickButton} onClick={onFish}>
              <strong>Manage Fish</strong>
              <span>Edit or remove listings</span>
            </button>

            <button style={styles.quickButton} onClick={onCategory}>
              <strong>Manage Categories</strong>
              <span>Update your collections</span>
            </button>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Recent Fish</h2>
              <p style={styles.panelSubtitle}>Latest catalogue entries.</p>
            </div>
          </div>

          {fish.length === 0 ? (
            <div style={styles.empty}>No fish added yet.</div>
          ) : (
            <div>
              {fish.slice(0, 5).map(function (item) {
                return (
                  <div key={item.id} style={styles.recentItem}>
                    <div style={styles.recentImage}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={styles.containImage}
                        />
                      ) : (
                        <span>🐟</span>
                      )}
                    </div>

                    <div style={styles.recentInfo}>
                      <strong>{item.name}</strong>
                      <span>{categoryNameFromList(item.category_id, categories)}</span>
                    </div>

                    <span
                      style={
                        item.is_active
                          ? styles.activeBadge
                          : styles.inactiveBadge
                      }
                    >
                      {item.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FishManagement({
  fish,
  categories,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <section>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Fish Management</h1>
          <p style={styles.pageSubtitle}>
            Add, edit and manage fish displayed on the website.
          </p>
        </div>

        <button style={styles.primaryButton} onClick={onAdd}>
          + Add Fish
        </button>
      </div>

      <div style={styles.filters}>
        <input
          style={styles.searchInput}
          value={search}
          onChange={function (e) {
            setSearch(e.target.value);
          }}
          placeholder="Search fish..."
        />

        <select
          style={styles.filterSelect}
          value={categoryFilter}
          onChange={function (e) {
            setCategoryFilter(e.target.value);
          }}
        >
          <option value="all">All Categories</option>

          {categories.map(function (category) {
            return (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            );
          })}
        </select>
      </div>

      <div style={styles.tablePanel}>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fish</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Availability</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {fish.map(function (item) {
                return (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        <div style={styles.productThumb}>
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              style={styles.containImage}
                            />
                          ) : (
                            <span>🐟</span>
                          )}
                        </div>

                        <div>
                          <strong>{item.name}</strong>

                          {item.is_featured && (
                            <small style={styles.featuredText}>
                              Featured
                            </small>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={styles.td}>
                      {categoryNameFromList(item.category_id, categories)}
                    </td>

                    <td style={styles.td}>
                      {item.price_label ||
                        (item.price !== null && item.price !== undefined
                          ? "₹" + item.price
                          : "Contact")}
                    </td>

                    <td style={styles.td}>
                      {item.availability || "Available"}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={
                          item.is_active
                            ? styles.activeBadge
                            : styles.inactiveBadge
                        }
                      >
                        {item.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          style={styles.editButton}
                          onClick={function () {
                            onEdit(item);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          style={styles.deleteButton}
                          onClick={function () {
                            onDelete(item);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {fish.length === 0 && (
            <div style={styles.empty}>No fish found.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryManagement({
  categories,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <section>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Categories</h1>
          <p style={styles.pageSubtitle}>
            Manage the collections shown on your website.
          </p>
        </div>

        <button style={styles.primaryButton} onClick={onAdd}>
          + Add Category
        </button>
      </div>

      <div style={styles.filters}>
        <input
          style={styles.searchInput}
          value={search}
          onChange={function (e) {
            setSearch(e.target.value);
          }}
          placeholder="Search categories..."
        />
      </div>

      <div style={styles.categoryGrid}>
        {categories.map(function (item) {
          return (
            <div key={item.id} style={styles.categoryCard}>
              <div style={styles.categoryImage}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={styles.containImage}
                  />
                ) : (
                  <span style={styles.noImage}>No image</span>
                )}
              </div>

              <div style={styles.categoryContent}>
                <div style={styles.categoryTitleRow}>
                  <h3 style={styles.categoryTitle}>{item.name}</h3>

                  <span
                    style={
                      item.is_active
                        ? styles.activeBadge
                        : styles.inactiveBadge
                    }
                  >
                    {item.is_active ? "Active" : "Hidden"}
                  </span>
                </div>

                <div style={styles.categoryMeta}>
                  Slug: {item.slug || "-"}
                </div>

                <div style={styles.categoryMeta}>
                  Order: {item.sort_order ?? 0}
                </div>

                <div style={styles.actionRow}>
                  <button
                    style={styles.editButton}
                    onClick={function () {
                      onEdit(item);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    style={styles.deleteButton}
                    onClick={function () {
                      onDelete(item);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div style={styles.empty}>No categories found.</div>
      )}
    </section>
  );
}

function StorageView({ fish, categories }) {
  const images = [];

  fish.forEach(function (item) {
    if (item.image_url) {
      images.push({
        id: "fish-" + item.id,
        name: item.name,
        type: "Fish",
        url: item.image_url,
      });
    }
  });

  categories.forEach(function (item) {
    if (item.image_url) {
      images.push({
        id: "category-" + item.id,
        name: item.name,
        type: "Category",
        url: item.image_url,
      });
    }
  });

  return (
    <section>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Image Storage</h1>
          <p style={styles.pageSubtitle}>
            Images currently connected to your catalogue.
          </p>
        </div>
      </div>

      <div style={styles.storageGrid}>
        {images.map(function (image) {
          return (
            <div key={image.id} style={styles.storageCard}>
              <div style={styles.storageImage}>
                <img
                  src={image.url}
                  alt={image.name}
                  style={styles.containImage}
                />
              </div>

              <div style={styles.storageInfo}>
                <strong>{image.name}</strong>
                <span>{image.type}</span>
              </div>
            </div>
          );
        })}
      </div>

      {images.length === 0 && (
        <div style={styles.empty}>No uploaded images found.</div>
      )}
    </section>
  );
}

function categoryNameFromList(categoryId, categories) {
  const category = categories.find(function (item) {
    return item.id === categoryId;
  });

  return category ? category.name : "Uncategorized";
}

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navButton,
        ...(active ? styles.navButtonActive : {}),
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statTitle}>{title}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{title}</h2>

          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f5f7f6",
    color: "#17211f",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  centerScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7f6",
  },

  loadingBox: {
    padding: "30px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
  },

  topbar: {
    height: "76px",
    background: "#ffffff",
    borderBottom: "1px solid #e6ebe9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  brand: {
    fontSize: "24px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },

  brandSub: {
    fontSize: "12px",
    color: "#78837f",
    marginTop: "2px",
  },

  topActions: {
    display: "flex",
    gap: "10px",
  },

  websiteButton: {
    border: "1px solid #d8e0dd",
    background: "#ffffff",
    borderRadius: "9px",
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 600,
  },

  logoutButton: {
    border: "none",
    background: "#17211f",
    color: "#ffffff",
    borderRadius: "9px",
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 600,
  },

  layout: {
    display: "flex",
    minHeight: "calc(100vh - 76px)",
  },

  sidebar: {
    width: "245px",
    flexShrink: 0,
    background: "#ffffff",
    borderRight: "1px solid #e6ebe9",
    padding: "22px 15px",
  },

  adminBox: {
    display: "flex",
    gap: "11px",
    alignItems: "center",
    padding: "12px",
    marginBottom: "22px",
    borderBottom: "1px solid #edf0ef",
    paddingBottom: "20px",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#173f35",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  adminBoxStrong: {
    display: "block",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  navButton: {
    border: "none",
    background: "transparent",
    textAlign: "left",
    padding: "12px 13px",
    borderRadius: "9px",
    cursor: "pointer",
    color: "#56615d",
    fontSize: "14px",
    fontWeight: 600,
  },

  navButtonActive: {
    background: "#e9f1ee",
    color: "#173f35",
  },

  main: {
    flex: 1,
    padding: "30px",
    minWidth: 0,
  },

  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "25px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "28px",
    letterSpacing: "-0.6px",
  },

  pageSubtitle: {
    margin: "6px 0 0",
    color: "#78837f",
    fontSize: "14px",
  },

  success: {
    padding: "13px 16px",
    background: "#e8f5ed",
    border: "1px solid #c9e7d4",
    color: "#21663c",
    borderRadius: "9px",
    marginBottom: "18px",
  },

  error: {
    padding: "13px 16px",
    background: "#fff0f0",
    border: "1px solid #f0cccc",
    color: "#9b3030",
    borderRadius: "9px",
    marginBottom: "18px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e6ebe9",
    borderRadius: "13px",
    padding: "20px",
  },

  statTitle: {
    display: "block",
    color: "#78837f",
    fontSize: "13px",
    marginBottom: "9px",
  },

  statValue: {
    display: "block",
    fontSize: "28px",
  },

  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e6ebe9",
    borderRadius: "13px",
    overflow: "hidden",
  },

  panelHeader: {
    padding: "19px 20px",
    borderBottom: "1px solid #edf0ef",
  },

  panelTitle: {
    margin: 0,
    fontSize: "17px",
  },

  panelSubtitle: {
    margin: "5px 0 0",
    color: "#78837f",
    fontSize: "13px",
  },

  quickActions: {
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "11px",
  },

  quickButton: {
    border: "1px solid #e3e9e6",
    background: "#fafcfb",
    borderRadius: "10px",
    padding: "15px",
    cursor: "pointer",
    textAlign: "left",
  },

  recentItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 18px",
    borderBottom: "1px solid #f0f2f1",
  },

  recentImage: {
    width: "48px",
    height: "48px",
    flexShrink: 0,
    borderRadius: "8px",
    background: "#f0f4f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  recentInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    padding: "4px 8px",
    borderRadius: "20px",
    background: "#e8f5ed",
    color: "#267044",
    fontSize: "11px",
    fontWeight: 700,
  },

  inactiveBadge: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    padding: "4px 8px",
    borderRadius: "20px",
    background: "#f0f1f1",
    color: "#6c7471",
    fontSize: "11px",
    fontWeight: 700,
  },

  featuredText: {
    color: "#9a6b13",
    fontSize: "11px",
    marginTop: "3px",
  },

  filters: {
    display: "flex",
    gap: "12px",
    marginBottom: "18px",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border: "1px solid #dce3e0",
    background: "#ffffff",
    borderRadius: "9px",
    padding: "12px 14px",
    outline: "none",
    fontSize: "14px",
  },

  filterSelect: {
    width: "230px",
    border: "1px solid #dce3e0",
    background: "#ffffff",
    borderRadius: "9px",
    padding: "12px 14px",
    outline: "none",
    fontSize: "14px",
  },

  tablePanel: {
    background: "#ffffff",
    border: "1px solid #e6ebe9",
    borderRadius: "13px",
    overflow: "hidden",
  },

  tableScroll: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
  },

  th: {
    textAlign: "left",
    padding: "13px 16px",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#78837f",
    background: "#fafcfb",
    borderBottom: "1px solid #e6ebe9",
  },

  td: {
    padding: "13px 16px",
    borderBottom: "1px solid #edf0ef",
    fontSize: "13px",
    verticalAlign: "middle",
  },

  productCell: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  productThumb: {
    width: "58px",
    height: "58px",
    flexShrink: 0,
    background: "#f1f5f3",
    borderRadius: "8px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  containImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    display: "block",
  },

  actionRow: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  editButton: {
    border: "1px solid #d6e2de",
    background: "#ffffff",
    color: "#245448",
    borderRadius: "7px",
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  deleteButton: {
    border: "1px solid #f0d1d1",
    background: "#fff7f7",
    color: "#a23838",
    borderRadius: "7px",
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  primaryButton: {
    border: "none",
    background: "#173f35",
    color: "#ffffff",
    borderRadius: "9px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },

  cancelButton: {
    border: "1px solid #d9dfdd",
    background: "#ffffff",
    color: "#46504d",
    borderRadius: "9px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "17px",
  },

  categoryCard: {
    background: "#ffffff",
    border: "1px solid #e6ebe9",
    borderRadius: "13px",
    overflow: "hidden",
  },

  categoryImage: {
    height: "190px",
    background: "#f1f5f3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  categoryContent: {
    padding: "15px",
  },

  categoryTitleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
  },

  categoryTitle: {
    margin: 0,
    fontSize: "16px",
  },

  categoryMeta: {
    color: "#78837f",
    fontSize: "12px",
    marginTop: "6px",
  },

  noImage: {
    color: "#8b9591",
    fontSize: "13px",
  },

  storageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "17px",
  },

  storageCard: {
    background: "#ffffff",
    border: "1px solid #e6ebe9",
    borderRadius: "12px",
    overflow: "hidden",
  },

  storageImage: {
    height: "190px",
    background: "#f1f5f3",
    overflow: "hidden",
  },

  storageInfo: {
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  empty: {
    padding: "45px 20px",
    textAlign: "center",
    color: "#7b8581",
    background: "#ffffff",
    border: "1px solid #e6ebe9",
    borderRadius: "12px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 25, 22, 0.52)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 100,
  },

  modal: {
    width: "100%",
    maxWidth: "760px",
    maxHeight: "92vh",
    overflow: "auto",
    background: "#ffffff",
    borderRadius: "15px",
    boxShadow: "0 25px 80px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "19px 22px",
    borderBottom: "1px solid #e8ecea",
    position: "sticky",
    top: 0,
    background: "#ffffff",
    zIndex: 2,
  },

  modalTitle: {
    margin: 0,
    fontSize: "20px",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "27px",
    lineHeight: 1,
    cursor: "pointer",
    color: "#67716e",
  },

  modalBody: {
    padding: "22px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "15px",
  },

  fieldLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#48534f",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce3e0",
    borderRadius: "8px",
    padding: "11px 12px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce3e0",
    borderRadius: "8px",
    padding: "11px 12px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },

  fileInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce3e0",
    borderRadius: "8px",
    padding: "8px",
    fontSize: "12px",
    background: "#ffffff",
  },

  currentImageBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    border: "1px solid #e6ebe9",
    borderRadius: "9px",
    marginBottom: "15px",
    color: "#68736f",
    fontSize: "12px",
  },

  previewImage: {
    width: "75px",
    height: "75px",
    objectFit: "contain",
    background: "#f2f5f4",
    borderRadius: "7px",
  },

  selectedFile: {
    padding: "10px 12px",
    background: "#edf6f2",
    color: "#275b4d",
    borderRadius: "8px",
    fontSize: "12px",
    marginBottom: "15px",
  },

  checkboxRow: {
    display: "flex",
    gap: "22px",
    flexWrap: "wrap",
    margin: "5px 0 18px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "13px",
    cursor: "pointer",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "9px",
    borderTop: "1px solid #edf0ef",
    paddingTop: "18px",
  },

  loginScreen: {
    minHeight: "100vh",
    background: "#f3f6f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  loginCard: {
    width: "100%",
    maxWidth: "410px",
    background: "#ffffff",
    border: "1px solid #e4eae7",
    borderRadius: "15px",
    padding: "32px",
    boxShadow: "0 15px 50px rgba(0,0,0,0.07)",
  },

  loginLogo: {
    fontSize: "28px",
    fontWeight: 800,
    textAlign: "center",
  },

  loginSubtitle: {
    textAlign: "center",
    color: "#78837f",
    marginBottom: "28px",
    marginTop: "5px",
  },

  loginLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "7px",
    marginTop: "15px",
  },

  loginButton: {
    width: "100%",
    marginTop: "20px",
    border: "none",
    background: "#173f35",
    color: "#ffffff",
    borderRadius: "9px",
    padding: "13px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
  },

  loginError: {
    marginTop: "12px",
    padding: "10px",
    background: "#fff0f0",
    color: "#9b3030",
    borderRadius: "7px",
    fontSize: "12px",
  },
};