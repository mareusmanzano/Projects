import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  Search,
  Plus,
  Link as LinkIcon,
  Image as ImageIcon,
  CalendarDays,
  X,
  ChefHat,
  Clock3,
  Users,
  Trash2,
  Pencil,
  Save,
  LogIn,
  LogOut,
  UploadCloud,
} from "lucide-react";
import "./styles.css";
 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const demo = [
  {
    id: "1",
    title: "Creamy Garlic Pasta",
    description: "A cozy weeknight pasta with parmesan and lots of garlic.",
    image_url:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
    ingredients: [
      "spaghetti",
      "garlic",
      "butter",
      "parmesan",
      "cream",
      "parsley",
    ],
    steps: [
      "Boil pasta until al dente.",
      "Sauté garlic in butter.",
      "Add cream and parmesan.",
      "Toss with pasta and parsley.",
    ],
    tags: ["quick", "dinner"],
    minutes: 25,
    servings: 2,
  },
  {
    id: "2",
    title: "Honey Soy Chicken",
    description: "Sticky, savory chicken that works beautifully with rice.",
    image_url:
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=80",
    ingredients: [
      "chicken thighs",
      "soy sauce",
      "honey",
      "garlic",
      "ginger",
      "sesame",
    ],
    steps: [
      "Mix soy, honey, garlic and ginger.",
      "Marinate chicken for 20 minutes.",
      "Pan-sear until browned and cooked through.",
      "Glaze and finish with sesame.",
    ],
    tags: ["high-protein", "meal prep"],
    minutes: 35,
    servings: 4,
  },
  {
    id: "3",
    title: "Avocado Toast",
    description: "Simple, bright and ready in under ten minutes.",
    image_url:
      "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=900&q=80",
    ingredients: ["sourdough", "avocado", "lemon", "chili flakes", "olive oil"],
    steps: [
      "Toast sourdough.",
      "Mash avocado with lemon.",
      "Spread over toast and season.",
    ],
    tags: ["breakfast", "quick"],
    minutes: 8,
    servings: 1,
  },
];
function parseRecipe(text, title = "Imported Recipe") {
  const lines = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const ingStart = lines.findIndex((x) => /ingredients?/i.test(x));
  const stepStart = lines.findIndex((x) =>
    /instructions?|directions?|method/i.test(x),
  );
  let ingredients =
    ingStart >= 0
      ? lines
          .slice(ingStart + 1, stepStart > ingStart ? stepStart : undefined)
          .filter((x) => /^[-•*\d.]/.test(x))
          .map((x) => x.replace(/^[-•*\d.\s]+/, ""))
      : [];
  let steps =
    stepStart >= 0
      ? lines
          .slice(stepStart + 1)
          .filter((x) => x.length > 10)
          .map((x) => x.replace(/^\d+[.)\s]+/, ""))
      : [];
  if (!ingredients.length)
    ingredients = [
      "ingredient extraction preview",
      "Add ingredients from the imported recipe",
    ];
  if (!steps.length)
    steps = ["Review the imported content and add your cooking steps."];
  return {
    title,
    ingredients,
    steps,
    tags: ["imported"],
    minutes: 30,
    servings: 2,
    description: "Imported into Tablescraps.",
  };
}
function App() {
  const [session, setSession] = useState(null);
  const [recipes, setRecipes] = useState(demo);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("All");
  const [view, setView] = useState("library");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [mode, setMode] = useState("link");
  const [importText, setImportText] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [auth, setAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [editing, setEditing] = useState(false);
 
  const [editTitle, setEditTitle] = useState("");
  const [editIngredients, setEditIngredients] = useState("");
  const [editSteps, setEditSteps] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editServings, setEditServings] = useState("");
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !session?.user) return;
    supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data?.length) setRecipes(data);
      });
  }, [session]);
  const tags = useMemo(
    () => ["All", ...new Set(recipes.flatMap((r) => r.tags || []))],
    [recipes],
  );
  const filtered = recipes.filter((r) => {
    const hay = [
      r.title,
      r.description,
      ...(r.ingredients || []),
      ...(r.tags || []),
    ]
      .join(" ")
      .toLowerCase();
    return (
      hay.includes(q.toLowerCase()) &&
      (tag === "All" || (r.tags || []).includes(tag))
    );
  });
  async function signIn() {
    if (!supabase) {
      alert("Add Supabase credentials to .env.local first.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert("Check your email for the magic link.");
  }
  async function signOut() {
    await supabase?.auth.signOut();
    setSession(null);
  }
  async function saveRecipe() {
    setBusy(true);
 
    let recipe;
 
    if (mode === "link") {
      recipe = parseRecipe(importText, importTitle || "Imported Recipe");
    } else {
      recipe = {
        ...parseRecipe(importTitle || file?.name || "Screenshot Recipe"),
        image_url: file ? URL.createObjectURL(file) : "",
      };
    }
 
    if (supabase && session?.user) {
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          ...recipe,
          user_id: session.user.id,
        })
        .select()
        .single();
 
      if (error) {
        alert(error.message);
      } else {
        setRecipes([data, ...recipes]);
      }
    } else {
      setRecipes([
        {
          ...recipe,
          id: crypto.randomUUID(),
        },
        ...recipes,
      ]);
    }
 
    setBusy(false);
    setModal(false);
    setImportText("");
    setImportTitle("");
    setFile(null);
  }
 
  /* =========================================
   EDIT RECIPE FUNCTIONS
   PUT THESE HERE
   ========================================= */
 
  function startEditing(recipe) {
    setEditing(true);
 
    setEditTitle(recipe.title || "");
 
    setEditIngredients((recipe.ingredients || []).join("\n"));
 
    setEditSteps((recipe.steps || []).join("\n"));
 
    setEditMinutes(recipe.minutes ? String(recipe.minutes) : "");
 
    setEditServings(recipe.servings ? String(recipe.servings) : "");
  }
 
  function cancelEditing() {
    setEditing(false);
  }
 
  async function saveEdit() {
    if (!selected) return;
 
    const updatedRecipe = {
      ...selected,
 
      title: editTitle.trim() || "Untitled Recipe",
 
      ingredients: editIngredients
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
 
      steps: editSteps
        .split(/\r?\n/)
        .map((step) => step.trim())
        .filter(Boolean),
 
      minutes: Number(editMinutes) || 0,
 
      servings: Number(editServings) || 0,
    };
 
    // Make sure ingredients exist
    if (!updatedRecipe.ingredients.length) {
      alert("Please add at least one ingredient.");
      return;
    }
 
    // Make sure steps exist
    if (!updatedRecipe.steps.length) {
      alert("Please add at least one step.");
      return;
    }
 
    /* ===============================
     SAVE TO SUPABASE
     =============================== */
 
    if (supabase && session?.user) {
      const { data, error } = await supabase
        .from("recipes")
        .update({
          title: updatedRecipe.title,
          ingredients: updatedRecipe.ingredients,
          steps: updatedRecipe.steps,
          minutes: updatedRecipe.minutes,
          servings: updatedRecipe.servings,
        })
        .eq("id", selected.id)
        .select()
        .single();
 
      if (error) {
        alert(error.message);
        return;
      }
 
      // Update recipe list
      setRecipes(
        recipes.map((recipe) => (recipe.id === selected.id ? data : recipe)),
      );
 
      // Update currently opened recipe
      setSelected(data);
    } else {
      /* ===============================
       LOCAL / DEMO MODE
       =============================== */
 
      setRecipes(
        recipes.map((recipe) =>
          recipe.id === selected.id ? updatedRecipe : recipe,
        ),
      );
 
      setSelected(updatedRecipe);
    }
 
    // Close edit mode
    setEditing(false);
  }
 
  /* =========================================
   DELETE RECIPE
   ========================================= */
 
  async function removeRecipe(id) {
    if (!confirm("Delete this recipe?")) return;
    if (supabase && session?.user)
      await supabase.from("recipes").delete().eq("id", id);
    setRecipes(recipes.filter((r) => r.id !== id));
    setSelected(null);
  }
  return (
    <div className="app">
      <aside>
        <div className="brand">
          <div className="logo">
            <ChefHat size={20} />
          </div>
          <span>tablescraps</span>
        </div>
        <nav>
          <button
            className={view === "library" ? "active" : ""}
            onClick={() => setView("library")}
          >
            <ChefHat size={18} />
            Library
          </button>
          <button
            className={view === "planner" ? "active" : ""}
            onClick={() => setView("planner")}
          >
            <CalendarDays size={18} />
            Meal plan
          </button>
        </nav>
        <div className="side-note">
          <b>Your kitchen, organized.</b>
          <span>Save recipes before they disappear into your camera roll.</span>
        </div>
        <div className="account">
          {session ? (
            <>
              <span className="avatar">
                {session.user.email?.[0]?.toUpperCase()}
              </span>
              <div>
                <b>{session.user.email}</b>
                <button onClick={signOut}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </>
          ) : (
            <button className="login" onClick={() => setAuth(true)}>
              <LogIn size={16} />
              Sign in
            </button>
          )}
        </div>
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">YOUR RECIPE BOX</p>
            <h1>
              {view === "library"
                ? "A better place for recipes."
                : "Plan the week."}
            </h1>
            <p className="sub">
              {view === "library"
                ? "Screenshots, links, and forgotten recipes — all searchable in one place."
                : "Pick a few favorites and make dinner decisions easier."}
            </p>
          </div>
          <button className="primary" onClick={() => setModal(true)}>
            <Plus size={18} /> Add recipe
          </button>
        </header>
        {view === "library" ? (
          <>
            <div className="toolbar">
              <div className="search">
                <Search size={18} />
                <input
                  placeholder="Search by recipe or ingredient…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="chips">
                {tags.map((t) => (
                  <button
                    key={t}
                    className={tag === t ? "chip on" : "chip"}
                    onClick={() => setTag(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid">
              {filtered.map((r) => (
                <article
                  className="card"
                  key={r.id}
                  onClick={() => setSelected(r)}
                >
                  <div className="cover">
                    {r.image_url ? (
                      <img src={r.image_url} alt="" />
                    ) : (
                      <div className="placeholder">
                        <ChefHat size={30} />
                      </div>
                    )}
                    <div className="time">
                      <Clock3 size={14} />
                      {r.minutes || 30} min
                    </div>
                  </div>
                  <div className="cardbody">
                    <div className="tagrow">
                      {(r.tags || []).slice(0, 2).map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                    <h2>{r.title}</h2>
                    <p>{r.description}</p>
                    <div className="meta">
                      <span>
                        <Users size={14} />
                        {r.servings || 2} servings
                      </span>
                      <span>{(r.ingredients || []).length} ingredients</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!filtered.length && (
              <div className="empty">
                <ChefHat size={36} />
                <h3>No scraps found</h3>
                <p>Try another ingredient or add a recipe.</p>
              </div>
            )}
          </>
        ) : (
          <div className="planner">
            <div className="week">
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span>SUN</span>
            </div>
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((d, i) => (
              <div className="day" key={d}>
                <b>{d}</b>
                {recipes[i % recipes.length] && (
                  <button
                    onClick={() => setSelected(recipes[i % recipes.length])}
                  >
                    {recipes[i % recipes.length].title}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      {selected && (
        <div className="overlay" onMouseDown={() => setSelected(null)}>
          <section className="detail" onMouseDown={(e) => e.stopPropagation()}>
            {/* CLOSE BUTTON */}
            <button className="close" onClick={() => setSelected(null)}>
              <X />
            </button>
 
            {/* RECIPE IMAGE */}
            {selected.image_url && (
              <img className="detailimg" src={selected.image_url} alt="" />
            )}
 
            {/* ==========================================
          EDIT MODE
          ========================================== */}
 
            {editing ? (
              <div className="editform">
                {/* HEADER */}
 
                <div className="editform-head">
                  <p className="eyebrow">EDIT RECIPE</p>
 
                  <h2>Edit Recipe</h2>
 
                  <p>Update the details of your recipe below.</p>
                </div>
 
                {/* ========================================
              RECIPE NAME
              ======================================== */}
 
                <div className="editfield">
                  <label htmlFor="edit-recipe-name">Recipe Name</label>
 
                  <input
                    id="edit-recipe-name"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter recipe name"
                  />
                </div>
 
                {/* ========================================
              INGREDIENTS
              ======================================== */}
 
                <div className="editfield">
                  <label htmlFor="edit-ingredients">Ingredients</label>
 
                  <span className="hint">
                    Enter one ingredient per line, including the exact
                    amount.
                  </span>
 
                  <textarea
                    id="edit-ingredients"
                    value={editIngredients}
                    onChange={(e) => setEditIngredients(e.target.value)}
                    placeholder={`500 g chicken breast
2 tbsp soy sauce
3 cloves garlic
1 tsp black pepper`}
                  />
                </div>
 
                {/* ========================================
              PREPARATION METHOD
              ======================================== */}
 
                <div className="editfield">
                  <label htmlFor="edit-steps">Preparation Method</label>
 
                  <span className="hint">Enter one cooking step per line.</span>
 
                  <textarea
                    id="edit-steps"
                    value={editSteps}
                    onChange={(e) => setEditSteps(e.target.value)}
                    placeholder={`Prepare all ingredients.
Marinate the chicken.
Heat the pan.
Cook until done.`}
                  />
                </div>
 
                {/* ========================================
              COOKING TIME + SERVINGS
              ======================================== */}
 
                <div className="editrow">
                  <div className="editfield">
                    <label htmlFor="edit-cooking-time">
                      Cooking Time (minutes)
                    </label>
 
                    <input
                      id="edit-cooking-time"
                      type="number"
                      min="1"
                      value={editMinutes}
                      onChange={(e) => setEditMinutes(e.target.value)}
                      placeholder="e.g., 25"
                    />
                  </div>
 
                  <div className="editfield">
                    <label htmlFor="edit-servings">Number of Servings</label>
 
                    <input
                      id="edit-servings"
                      type="number"
                      min="1"
                      value={editServings}
                      onChange={(e) => setEditServings(e.target.value)}
                      placeholder="e.g., 2"
                    />
                  </div>
                </div>
 
                {/* ========================================
              BUTTONS
              ======================================== */}
 
                <div className="editform-actions">
                  <button
                    type="button"
                    className="editform-cancel"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>
 
                  <button
                    type="button"
                    className="primary"
                    onClick={saveEdit}
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              /* ==========================================
           NORMAL RECIPE VIEW
           ========================================== */
 
              <div className="detailcontent">
                <div className="tagrow">
                  {(selected.tags || []).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
 
                <h2>{selected.title}</h2>
 
                <p>{selected.description}</p>
 
                <div className="twocol">
                  {/* INGREDIENTS */}
 
                  <div>
                    <h3>Ingredients</h3>
 
                    <ul>
                      {(selected.ingredients || []).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
 
                  {/* STEPS */}
 
                  <div>
                    <h3>Steps</h3>
 
                    <ol>
                      {(selected.steps || []).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ol>
                  </div>
                </div>
 
                {/* EDIT + DELETE BUTTONS */}
 
                <div className="recipe-actions">
                  <button
                    className="edit-btn"
                    onClick={() => startEditing(selected)}
                  >
                    <Pencil size={16} />
                    Edit recipe
                  </button>
 
                  <button
                    className="danger"
                    onClick={() => removeRecipe(selected.id)}
                  >
                    <Trash2 size={16} />
                    Delete recipe
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      {modal && (
        <div className="overlay">
          <section className="modal">
            <button className="close" onClick={() => setModal(false)}>
              <X />
            </button>
            <p className="eyebrow">NEW SCRAP</p>
            <h2>Save a recipe</h2>
            <p className="muted">
              Paste a recipe link/text or upload a screenshot.
            </p>
            <div className="mode">
              <button
                className={mode === "link" ? "selected" : ""}
                onClick={() => setMode("link")}
              >
                <LinkIcon size={16} /> Link / text
              </button>
              <button
                className={mode === "image" ? "selected" : ""}
                onClick={() => setMode("image")}
              >
                <ImageIcon size={16} /> Screenshot
              </button>
            </div>
            <input
              value={importTitle}
              onChange={(e) => setImportTitle(e.target.value)}
              placeholder="Recipe title (optional)"
            />
            {mode === "link" ? (
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste a recipe URL or recipe text here…"
              />
            ) : (
              <label className="drop">
                <UploadCloud size={30} />
                <b>{file ? file.name : "Choose a screenshot"}</b>
                <span>PNG, JPG or WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0])}
                />
              </label>
            )}
            <button
              className="primary full"
              disabled={busy || (!importText && !file)}
              onClick={saveRecipe}
            >
              {busy ? "Extracting…" : "Extract ingredients & save"}
            </button>
            <small>
              Demo extraction is local. Connect a Supabase Edge Function/AI
              parser for production OCR and URL extraction.
            </small>
          </section>
        </div>
      )}
      {auth && (
        <div className="overlay">
          <section className="modal auth">
            <button className="close" onClick={() => setAuth(false)}>
              <X />
            </button>
            <p className="eyebrow">ACCOUNT</p>
            <h2>Sign in to sync your scraps.</h2>
            <p className="muted">We’ll send a passwordless magic link.</p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
            />
            <button className="primary full" onClick={signIn}>
              Send magic link
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);