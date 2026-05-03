"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF7F0",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            padding: 24,
            background: "#fff",
            borderRadius: 16,
            border: "1px solid rgba(26, 39, 68, 0.12)",
          }}
        >
          <h1 style={{ color: "#1A2744", marginTop: 0 }}>Something went wrong</h1>
          <p style={{ color: "#1A2744", opacity: 0.75 }}>
            The app hit an error while loading. Try refreshing. If it keeps
            happening, check the browser console (F12) for details.
          </p>
          {process.env.NODE_ENV === "development" ? (
            <pre
              style={{
                fontSize: 12,
                overflow: "auto",
                background: "#FAF7F0",
                padding: 12,
                borderRadius: 8,
                color: "#1A2744",
              }}
            >
              {error.message}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              background: "#1A2744",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
