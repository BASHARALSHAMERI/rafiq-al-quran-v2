import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../features/auth/auth.store";

const ROLE_COPY = {
  PARENT: {
    title: "Parent companion is available on mobile",
    description:
      "Use the mobile app to follow your children attendance, learning progress, and exam results in real time."
  },
  STUDENT: {
    title: "Student companion is available on mobile",
    description:
      "Use the mobile app for memorization records, assignments, exam attempts, and personal progress tracking."
  }
} as const;

function RoleLandingPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user || (user.role !== "PARENT" && user.role !== "STUDENT")) {
    return null;
  }

  const copy = ROLE_COPY[user.role];

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "linear-gradient(180deg, #f8fafc, #eef2ff)"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 760,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)"
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13, letterSpacing: 0.3 }}>{user.role}</p>
          <h1 style={{ margin: 0, color: "#0f172a", fontSize: 30 }}>{copy.title}</h1>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}>{copy.description}</p>
          <p style={{ margin: "6px 0 0", color: "#334155", fontSize: 14 }}>
            Signed in as <strong>{user.fullName}</strong> ({user.email})
          </p>
        </div>

        <div
          style={{
            marginTop: 18,
            borderRadius: 12,
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
            padding: 14,
            color: "#334155",
            lineHeight: 1.6,
            fontSize: 14
          }}
        >
          Web access for this role is intentionally limited to keep the active surface aligned with the approved mobile
          workflow.
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <Link to="/login" style={{ textDecoration: "none" }}>
            <Button variant="secondary">Back to login</Button>
          </Link>
          <Button
            variant="danger"
            onClick={() => {
              void logout();
            }}
          >
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}

export default RoleLandingPage;
