# PolyMinder-core Frontend <!-- omit in toc -->

The **PolyMinder Frontend** is a modular React-based application leveraging the MUI library to provide an intuitive, high-precision interface for visualizing and annotating scientific PDFs.

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Key Techniques & Libraries](#key-techniques--libraries)
3. [Installation](#installation)
4. [Running Locally](#running-locally)
5. [Building for Production](#building-for-production)
6. [Typed API Docs](#typed-api-docs)
7. [License](#license)

---

## Project Structure

```text
.
├── pdf_highlighter/      # Reusable PDF highlighting/annotation library
├── polyminder/           # Main SPA frontend (React + MUI)
│   ├── .env              # Configuration file for API endpoints
│   ├── tsconfig.json     # TypeScript configuration
│   ├── index.html        # HTML entry point
│   ├── dist/             # Build artifacts
│   └── src/              # Source code
└── package.json          # Project dependencies and scripts
```

### Directory Notes
- **`pdf_highlighter/`** – Independent NPM module for precise PDF text positioning and rendering overlays. Published in both ESM and CJS formats with full type safety.
- **`polyminder/`** – Main frontend for visualizing annotations, highlighting text, and interacting with entity-relation graphs.
- **`dist/`** – Output directory created by `npm run build`.

---

## Key Techniques & Libraries

| Area | Highlights |
|------|------------|
| **PDF Rendering** | [`pdfjs-dist`](https://github.com/mozilla/pdfjs-dist) provides accurate canvas-based rendering and sub-character text extraction. |
| **Graph Visualization** | [`reactflow`](https://reactflow.dev/) for interactive DAGs and [`vis-network`](https://visjs.github.io/vis-network/) for scalable layouts. |
| **Annotations** | Interactive drag-and-drop with [`react-beautiful-dnd`](https://github.com/atlassian/react-beautiful-dnd) and region resizing via [`react-rnd`](https://github.com/bokuweb/react-rnd). |
| **Table Views** | Efficient display of large metadata tables using MUI X's [`DataGridPro`](https://mui.com/x/react-data-grid/). |
| **Global State** | Managed using React Context and Reducer patterns for consistency across components. |
| **Build Tools & Docs** | Powered by **Vite 4** for fast HMR and **TypeDoc** for generating structured API documentation. |

---

## Installation

```bash
# Clone the repository
git clone https://github.com/truongdo619/PolyMinder-core.git
cd PolyMinder-core/frontend

# Install dependencies
npm install
```

---

## Running Locally

1. **Set API Endpoints**

   ```bash
   cp polyminder/.env.example polyminder/.env
   # Edit the .env file to set VITE_BACKEND_URL and VITE_PDF_BACKEND_URL
   ```

2. **Start Development Server**

   ```bash
   npm start  # internally runs (cd ./polyminder && vite)
   ```

   Open <http://localhost:3001> in your browser for live development with hot module reloading.

---

## Building for Production

```bash
# Build the frontend and libraries
npm run build
```

- Bundled frontend assets appear in `polyminder/dist/`

To clean all build artifacts and docs:

```bash
npm run clean
```

---

## Typed API Docs

Generate TypeScript API documentation for `pdf_highlighter`:

```bash
npm run build:docs
```

The documentation is output to `polyminder/public/docs` and can be hosted on any static file server.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full terms.