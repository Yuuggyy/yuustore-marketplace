import { Component, type ReactNode } from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e8e8ef", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "monospace" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#ef4444" }}>Erreur de chargement</h1>
          <pre style={{ maxWidth: "600px", overflow: "auto", fontSize: "0.85rem", lineHeight: 1.5 }}>
            {this.state.error?.message || "Erreur inconnue"}
            {"\n\n"}
            {this.state.error?.stack || ""}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#e5b322", color: "#000", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
