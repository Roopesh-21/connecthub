"use client";

import { useEffect, useState } from "react";
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

const buttonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};

export default function RequestsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadRequests(currentUser) {
    const supabase = createClient();

    const { data, error: requestError } = await supabase
      .from("connections")
      .select("id, requester_id, recipient_id, status, created_at")
      .eq("recipient_id", currentUser.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (requestError) throw requestError;

    const rows = data || [];

    if (rows.length === 0) {
      setRequests([]);
      return;
    }

    const requesterIds = [
      ...new Set(rows.map((request) => request.requester_id)),
    ];

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, headline, bio, location, skills, interests")
      .in("id", requesterIds);

    if (profileError) throw profileError;

    const profileMap = new Map(
      (profiles || []).map((profile) => [profile.id, profile]),
    );

    setRequests(
      rows.map((request) => ({
        ...request,
        profile: profileMap.get(request.requester_id) || null,
      })),
    );
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
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

      try {
        await loadRequests(currentUser);
      } catch (err) {
        if (active) setError(err.message || "Couldn't load requests.");
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [router]);

  async function respond(request, status) {
    if (!user || busyId) return;

    setBusyId(request.id);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();

      const { data, error: updateError } = await supabase
        .from("connections")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .select("id");

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error(
          "This request has already changed. Refresh and try again.",
        );
      }

      await loadRequests(user);

      setNotice(
        status === "accepted"
          ? "Request accepted! You're now connected."
          : "Request declined.",
      );
    } catch (err) {
      setError(err.message || "Couldn't update this request.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: C.bg,
          color: C.plum,
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading your requests...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.plum,
        fontFamily: "Arial, sans-serif",
        padding: "28px 20px 60px",
      }}
    >
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
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
              color: C.plum,
              textDecoration: "none",
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "-1px",
            }}
          >
            ConnectHub<span style={{ color: C.coral }}>.</span>
          </a>

          <div style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
            <a href="/" style={navLink}>
              Home
            </a>
            <a href="/discover" style={navLink}>
              Discover
            </a>
            <a href="/connections" style={navLink}>
              My connections
            </a>
            <a href="/profile" style={navLink}>
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
            GROW YOUR COMMUNITY
          </p>

          <h1
            style={{
              fontSize: "clamp(38px, 7vw, 66px)",
              letterSpacing: "-2.5px",
              lineHeight: 1.05,
              margin: "0 0 18px",
            }}
          >
            Connection <span style={{ color: C.coral }}>requests.</span>
          </h1>

          <p
            style={{
              color: C.muted,
              fontSize: "17px",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Meet the people who want to connect with you. Accept a request to
            add someone to your network.
          </p>
        </section>

        {notice && (
          <div
            role="status"
            style={{
              background: "#E5EEDC",
              color: "#355D36",
              padding: "14px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
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
          </div>
        )}

        <section
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            padding: "22px 24px",
            marginBottom: "28px",
          }}
        >
          <p
            style={{
              color: C.muted,
              fontSize: "13px",
              margin: "0 0 8px",
            }}
          >
            WAITING FOR YOUR RESPONSE
          </p>
          <h2 style={{ fontSize: "28px", margin: 0 }}>
            {requests.length}{" "}
            {requests.length === 1 ? "pending request" : "pending requests"}
          </h2>
        </section>

        {requests.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "18px",
            }}
          >
            {requests.map((request) => {
              const person = request.profile;
              const initials = (person?.full_name || "CH")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();

              const isBusy = busyId === request.id;

              return (
                <article
                  key={request.id}
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
                      style={{
                        width: "54px",
                        height: "54px",
                        borderRadius: "16px",
                        flexShrink: 0,
                        background: C.pink,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: "18px",
                      }}
                    >
                      {initials}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: "19px",
                          margin: "0 0 6px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {person?.full_name || "ConnectHub member"}
                      </h3>
                      <p
                        style={{
                          color: C.muted,
                          fontSize: "13px",
                          margin: 0,
                        }}
                      >
                        {person?.location || "Location not added"}
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
                    {person?.headline || "Looking to connect"}
                  </p>

                  {person?.bio && (
                    <p
                      style={{
                        color: C.muted,
                        fontSize: "14px",
                        lineHeight: 1.7,
                        margin: "0 0 16px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {person.bio.length > 150
                        ? `${person.bio.slice(0, 150)}...`
                        : person.bio}
                    </p>
                  )}

                  {person?.skills?.length > 0 && (
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

                  {person?.interests?.length > 0 && (
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
                      display: "flex",
                      gap: "9px",
                      flexWrap: "wrap",
                      marginTop: "auto",
                      paddingTop: "16px",
                      borderTop: `1px solid ${C.border}`,
                    }}
                  >
                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() => respond(request, "accepted")}
                      style={{
                        ...buttonStyle,
                        background: C.plum,
                        color: "#FFFFFF",
                        opacity: busyId ? 0.65 : 1,
                      }}
                    >
                      {isBusy ? "Please wait..." : "Accept request"}
                    </button>

                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() => respond(request, "rejected")}
                      style={{
                        ...buttonStyle,
                        background: "#F0E7F1",
                        color: C.plum,
                        opacity: busyId ? 0.65 : 1,
                      }}
                    >
                      Decline
                    </button>
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
              padding: "52px 24px",
            }}
          >
            <div style={{ fontSize: "42px", marginBottom: "16px" }}>✳</div>
            <h2 style={{ fontSize: "25px", margin: "0 0 12px" }}>
              You're all caught up.
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
              When someone sends you a connection request, it will appear here.
              Keep discovering people in the meantime.
            </p>
            <a
              href="/discover"
              style={{
                display: "inline-block",
                padding: "13px 18px",
                borderRadius: "10px",
                background: C.plum,
                color: "#FFFFFF",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
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
          <a href="/discover" style={navLink}>
            Find more people →
          </a>
        </footer>
      </div>
    </main>
  );
}

const navLink = {
  color: C.plum,
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 600,
};
