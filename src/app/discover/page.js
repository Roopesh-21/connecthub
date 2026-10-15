"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

const C = {
  bg: "#F5EDE2",
  card: "#FFFCF8",
  plum: "#33264A",
  coral: "#E56B4A",
  pink: "#E9A9B8",
  muted: "#786E7D",
  border: "#E5D9CE",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    color: C.plum,
    fontFamily: "Arial, sans-serif",
    padding: "28px 20px 60px",
  },
  container: {
    maxWidth: "1160px",
    margin: "0 auto",
  },
  link: {
    color: C.plum,
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    background: C.card,
    color: C.plum,
    fontSize: "15px",
    boxSizing: "border-box",
    outlineColor: C.coral,
  },
  button: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default function DiscoverPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [connections, setConnections] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPage() {
      const supabase = createClient();

      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);

      const [
        { data: profileData, error: profileError },
        { data: connectionData, error: connectionError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, headline, bio, location, skills, interests")
          .neq("id", currentUser.id)
          .order("full_name", { ascending: true }),

        supabase
          .from("connections")
          .select(
            "id, requester_id, recipient_id, status, created_at, updated_at",
          ),
      ]);

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
      } else if (connectionError) {
        setError(connectionError.message);
      } else {
        setProfiles(profileData || []);
        setConnections(connectionData || []);
      }

      setLoading(false);
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [router]);

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return profiles;

    return profiles.filter((profile) => {
      const searchable = [
        profile.full_name,
        profile.headline,
        profile.bio,
        profile.location,
        ...(profile.skills || []),
        ...(profile.interests || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [profiles, search]);

  function initials(name) {
    return (name || "CH")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function getConnection(profileId) {
    return connections.find(
      (connection) =>
        (connection.requester_id === user?.id &&
          connection.recipient_id === profileId) ||
        (connection.requester_id === profileId &&
          connection.recipient_id === user?.id),
    );
  }

  async function refreshConnections() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("connections")
      .select("id, requester_id, recipient_id, status, created_at, updated_at");

    if (error) {
      throw error;
    }

    setConnections(data || []);
  }

  async function sendRequest(profileId) {
    if (!user || busyId) return;

    setBusyId(profileId);
    setNotice("");
    setError("");

    try {
      const existing = getConnection(profileId);

      if (existing) {
        setNotice("A connection request or connection already exists.");
        return;
      }

      const supabase = createClient();

      const { error: insertError } = await supabase.from("connections").insert({
        requester_id: user.id,
        recipient_id: profileId,
        status: "pending",
      });

      if (insertError) throw insertError;

      await refreshConnections();
      setNotice("Connection request sent successfully!");
    } catch (err) {
      setError(err.message || "Couldn't send the connection request.");
    } finally {
      setBusyId("");
    }
  }

  async function respondToRequest(connectionId, newStatus, profileId) {
    if (!user || busyId) return;

    setBusyId(profileId);
    setNotice("");
    setError("");

    try {
      const supabase = createClient();

      const { data, error: updateError } = await supabase
        .from("connections")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId)
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .select("id");

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error(
          "This request may already have been answered. Refresh the page and try again.",
        );
      }

      await refreshConnections();

      setNotice(
        newStatus === "accepted"
          ? "Connection accepted! You're now connected."
          : "Connection request declined.",
      );
    } catch (err) {
      setError(err.message || "Couldn't respond to this request.");
    } finally {
      setBusyId("");
    }
  }

  const avatarColors = [C.pink, "#E8D7B8", "#D6DCEF", "#D8E5D3"];

  if (loading) {
    return (
      <main
        style={{
          ...styles.page,
          display: "grid",
          placeItems: "center",
        }}
      >
        Loading your community...
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "56px",
          }}
        >
          <a
            href="/"
            style={{
              ...styles.link,
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "-1px",
            }}
          >
            ConnectHub<span style={{ color: C.coral }}>.</span>
          </a>

          <div style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
            <a href="/" style={styles.link}>
              Home
            </a>
            <a href="/profile" style={styles.link}>
              My profile
            </a>
          </div>
        </nav>

        <section style={{ maxWidth: "720px", marginBottom: "38px" }}>
          <p
            style={{
              color: C.coral,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "2px",
              marginBottom: "14px",
            }}
          >
            YOUR NEXT CONNECTION STARTS HERE
          </p>

          <h1
            style={{
              fontSize: "clamp(38px, 7vw, 66px)",
              letterSpacing: "-2.5px",
              lineHeight: 1.05,
              margin: "0 0 18px",
            }}
          >
            Find your <span style={{ color: C.coral }}>people.</span>
          </h1>

          <p
            style={{
              color: C.muted,
              fontSize: "17px",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Discover people who share your interests, bring new perspectives,
            and want to build something meaningful.
          </p>
        </section>

        <section
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            padding: "12px",
            borderRadius: "16px",
            marginBottom: "34px",
          }}
        >
          <label
            htmlFor="member-search"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 700,
              margin: "4px 4px 10px",
            }}
          >
            Search the community
          </label>

          <input
            id="member-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Try Java, designer, Hyderabad, startups..."
            style={styles.input}
          />

          <p
            style={{
              color: C.muted,
              fontSize: "12px",
              margin: "10px 4px 2px",
            }}
          >
            Search names, headlines, bios, locations, skills, and interests.
          </p>
        </section>

        {notice && (
          <div
            role="status"
            style={{
              background: "#F0E7F1",
              color: C.plum,
              padding: "14px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              overflowWrap: "anywhere",
            }}
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              background: "#FFF0ED",
              color: "#A33225",
              padding: "18px",
              borderRadius: "12px",
              marginBottom: "20px",
              overflowWrap: "anywhere",
            }}
          >
            <strong>Something went wrong.</strong>
            <p>{error}</p>
            Check your Supabase permissions and try refreshing the page.
          </div>
        )}

        {!error && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "22px", margin: 0 }}>Community members</h2>

              <span style={{ color: C.muted, fontSize: "13px" }}>
                {filteredProfiles.length}{" "}
                {filteredProfiles.length === 1 ? "person" : "people"}
              </span>
            </div>

            {filteredProfiles.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                  gap: "18px",
                }}
              >
                {filteredProfiles.map((profile, index) => {
                  const connection = getConnection(profile.id);
                  const isIncoming =
                    connection?.recipient_id === user?.id &&
                    connection?.status === "pending";
                  const isOutgoing =
                    connection?.requester_id === user?.id &&
                    connection?.status === "pending";
                  const isConnected = connection?.status === "accepted";
                  const isDeclined = connection?.status === "rejected";
                  const isBusy = busyId === profile.id;

                  return (
                    <article
                      key={profile.id}
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: "18px",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          marginBottom: "18px",
                        }}
                      >
                        <div
                          aria-hidden="true"
                          style={{
                            width: "54px",
                            height: "54px",
                            borderRadius: "16px",
                            flexShrink: 0,
                            background:
                              avatarColors[index % avatarColors.length],
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: "18px",
                            color: C.plum,
                          }}
                        >
                          {initials(profile.full_name)}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <h3
                            style={{
                              fontSize: "19px",
                              margin: "0 0 6px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {profile.full_name || "ConnectHub member"}
                          </h3>

                          <p
                            style={{
                              color: C.muted,
                              fontSize: "13px",
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {profile.location || "Location not added"}
                          </p>
                        </div>
                      </div>

                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: "14px",
                          lineHeight: 1.6,
                          margin: "0 0 12px",
                        }}
                      >
                        {profile.headline || "Exploring new connections"}
                      </p>

                      {profile.bio && (
                        <p
                          style={{
                            color: C.muted,
                            fontSize: "14px",
                            lineHeight: 1.7,
                            margin: "0 0 18px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {profile.bio.length > 150
                            ? `${profile.bio.slice(0, 150)}...`
                            : profile.bio}
                        </p>
                      )}

                      {profile.skills?.length > 0 && (
                        <div style={{ marginBottom: "14px" }}>
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "1px",
                              color: C.muted,
                              margin: "0 0 9px",
                            }}
                          >
                            SKILLS
                          </p>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "7px",
                            }}
                          >
                            {profile.skills.slice(0, 6).map((skill) => (
                              <span
                                key={skill}
                                style={{
                                  background: "#F0E7F1",
                                  borderRadius: "7px",
                                  padding: "6px 9px",
                                  fontSize: "12px",
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.interests?.length > 0 && (
                        <p
                          style={{
                            color: C.muted,
                            fontSize: "13px",
                            lineHeight: 1.6,
                            margin: "0 0 18px",
                          }}
                        >
                          <strong style={{ color: C.plum }}>Interests: </strong>
                          {profile.interests.slice(0, 4).join(", ")}
                        </p>
                      )}

                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: "16px",
                          borderTop: `1px solid ${C.border}`,
                        }}
                      >
                        {isIncoming ? (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <button
                              type="button"
                              disabled={!!busyId}
                              onClick={() =>
                                respondToRequest(
                                  connection.id,
                                  "accepted",
                                  profile.id,
                                )
                              }
                              style={{
                                ...styles.button,
                                background: C.plum,
                                color: "#FFFFFF",
                                opacity: busyId ? 0.65 : 1,
                              }}
                            >
                              {isBusy ? "Please wait..." : "Accept"}
                            </button>

                            <button
                              type="button"
                              disabled={!!busyId}
                              onClick={() =>
                                respondToRequest(
                                  connection.id,
                                  "rejected",
                                  profile.id,
                                )
                              }
                              style={{
                                ...styles.button,
                                background: "#F0E7F1",
                                color: C.plum,
                                opacity: busyId ? 0.65 : 1,
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        ) : isConnected ? (
                          <span
                            style={{
                              display: "inline-block",
                              background: "#E5EEDC",
                              color: "#355D36",
                              borderRadius: "10px",
                              padding: "12px 14px",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            ✓ Connected
                          </span>
                        ) : isOutgoing ? (
                          <span
                            style={{
                              display: "inline-block",
                              background: "#F0E7F1",
                              color: C.plum,
                              borderRadius: "10px",
                              padding: "12px 14px",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Request sent · Pending
                          </span>
                        ) : isDeclined ? (
                          <span
                            style={{
                              display: "inline-block",
                              color: C.muted,
                              fontSize: "13px",
                              fontWeight: 600,
                            }}
                          >
                            Request declined
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!!busyId}
                            onClick={() => sendRequest(profile.id)}
                            style={{
                              ...styles.button,
                              background: C.plum,
                              color: "#FFFFFF",
                              opacity: busyId ? 0.65 : 1,
                            }}
                          >
                            {isBusy ? "Sending..." : "+ Connect"}
                          </button>
                        )}

                        <p
                          style={{
                            margin: "12px 0 0",
                            fontSize: "12px",
                            color: C.muted,
                          }}
                        >
                          ConnectHub community
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: "20px",
                  padding: "48px 24px",
                }}
              >
                <div style={{ fontSize: "38px", marginBottom: "16px" }}>
                  {search ? "⌕" : "✳"}
                </div>

                <h3 style={{ fontSize: "23px", margin: "0 0 12px" }}>
                  {search
                    ? "No matching members yet"
                    : "You're one of the first!"}
                </h3>

                <p
                  style={{
                    color: C.muted,
                    fontSize: "15px",
                    lineHeight: 1.8,
                    maxWidth: "460px",
                    margin: "0 auto 22px",
                  }}
                >
                  {search
                    ? "Try another name, skill, or location."
                    : "Your profile is saved. When other people sign up and complete their profiles, they'll appear here."}
                </p>

                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    style={{
                      ...styles.button,
                      background: C.plum,
                      color: "#FFFFFF",
                    }}
                  >
                    Clear search
                  </button>
                ) : (
                  <a
                    href="/profile"
                    style={{
                      display: "inline-block",
                      background: C.plum,
                      color: "#FFFFFF",
                      textDecoration: "none",
                      borderRadius: "10px",
                      padding: "13px 18px",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    Edit my profile →
                  </a>
                )}
              </div>
            )}
          </>
        )}

        <footer
          style={{
            marginTop: "56px",
            paddingTop: "22px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            color: C.muted,
            fontSize: "12px",
          }}
        >
          <span>ConnectHub © Build meaningful connections.</span>
          <a href="/profile" style={styles.link}>
            Your profile →
          </a>
        </footer>
      </div>
    </main>
  );
}
