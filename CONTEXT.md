# Project Context

## Overview
This is an Astro-based web application for a fashion catalog (RB).
It uses Tailwind CSS for styling.

## Brand Colors
- **Primary (Lavender)**: `#E3CCEF` - Used for main accents, navigation hovers, form focus rings
- **Secondary (Pink)**: `#FFB8D2` - Used for interactive elements, button hovers, product card hovers
- **Accent (Peach)**: `#F7D1A4` - Reserved for future use

These colors are configured in `src/styles/global.css` using Tailwind v4's `@theme` directive.

## Data Structure
- **Products**: Defined in `src/data/products.ts`.
  - `categories`: Array of strings (e.g., `["Vestidos", "Verano"]`).
  - `color`: String (e.g., "Multicolor").
  - `images`: Array of URLs.
  - `sizes`: Array of strings.

## Environment & Development
- **Node Version**: This project requires a specific Node.js version (v20.19.2).
- **Package Manager**: npm
- **Setup**:
  - Use `nvm` to switch to the correct node version:
    ```bash
    nvm use 20.19.2
    ```
  - Install dependencies: `npm install`
  - Run dev server: `npm run dev`

## Key Components
- `ProductCard.astro`: Displays individual product details including multiple categories and color.
