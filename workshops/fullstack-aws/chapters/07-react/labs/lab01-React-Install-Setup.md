# React Project Setup (Beginner-friendly)

This README contains exact commands and steps to set up a fresh React project from scratch on Windows.

## Prerequisites (Windows)
- Install Node.js LTS (>=18) from https://nodejs.org/ or use `nvm-windows` to manage versions.
- Install Visual Studio Code (optional but recommended).

## 1) Verify Node and npm
Open PowerShell and run:

```powershell
node -v
npm -v
```

## 2) Create a new React project (recommended: Vite)
Interactive (choose project name and template):

```bash
npm create vite@latest
```

Create non-interactively (JavaScript):

```bash
npm create vite@latest my-app -- --template react
```

Create with TypeScript:

```bash
npm create vite@latest my-app -- --template react-ts
```

Alternative (Create React App):

```bash
npx create-react-app my-app
# With TypeScript
npx create-react-app my-app --template typescript
```

## 3) Install dependencies

```bash
cd my-app
npm install
```

## 4) Start the dev server

For Vite:

```bash
npm run dev
```

For Create React App:

```bash
npm start
```

Open the shown URL (usually `http://localhost:5173` for Vite or `http://localhost:3000` for CRA).

## 5) Project structure basics (what to look for)
- `package.json`: scripts and dependencies.
- `src/`: your React code (`main.jsx` or `main.tsx`, `App.jsx`).
- `index.html` (Vite) or `public/index.html` (CRA).

## 6) Add TypeScript later (optional)

```bash
npm install --save-dev typescript @types/react @types/react-dom
npx tsc --init
# rename .jsx files to .tsx and fix types
```

## 7) Initialize Git (recommended)

```bash
git init
git add .
git commit -m "Initial commit - scaffold react app"
```

## 8) Build for production

Vite:

```bash
npm run build
npm run preview
```

Create React App:

```bash
npm run build
# serve the `build` folder with any static server
```

## 9) Useful dev tools & tips
- VS Code extensions: ESLint, Prettier, Simple React Snippets.
- Add `.gitignore` (node_modules, dist/build).
- Configure ESLint/Prettier if desired.

---


