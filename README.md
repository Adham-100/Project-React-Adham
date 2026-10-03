# Adham's Market

A responsive supermarket storefront built with React, Vite, React Router, and DummyJSON.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` for a production build and `npm run lint` for lint checks.

## Features

- A 38-product catalog: 15 groceries, 15 kitchen essentials, and 8 Home & Furniture products from DummyJSON
- Product search, department filtering, sorting, pagination, and detail pages
- Sign-in through DummyJSON and browser-local demo registration
- A persistent cart and checkout form that records delivery details and generates an order number
- Admin profile overview with income, order, product, and customer metrics plus recent activity
- Product, user, and order management with sample orders in the demo dashboard; orders support multiple products and calculated totals

## Demo data

DummyJSON write endpoints return example responses but do not permanently save changes. Product additions, edits, and deletions are saved in this browser and shared with the storefront. Checkout and dashboard orders are also saved in this browser. User changes remain demo-only. New registrations are submitted to DummyJSON, then a salted password hash and session profile are saved in this browser so the demo account can sign in again. This frontend-only persistence and authentication are for coursework demos, not production use.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
