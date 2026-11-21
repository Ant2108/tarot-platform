# Vespera Tarot — 100% Frontend-Only BYOK Gemini AI Tarot Reader & 78-Card Library

An immersive **100% Frontend-Only** 3D Tarot Reading Platform and 78-Card Rider-Waite-Smith Knowledge Library powered by **Bring Your Own Key (BYOK) Google Gemini AI** directly in the browser, deployable straight to **GitHub Pages** (`output: "export"`).

- **Zero Backend / Zero Supabase / Zero Database / Zero Server API Routes**
- **Strict BYOK (No Shared Owner API Key)**: Every visitor brings their own [Google AI Studio](https://aistudio.google.com/apikey) Gemini API Key via the dedicated **`/settings`** AI Configuration page (or the quick **Gemini AI** button in the header).
  - Stored strictly in the user's own browser (`localStorage`), masked after saving, never sent to any website-owned server, and removable in one click.
  - Built-in **Test Connection & Fetch Available Models** (`GET /v1beta/models`) dynamically lists all `generateContent`-capable Gemini models supported by the user's key.
- **Offline Tarot Fallback**: Works immediately even without an API key (or when the user's own Gemini quota is exhausted) using the local structured Tarot knowledge base extracted from the Tarot PDFs.
- **78 Blender-Sculpted `.glb` Cards**: Loaded strictly on demand in Three.js / React Three Fiber, paired with fast 2D archival scans for the 78-card Library.
- **Bilingual VI | EN**: Full Vietnamese & English UI and AI reading support.

---

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`:
1. Visit **`/settings`** (or click **Gemini AI** in the top navigation bar).
2. Paste your personal Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
3. Click **Test Connection & Fetch Available Models** to verify your key and choose from your supported models.
4. Click **Save Configuration** and start a 3-card Tarot reading at **`/reading`**.

To test a production static export locally:
```bash
npm run build
```
All static HTML, JS, CSS, 2D scans, and 78 `.glb` assets are exported to `./out/`.

---

## Security & Browser Storage Notice

- This project **never** embeds a shared owner `NEXT_PUBLIC_GEMINI_API_KEY` into the frontend bundle.
- User API keys are stored only in `localStorage` on the user's own browser and sent directly to `https://generativelanguage.googleapis.com`.
- **Limitation**: `localStorage` is not completely secure on shared/public computers or against malicious browser extensions. Users should always click **Delete Key** when finished on a shared device.

---

## GitHub Pages Deployment

No API keys or backend secrets are required in GitHub Actions:
1. Push to `main`.
2. In your GitHub repo, go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. `.github/workflows/deploy.yml` automatically sets `NEXT_PUBLIC_BASE_PATH="/${{ github.event.repository.name }}"` and deploys `./out` to GitHub Pages.
