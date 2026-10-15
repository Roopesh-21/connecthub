"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

const colors = {
  background: "#F5EDE2",
  card: "#FFFCF8",
  plum: "#33264A",
  coral: "#E56B4A",
  muted: "#786E7D",
  border: "#E5D9CE",
};

const initialForm = {
  full_name: "",
  headline: "",
  bio: "",
  location: "",
  skills: "",
  interests: "",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: `1px solid ${colors.border}`,
  borderRadius: "10px",
  background: "#FFFFFF",
  color: colors.plum,
  fontSize: "15px",
  outlineColor: colors.coral,
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: colors.plum,
  marginBottom: "8px",
};

export default function ProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setErrorMessage(error.message);
      } else if (data) {
        setForm({
          full_name: data.full_name || "",
          headline: data.headline || "",
          bio: data.bio || "",
          location: data.location || "",
          skills: (data.skills || []).join(", "),
          interests: (data.interests || []).join(", "),
        });
      }

      setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function splitList(value) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) return;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const profileData = {
      id: user.id,
      full_name: form.full_name.trim(),
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      location: form.location.trim(),
      skills: splitList(form.skills),
      interests: splitList(form.interests),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "id" });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Your profile has been saved successfully!");
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: colors.background,
          display: "grid",
          placeItems: "center",
          color: colors.plum,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading your profile...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: "32px 18px 60px",
        color: colors.plum,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "36px",
          }}
        >
          <a
            href="/"
            style={{
              color: colors.plum,
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "23px",
              letterSpacing: "-1px",
            }}
          >
            ConnectHub<span style={{ color: colors.coral }}>.</span>
          </a>

          <a
            href="/"
            style={{
              color: colors.plum,
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Back home
          </a>
        </nav>

        <header style={{ marginBottom: "26px" }}>
          <p
            style={{
              color: colors.coral,
              fontWeight: 700,
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            YOUR SPACE, YOUR STORY
          </p>

          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 48px)",
              lineHeight: 1.1,
              letterSpacing: "-1.8px",
              margin: "0 0 12px",
            }}
          >
            Build your profile.
          </h1>

          <p
            style={{
              color: colors.muted,
              fontSize: "16px",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Tell people who you are, what you do, and what you want to build
            together.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "20px",
            padding: "clamp(20px, 5vw, 36px)",
            boxShadow: "0 12px 40px rgba(51, 38, 74, 0.05)",
          }}
        >
          <div style={{ marginBottom: "22px" }}>
            <label htmlFor="full_name" style={labelStyle}>
              Full name *
            </label>
            <input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="e.g. Roopesh Indugabilli"
              required
              maxLength={100}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label htmlFor="headline" style={labelStyle}>
              Headline
            </label>
            <input
              id="headline"
              name="headline"
              value={form.headline}
              onChange={handleChange}
              placeholder="e.g. CSE student | Aspiring entrepreneur"
              maxLength={150}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label htmlFor="bio" style={labelStyle}>
              About you
            </label>
            <textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="What are you learning, building, or working toward?"
              rows={5}
              maxLength={2000}
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label htmlFor="location" style={labelStyle}>
              Location
            </label>
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Hyderabad, India"
              maxLength={120}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label htmlFor="skills" style={labelStyle}>
              Skills
            </label>
            <input
              id="skills"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="Java, Web Development, Communication"
              style={inputStyle}
            />
            <p
              style={{
                color: colors.muted,
                fontSize: "12px",
                margin: "8px 0 0",
              }}
            >
              Separate each skill with a comma.
            </p>
          </div>

          <div style={{ marginBottom: "26px" }}>
            <label htmlFor="interests" style={labelStyle}>
              Interests
            </label>
            <input
              id="interests"
              name="interests"
              value={form.interests}
              onChange={handleChange}
              placeholder="Startups, AI, Design, Travel"
              style={inputStyle}
            />
            <p
              style={{
                color: colors.muted,
                fontSize: "12px",
                margin: "8px 0 0",
              }}
            >
              Separate each interest with a comma.
            </p>
          </div>

          {errorMessage && (
            <p
              role="alert"
              style={{
                background: "#FFF0ED",
                color: "#A33225",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "14px",
                overflowWrap: "anywhere",
              }}
            >
              Could not load or save your profile: {errorMessage}
            </p>
          )}

          {message && (
            <p
              role="status"
              style={{
                background: "#EDF7ED",
                color: "#286738",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "12px",
              padding: "15px 20px",
              background: colors.plum,
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "15px",
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving profile..." : "Save my profile →"}
          </button>

          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: colors.muted,
              margin: "14px 0 0",
            }}
          >
            Use commas to add multiple skills and interests.
          </p>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a
            href="/discover"
            style={{
              color: colors.plum,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Explore the community →
          </a>
        </div>
      </div>
    </main>
  );
}

