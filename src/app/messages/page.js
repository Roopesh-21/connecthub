"use client";

import { useCallback, useEffect, useState } from "react";
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

const linkStyle = {
  color: C.plum,
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${C.border}`,
  borderRadius: "12px",
  background: C.card,
  color: C.plum,
  padding: "13px 15px",
  fontSize: "14px",
  outlineColor: C.coral,
};

function initials(name) {
  return (name || "CH")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedConversation =
    conversations.find((item) => item.id === selectedId) || null;

  // Mark incoming messages as read for the current user.
  const markMessagesAsRead = useCallback(async (messageRows, currentUserId) => {
    const receipts = (messageRows || [])
      .filter((message) => message.sender_id !== currentUserId)
      .map((message) => ({
        message_id: message.id,
        user_id: currentUserId,
      }));

    if (receipts.length === 0) return;

    const supabase = createClient();

    const { error: readError } = await supabase
      .from("message_reads")
      .upsert(receipts, {
        onConflict: "message_id,user_id",
        ignoreDuplicates: true,
      });

    if (readError) {
      console.error("Couldn't mark messages as read:", readError.message);
    }
  }, []);

  const loadMessages = useCallback(
    async (connectionId) => {
      const supabase = createClient();

      const { data, error: queryError } = await supabase
        .from("messages")
        .select("id, connection_id, sender_id, content, created_at")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;

      setMessages(data || []);

      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authError && currentUser) {
        await markMessagesAsRead(data || [], currentUser.id);
      }
    },
    [markMessagesAsRead],
  );

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

      const { data: rows, error: connectionError } = await supabase
        .from("connections")
        .select("id, requester_id, recipient_id")
        .eq("status", "accepted")
        .or(
          `requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`,
        );

      if (!active) return;

      if (connectionError) {
        setError(connectionError.message);
        setLoading(false);
        return;
      }

      const connectionRows = rows || [];

      if (connectionRows.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const otherIds = [
        ...new Set(
          connectionRows.map((row) =>
            row.requester_id === currentUser.id
              ? row.recipient_id
              : row.requester_id,
          ),
        ),
      ];

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, headline, location")
        .in("id", otherIds);

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const profileMap = new Map(
        (profiles || []).map((profile) => [profile.id, profile]),
      );

      const items = connectionRows
        .map((row) => {
          const otherId =
            row.requester_id === currentUser.id
              ? row.recipient_id
              : row.requester_id;

          return {
            id: row.id,
            otherId,
            person: profileMap.get(otherId) || {
              id: otherId,
              full_name: "ConnectHub member",
              headline: "",
              location: "",
            },
          };
        })
        .sort((a, b) =>
          (a.person.full_name || "").localeCompare(b.person.full_name || ""),
        );

      setConversations(items);
      setSelectedId((previous) =>
        previous && items.some((item) => item.id === previous)
          ? previous
          : items[0]?.id || "",
      );
      setLoading(false);
    }

    initialize();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!user || !selectedId) {
      setMessages([]);
      return;
    }

    let active = true;
    const supabase = createClient();

    setMessages([]);
    setMessagesLoading(true);
    setError("");

    const channel = supabase
      .channel(`chat-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `connection_id=eq.${selectedId}`,
        },
        (payload) => {
          if (!active) return;

          const incoming = payload.new;

          setMessages((previous) =>
            previous.some((message) => message.id === incoming.id)
              ? previous
              : [...previous, incoming].sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime(),
                ),
          );

          // Incoming messages are read immediately while this chat is open.
          if (incoming.sender_id !== user.id) {
            markMessagesAsRead([incoming], user.id);
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (active) {
            setNotice(
              "Live updates are temporarily unavailable. You can still refresh the conversation.",
            );
          }
        } else if (status === "SUBSCRIBED") {
          if (active) setNotice("");
        }
      });

    loadMessages(selectedId)
      .catch((err) => {
        if (active) setError(err.message || "Couldn't load messages.");
      })
      .finally(() => {
        if (active) setMessagesLoading(false);
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, selectedId, loadMessages, markMessagesAsRead]);

  async function sendMessage(event) {
    event.preventDefault();

    const content = draft.trim();

    if (!content || !user || !selectedConversation || sending) return;

    if (content.length > 2000) {
      setError("Messages must be 2,000 characters or fewer.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          connection_id: selectedConversation.id,
          sender_id: user.id,
          content,
        })
        .select("id, connection_id, sender_id, content, created_at")
        .single();

      if (insertError) throw insertError;

      setMessages((previous) =>
        previous.some((message) => message.id === data.id)
          ? previous
          : [...previous, data].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            ),
      );

      setDraft("");
    } catch (err) {
      setError(err.message || "Couldn't send your message.");
    } finally {
      setSending(false);
    }
  }

  const filteredConversations = conversations.filter((conversation) =>
    (conversation.person.full_name || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={centerStyle}>Loading your conversations...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "38px",
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

          <div
            style={{
              display: "flex",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <a href="/discover" style={linkStyle}>
              Discover
            </a>
            <a href="/requests" style={linkStyle}>
              Requests
            </a>
            <a href="/connections" style={linkStyle}>
              My Connections
            </a>
            <a href="/messages" style={{ ...linkStyle, fontWeight: 800 }}>
              Messages
            </a>
            <a href="/profile" style={linkStyle}>
              My Profile
            </a>
          </div>
        </nav>

        <section style={{ marginBottom: "30px" }}>
          <p
            style={{
              color: C.coral,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "2px",
              marginBottom: "12px",
            }}
          >
            YOUR COMMUNITY, ONE CONVERSATION AT A TIME
          </p>

          <h1
            style={{
              fontSize: "clamp(38px, 6vw, 60px)",
              letterSpacing: "-2.5px",
              lineHeight: 1.1,
              margin: "0 0 14px",
            }}
          >
            Your <span style={{ color: C.coral }}>messages.</span>
          </h1>

          <p
            style={{
              color: C.muted,
              fontSize: "16px",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Good connections start with a conversation.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            style={{
              padding: "14px 16px",
              background: "#FFF0ED",
              color: "#A33225",
              borderRadius: "12px",
              marginBottom: "16px",
              overflowWrap: "anywhere",
            }}
          >
            <strong>Something went wrong.</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              padding: "12px 16px",
              background: "#FFF7E8",
              color: "#78572C",
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          >
            {notice}
          </div>
        )}

        {conversations.length === 0 ? (
          <section style={emptyStyle}>
            <div style={{ fontSize: "42px", marginBottom: "14px" }}>✳</div>
            <h2 style={{ fontSize: "25px", margin: "0 0 12px" }}>
              Your first conversation starts here.
            </h2>
            <p style={emptyTextStyle}>
              You need an accepted connection before you can start chatting.
              Discover people and build your network first.
            </p>
            <a href="/connections" style={primaryButtonStyle}>
              View my connections →
            </a>
          </section>
        ) : (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.6fr)",
              gap: "18px",
              alignItems: "stretch",
            }}
            className="connecthub-chat-layout"
          >
            <aside
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "18px",
                padding: "18px",
                minWidth: 0,
              }}
            >
              <h2 style={{ fontSize: "20px", margin: "2px 0 16px" }}>
                Conversations
              </h2>

              <input
                aria-label="Search conversations"
                type="search"
                placeholder="Find a connection..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{ ...inputStyle, marginBottom: "14px" }}
              />

              <div style={{ display: "grid", gap: "8px" }}>
                {filteredConversations.map((conversation) => {
                  const active = conversation.id === selectedId;
                  const person = conversation.person;

                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => setSelectedId(conversation.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%",
                        textAlign: "left",
                        padding: "13px 10px",
                        borderRadius: "12px",
                        border: `1px solid ${active ? C.plum : "transparent"}`,
                        background: active ? "#F0E7F1" : "transparent",
                        color: C.plum,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          width: "43px",
                          height: "43px",
                          borderRadius: "14px",
                          background: C.pink,
                          fontWeight: 800,
                          fontSize: "13px",
                        }}
                      >
                        {initials(person.full_name)}
                      </span>

                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontWeight: 700,
                            fontSize: "14px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {person.full_name || "ConnectHub member"}
                        </span>
                        <span
                          style={{
                            display: "block",
                            color: C.muted,
                            fontSize: "12px",
                            marginTop: "5px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {person.headline || "Your connection"}
                        </span>
                      </span>
                    </button>
                  );
                })}

                {filteredConversations.length === 0 && (
                  <p style={{ color: C.muted, fontSize: "13px" }}>
                    No connections match that search.
                  </p>
                )}
              </div>
            </aside>

            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "18px",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                minHeight: "560px",
                overflow: "hidden",
              }}
            >
              {selectedConversation && (
                <>
                  <header
                    style={{
                      padding: "18px 20px",
                      borderBottom: `1px solid ${C.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: "46px",
                        height: "46px",
                        flexShrink: 0,
                        borderRadius: "14px",
                        background: C.pink,
                        fontWeight: 800,
                      }}
                    >
                      {initials(selectedConversation.person.full_name)}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <h2
                        style={{
                          fontSize: "17px",
                          margin: "0 0 5px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {selectedConversation.person.full_name}
                      </h2>
                      <p
                        style={{ color: C.muted, fontSize: "12px", margin: 0 }}
                      >
                        {selectedConversation.person.location ||
                          "Your ConnectHub connection"}
                      </p>
                    </div>
                  </header>

                  <div
                    aria-live="polite"
                    style={{
                      flex: 1,
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      overflowY: "auto",
                      minHeight: "300px",
                    }}
                  >
                    {messagesLoading && (
                      <p style={{ color: C.muted, fontSize: "13px" }}>
                        Loading messages...
                      </p>
                    )}

                    {!messagesLoading && messages.length === 0 && (
                      <div
                        style={{
                          margin: "auto",
                          textAlign: "center",
                          maxWidth: "300px",
                          padding: "28px 10px",
                        }}
                      >
                        <div style={{ fontSize: "32px", marginBottom: "12px" }}>
                          💬
                        </div>
                        <h3 style={{ fontSize: "19px", margin: "0 0 10px" }}>
                          Say hello!
                        </h3>
                        <p style={emptyTextStyle}>
                          This is the beginning of your conversation. Send the
                          first message below.
                        </p>
                      </div>
                    )}

                    {messages.map((message) => {
                      const mine = message.sender_id === user?.id;

                      return (
                        <div
                          key={message.id}
                          style={{
                            display: "flex",
                            justifyContent: mine ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "82%",
                              minWidth: "50px",
                              padding: "12px 14px 8px",
                              borderRadius: mine
                                ? "16px 16px 4px 16px"
                                : "16px 16px 16px 4px",
                              background: mine ? C.plum : "#F0E7F1",
                              color: mine ? "#FFFFFF" : C.plum,
                              overflowWrap: "anywhere",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            <div style={{ fontSize: "14px", lineHeight: 1.65 }}>
                              {message.content}
                            </div>
                            <div
                              style={{
                                textAlign: "right",
                                fontSize: "10px",
                                opacity: 0.75,
                                marginTop: "5px",
                              }}
                            >
                              {formatTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form
                    onSubmit={sendMessage}
                    style={{
                      padding: "16px",
                      borderTop: `1px solid ${C.border}`,
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "10px",
                    }}
                  >
                    <textarea
                      aria-label="Write a message"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder="Write your message..."
                      rows={2}
                      maxLength={2000}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: "48px",
                        maxHeight: "140px",
                        lineHeight: 1.5,
                      }}
                    />

                    <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      style={{
                        border: "none",
                        borderRadius: "12px",
                        padding: "14px 17px",
                        background: C.plum,
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor:
                          !draft.trim() || sending ? "not-allowed" : "pointer",
                        opacity: !draft.trim() || sending ? 0.55 : 1,
                        flexShrink: 0,
                      }}
                    >
                      {sending ? "Sending..." : "Send ↗"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        )}

        <footer
          style={{
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: `1px solid ${C.border}`,
            color: C.muted,
            fontSize: "12px",
          }}
        >
          ConnectHub © Build meaningful connections.
        </footer>
      </div>

      <style jsx>{`
        @media (max-width: 760px) {
          .connecthub-chat-layout {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: C.bg,
  color: C.plum,
  padding: "28px 20px 60px",
};
const centerStyle = {
  minHeight: "80vh",
  display: "grid",
  placeItems: "center",
};

const emptyStyle = {
  textAlign: "center",
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: "20px",
  padding: "52px 24px",
};

const emptyTextStyle = {
  color: C.muted,
  fontSize: "14px",
  lineHeight: 1.8,
  maxWidth: "440px",
  margin: "0 auto 24px",
};

const primaryButtonStyle = {
  display: "inline-block",
  padding: "13px 18px",
  borderRadius: "10px",
  background: C.plum,
  color: "#FFFFFF",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "14px",
};
