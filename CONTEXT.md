# Project Context

## Overview
This is an Astro-based web application for a fashion catalog (RB).
It uses Tailwind CSS for styling.

## Data Structure
- **Products**: Defined in `src/pages/index.astro`.
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
