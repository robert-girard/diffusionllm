# Mercury 2 Diffusion Chat

A React chat interface for [Mercury 2](https://www.inceptionlabs.ai/) — a diffusion-based LLM by Inception Labs. Features real-time streaming responses rendered with a diffusion animation effect, markdown + LaTeX support, and fine-grained model parameter controls.

**Live demo:** https://robert-girard.github.io/diffusionllm/

## Features

- Diffusion text animation with manual scrubber
- Streaming responses via Server-Sent Events
- Markdown and KaTeX (LaTeX) rendering
- Model selector: `mercury-2` / `mercury-edit`
- Advanced parameter controls: temperature, top-p, guidance scale, denoising steps, reasoning effort, presence/frequency penalties

## Getting Started

Requires an [Inception Labs API key](https://www.inceptionlabs.ai/).

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Deployment

Deploys automatically to GitHub Pages on push to `main` via GitHub Actions.

To enable: go to **Settings → Pages** in the GitHub repo and set the source to **GitHub Actions**.

## TODO

- [ ] Replace CDN Tailwind (`cdn.tailwindcss.com` in `index.html`) with build-time Tailwind CSS — add `tailwind.config.js`, `postcss.config.js`, and a base CSS file imported in `main.jsx`
