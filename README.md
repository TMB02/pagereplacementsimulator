# Page Replacement Algorithm Simulator (Web)

A modern, browser-based simulator for visualising page replacement strategies (FIFO, LRU, Optimal). Built as a fully client-side app so you can host it on any static web server or open it locally.

**Maintainer:** Tejas Badhe &middot; Trinity College of Engineering and Research

## ✨ Features

- Sleek, responsive UI optimised for desktop and mobile.
- Supports FIFO, LRU, and Optimal algorithms individually or together.
- Interactive timeline for each algorithm showing hits vs. faults per reference.
- Quick example datasets to explore common memory access patterns.
- Exportable run summaries for reports or lab submissions.

## 🚀 Getting started

1. Clone or download the project files.
2. Open `index.html` in any modern browser **or** serve the folder via a static host (e.g. GitHub Pages, Netlify, Vercel).

### Optional: run with a local dev server

If you prefer a local server (recommended for Chrome when fetching local modules), run:

```powershell
# From the project root
python -m http.server 8000
```

Then browse to [http://localhost:8000/index.html](http://localhost:8000/index.html).

## 🧠 Usage tips

1. Enter a comma- or space-separated reference string.
2. Choose the number of frames and the algorithm(s) to evaluate.
3. Hit **Run Simulation** from the hero bar.
4. Explore the comparison table and expand individual timelines for details.
5. Use **Download Results** to save a text summary of the latest run.

## 📦 Deployment

Because the simulator is fully static, you can:

- Drag the folder into Netlify/Vercel.
- Commit to a GitHub repo and enable GitHub Pages.
- Host alongside other coursework on any static server.

No backend, build tooling, or additional dependencies required.
