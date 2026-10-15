"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "../../lib/supabase";

const C = {
  plum: "#33264A",
  coral: "#E56B4A",
  border: "#E5D9CE",
  muted: "#786E7D",
};

const mainLinks = [
  { label: "Discover", href: "/discover" },
  { label: "Requests", href: "/requests" },
  { label: "My Connections", href: "/connections" },
  { label: "Messages", href: "/messages" },
];

const profileLink = { label: "My Profile", href: "/profile" };

export default function AuthNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      setUser(error ? null : data.user);
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const supabase = createClient();
    let active = true;

    async function loadUnreadCount() {
      const { data: connections, error: connectionError } = await supabase
        .from("connections")
        .select("id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (connectionError) {
        console.error("Could not load connections:", connectionError);
        return;
      }

      if (!connections || connections.length === 0) {
        if (active) setUnreadCount(0);
        return;
      }

      const connectionIds = connections.map((item) => item.id);

      const { data: messages, error: messageError } = await supabase
        .from("messages")
        .select("id")
        .in("connection_id", connectionIds)
        .neq("sender_id", user.id);

      if (messageError) {
        console.error("Could not load messages:", messageError);
        return;
      }

      if (!messages || messages.length === 0) {
        if (active) setUnreadCount(0);
        return;
      }

      const messageIds = messages.map((item) => item.id);

      const { data: reads, error: readError } = await supabase
        .from("message_reads")
        .select("message_id")
        .eq("user_id", user.id)
        .in("message_id", messageIds);

      if (readError) {
        console.error("Could not load read receipts:", readError);
        return;
      }

      const readIds = new Set((reads || []).map((item) => item.message_id));
      const unread = messageIds.filter((id) => !readIds.has(id)).length;

      if (active) setUnreadCount(unread);
    }

    loadUnreadCount();

    const channel = supabase
      .channel(`navbar-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          loadUnreadCount();
        },
      )
      .subscribe();

    const interval = setInterval(loadUnreadCount, 10000);

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id, pathname]);

  async function handleSignOut() {
    setSigningOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    setSigningOut(false);

    if (error) {
      alert(error.message);
      return;
    }

    setUser(null);
    setUnreadCount(0);
    router.push("/");
    router.refresh();
  }

  function renderLink(link) {
    const active = pathname === link.href;

    return (
      <a
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          textDecoration: "none",
          color: active ? "#FFFFFF" : C.plum,
          background: active ? C.plum : "transparent",
          border: `1px solid ${active ? C.plum : "transparent"}`,
          borderRadius: "10px",
          padding: "10px 12px",
          fontSize: "13px",
          fontWeight: active ? 700 : 600,
          whiteSpace: "nowrap",
          transition: "background 0.2s ease",
        }}
      >
        {link.label}

        {link.href === "/messages" && unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread messages`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "19px",
              height: "19px",
              padding: "0 5px",
              boxSizing: "border-box",
              borderRadius: "999px",
              background: C.coral,
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: 800,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {active && <span style={{ color: C.coral }}>·</span>}
      </a>
    );
  }

  if (loading) {
    return <span className="nav-cta">Loading...</span>;
  }

  if (!user) {
    return (
      <a href="/login" className="nav-cta">
        Join the community →
      </a>
    );
  }

  return (
    <div className="auth-nav-layout">
      <div className="auth-nav-main">{mainLinks.map(renderLink)}</div>

      <div className="auth-nav-account">
        {renderLink(profileLink)}

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: "10px",
            padding: "10px 12px",
            background: "transparent",
            color: C.muted,
            cursor: signingOut ? "wait" : "pointer",
            fontSize: "13px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
