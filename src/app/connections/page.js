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
  button: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: "10px",
    background: C.plum,
    color: "#FFFFFF",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "13px",
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
};

export default function ConnectionsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadConnections() {
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

      const { data: connectionRows, error: connectionError } = await supabase
        .from("connections")
        .select("requester_id, recipient_id")
        .eq("status", "accepted");

      if (!active) return;

      if (connectionError) {
        setError(connectionError.message);
        setLoading(false);
        return;
      }

      const connectedIds = [
        ...new Set(
          (connectionRows || [])
            .filter(
              (connection) =>
                connection.requester_id === currentUser.id ||
                connection.recipient_id === currentUser.id,
            )
            .map((connection) =>
              connection.requester_id === currentUser.id
                ? connection.recipient_id
                : connection.requester_id,
            ),
        ),
      ];

      if (connectedIds.length === 0) {
        setConnections([]);
        setLoading(false);
        return;
      }

      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, headline, bio, location, skills, interests")
        .in("id", connectedIds)
        .order("full_name", { ascending: true });

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
      } else {
        setConnections(profileRows || []);
      }

      setLoading(false);
    }

    loadConnections();

    return () => {
      active = false;
    };
  }, [router]);

  const filteredConnections = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return connections;

    return connections.filter((person) => {
      const searchable = [
        person.full_name,
        person.headline,
        person.bio,
        person.location,
        ...(person.skills || []),
        ...(person.interests || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [connections, search]);

  function initials(name) {
    return (name || "CH")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
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
        Loading your connections...
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

          <div
            style={{
              display: "flex",
              gap: "22px",
              flexWrap: "wrap",
            }}
          >
            <a href="/" style={styles.link}>
              Home
            </a>
            <a href="/discover" style={styles.link}>
              Discover
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
            YOUR COMMUNITY, CLOSER
          </p>

          <h1
            style={{
              fontSize: "clamp(38px, 7vw, 66px)",
              letterSpacing: "-2.5px",
              lineHeight: 1.05,
              margin: "0 0 18px",
            }}
          >
            My <span style={{ color: C.coral }}>connections.</span>
          </h1>

          <p
            style={{
              color: C.muted,
              fontSize: "17px",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            The people you've connected with, the ideas you'll exchange, and the
            things you might build together.
          </p>
        </section>

        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "28px",
            padding: "22px 24px",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
          }}
        >
          <div>
            <p
              style={{
                color: C.muted,
                fontSize: "13px",
                margin: "0 0 8px",
              }}
            >
              YOUR NETWORK
            </p>
            <h2 style={{ fontSize: "28px", margin: 0 }}>
              {connections.length}{" "}
              {connections.length === 1 ? "connection" : "connections"}
            </h2>
          </div>

          <a href="/discover" style={styles.button}>
            + Find people
          </a>
        </section>

        {error ? (
          <div
            role="alert"
            style={{
              background: "#FFF0ED",
              color: "#A33225",
              padding: "18px",
              borderRadius: "12px",
              overflowWrap: "anywhere",
            }}
          >
            <strong>Couldn't load your connections.</strong>
            <p>{error}</p>
            Try refreshing the page.
          </div>
        ) : connections.length > 0 ? (
          <>
            <section
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                padding: "12px",
                borderRadius: "16px",
                marginBottom: "28px",
              }}
            >
              <label
                htmlFor="connection-search"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  margin: "4px 4px 10px",
                }}
              >
                Search your connections
              </label>

              <input
                id="connection-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try a name, skill, or location..."
                style={styles.input}
              />
            </section>

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
              <h2 style={{ fontSize: "22px", margin: 0 }}>Your people</h2>

              <span style={{ color: C.muted, fontSize: "13px" }}>
                Showing {filteredConnections.length} of {connections.length}
              </span>
            </div>

            {filteredConnections.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                  gap: "18px",
                }}
              >
                {filteredConnections.map((person, index) => (
                  <article
                    key={person.id}
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
                          background: avatarColors[index % avatarColors.length],
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 800,
                          fontSize: "18px",
                          color: C.plum,
                        }}
                      >
                        {initials(person.full_name)}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <h3
                          style={{
                            fontSize: "19px",
                            margin: "0 0 6px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {person.full_name || "ConnectHub member"}
                        </h3>

                        <p
                          style={{
                            color: C.muted,
                            fontSize: "13px",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {person.location || "Location not added"}
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
                      {person.headline || "Exploring new connections"}
                    </p>

                    {person.bio && (
                      <p
                        style={{
                          color: C.muted,
                          fontSize: "14px",
                          lineHeight: 1.7,
                          margin: "0 0 18px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {person.bio.length > 150
                          ? `${person.bio.slice(0, 150)}...`
                          : person.bio}
                      </p>
                    )}

                    {person.skills?.length > 0 && (
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
                          {person.skills.slice(0, 6).map((skill) => (
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

                    {person.interests?.length > 0 && (
                      <p
                        style={{
                          color: C.muted,
                          fontSize: "13px",
                          lineHeight: 1.6,
                          margin: "0 0 18px",
                        }}
                      >
                        <strong style={{ color: C.plum }}>Interests: </strong>
                        {person.interests.slice(0, 4).join(", ")}
                      </p>
                    )}

                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: "16px",
                        borderTop: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "#355D36",
                          background: "#E5EEDC",
                          borderRadius: "9px",
                          padding: "9px 11px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        ✓ Connected
                      </span>

                      <span
                        style={{
                          color: C.muted,
                          fontSize: "12px",
                        }}
                      >
                        ConnectHub
                      </span>
                    </div>
                  </article>
                ))}
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
                <h3 style={{ fontSize: "23px", margin: "0 0 12px" }}>
                  No matching connections
                </h3>
                <p
                  style={{
                    color: C.muted,
                    fontSize: "15px",
                    lineHeight: 1.8,
                    margin: "0 0 22px",
                  }}
                >
                  Try another name, skill, or location.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    ...styles.button,
                  }}
                >
                  Clear search
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: "20px",
              padding: "52px 24px",
            }}
          >
            <div style={{ fontSize: "42px", marginBottom: "16px" }}>✳</div>

            <h2 style={{ fontSize: "25px", margin: "0 0 12px" }}>
              Your network starts here.
            </h2>

            <p
              style={{
                color: C.muted,
                fontSize: "15px",
                lineHeight: 1.8,
                maxWidth: "460px",
                margin: "0 auto 24px",
              }}
            >
              Discover people who share your interests. When they accept your
              connection requests, they'll appear here.
            </p>

            <a href="/discover" style={styles.button}>
              Discover people →
            </a>
          </div>
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
          <a href="/discover" style={styles.link}>
            Find more people →
          </a>
        </footer>
      </div>
    </main>
  );
}
