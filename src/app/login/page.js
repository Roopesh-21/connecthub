"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";
export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setMessage(
            "Account created! Check your email to confirm your account before logging in.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#F5EDE2",
        color: "#33264A",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "36px",
          borderRadius: "24px",
          background: "#FFFCF8",
          boxShadow: "0 18px 60px rgba(51,38,74,0.10)",
          boxSizing: "border-box",
        }}
      >
        <a
          href="/"
          style={{
            color: "#33264A",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          ← Back to ConnectHub
        </a>

        <p
          style={{
            marginTop: "32px",
            color: "#E56B4A",
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "2px",
          }}
        >
          CONNECTHUB
        </p>

        <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>

        <p style={{ color: "#756B7E", lineHeight: 1.6 }}>
          {isSignup
            ? "Create an account and start making meaningful connections."
            : "Sign in to continue your journey."}
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "16px",
            marginTop: "28px",
          }}
        >
          <label style={{ display: "grid", gap: "8px", fontSize: "14px" }}>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: "8px", fontSize: "14px" }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              style={inputStyle}
            />
          </label>

          {message && (
            <p
              role="status"
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                overflowWrap: "anywhere",
                color: "#9B4939",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "15px",
              background: "#33264A",
              color: "white",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "14px",
            color: "#756B7E",
          }}
        >
          {isSignup ? "Already have an account?" : "New to ConnectHub?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setMessage("");
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "#E56B4A",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
      </section>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px",
  border: "1px solid #E5D9CE",
  borderRadius: "10px",
  background: "#FFFFFF",
  color: "#33264A",
  fontSize: "15px",
  outlineColor: "#E9A9B8",
  boxSizing: "border-box",
};
