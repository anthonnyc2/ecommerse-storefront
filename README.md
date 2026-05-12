# 🛍️ Raquel Boutique - E-Commerce Storefront

> A high-performance, modern e-commerce catalog and storefront built with Astro and Tailwind CSS.

![Astro](https://img.shields.io/badge/Astro-5.0-FF5D01?style=for-the-badge&logo=astro&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

This repository contains the frontend customer-facing application for Raquel Boutique. It is designed to be extremely fast, SEO-friendly, and highly responsive, providing an optimal shopping experience across all devices.

---

## ✨ Key Features

- **Blazing Fast Performance**: Built with Astro's Islands architecture, shipping zero JavaScript by default for static content.
- **Modern UI/UX**: Styled with Tailwind CSS v4 for a beautiful, responsive, and maintainable design system.
- **Global State Management**: Powered by Nano Stores (`@nanostores/persistent`) for lightweight, cross-component state sharing (like shopping carts).
- **Production Ready**: Configured for Vercel deployment with integrated error tracking (Sentry) and user behavior analytics (Microsoft Clarity).
- **Robust Testing**: Comprehensive unit testing setup using Vitest and React Testing Library.
- **Code Quality Guardrails**: Pre-configured with ESLint, Prettier, Husky pre-commit hooks, and lint-staged to ensure code consistency.

## 🛠️ Tech Stack

- **Framework**: [Astro v5](https://astro.build/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Nano Stores](https://github.com/nanostores/nanostores)
- **Deployment**: [Vercel](https://vercel.com/)
- **Quality & Formatting**: ESLint, Prettier, Husky
- **Testing**: Vitest, JSDom, Testing Library
- **Monitoring**: Sentry, Microsoft Clarity

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v24+) installed on your machine.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/anthonnyc2/ecommerse-storefront.git
   cd raquelboutique
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the local development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:4321` in your browser to view the application.

## 📜 Available Scripts

In the project directory, you can run:

| Command             | Description                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`       | Starts the local development server at `localhost:4321`.                            |
| `npm run build`     | Builds the production-ready site to the `./dist/` folder.                           |
| `npm run preview`   | Previews the production build locally before deploying.                             |
| `npm run test`      | Runs the test suite using Vitest.                                                   |
| `npm run lint`      | Runs ESLint to identify and report on patterns found in ECMAScript/JavaScript code. |
| `npm run format`    | Runs Prettier to auto-format your code.                                             |
| `npm run typecheck` | Runs `astro check` to verify TypeScript types and Astro component syntax.           |

## 📁 Project Structure

```text
/
├── public/           # Static assets (images, fonts, etc.) that don't require processing
├── src/
│   ├── components/   # Reusable UI components (Astro, React, etc.)
│   ├── layouts/      # Shared page layouts
│   ├── pages/        # File-based routing (each .astro file is a route)
│   └── styles/       # Global CSS and Tailwind configurations
├── astro.config.mjs  # Astro framework configuration
├── package.json      # Project dependencies and scripts
└── tailwind.config.* # Tailwind CSS configuration
```

## 🤝 Contributing

This project uses Husky to enforce code quality. Before committing, `lint-staged` will automatically run ESLint and Prettier on your staged files. Ensure your code passes all checks before opening a pull request.
