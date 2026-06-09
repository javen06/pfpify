import { AvatarCropper } from "./lib/index.js";

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">browser-only image processing</p>
        <h1>pfpify</h1>
        <p className="intro">
          Clean profile photos for GitHub, LinkedIn, X, Discord, and more.
        </p>
      </section>

      <AvatarCropper platform="github" />
    </main>
  );
}
