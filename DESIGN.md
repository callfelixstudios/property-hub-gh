---
name: Utility-First Luxury
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#785a00'
  on-secondary: '#ffffff'
  secondary-container: '#fdc425'
  on-secondary-container: '#6d5200'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffdf9a'
  secondary-fixed-dim: '#f7be1d'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5a4300'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is built on the philosophy of **Utility-First Luxury**. It targets a high-trust real estate market, specifically catering to modern urban dwellers and investors in Ghana. The aesthetic balances the authoritative weight of a traditional institution with the streamlined efficiency of a modern tech platform.

The visual style is a hybrid of **Minimalism** and **Modern Corporate**. It prioritizes extreme clarity, generous white space, and a refined editorial layout. The emotional response should be one of immediate confidence, safety, and transparency. By stripping away decorative clutter, the system allows high-quality architectural photography and critical property data to take center stage.

## Colors

This design system utilizes a high-contrast palette to establish hierarchy and trust.

*   **Deep Navy (#0F172A):** Used for primary surfaces, headings, and heavy UI elements to project authority and stability.
*   **Safety Gold (#EAB308):** Applied sparingly as an accent for "Verified" badges, call-to-action highlights, and critical trust indicators. It signifies premium value without feeling gaudy.
*   **Pure White & Slate Neutrals:** The foundation of the UI is built on white (#FFFFFF) and very light slate (#F8FAFC) to ensure the interface feels breathable and modern.
*   **Success & Utility:** A specialized "Green" is used exclusively for "Available" statuses, while "Solar" and "Backup Power" utilities are often represented with neutral-dark icons to maintain a sophisticated look.

## Typography

The typography uses **Plus Jakarta Sans** across all levels. This typeface was selected for its modern, clean geometric shapes which feel contemporary yet highly approachable. 

The scale is designed for high-density information environments. **Display** and **Headline** levels use tighter letter spacing and heavier weights to anchor sections. **Body** text is optimized with a generous line height (1.6) to ensure property descriptions remain legible during long reading sessions. **Labels** use a slight tracking increase and uppercase styling for auxiliary data points like "Square Footage" or "Property ID" to distinguish them from narrative text.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid Grid**. On desktop, content is contained within a 1280px max-width container using a 12-column grid.

*   **Grid Logic:** 24px gutters provide significant separation between property listings, preventing visual clutter. 
*   **Rhythm:** An 8px base unit (4px for micro-adjustments) governs all padding and margins. 
*   **Responsive Behavior:** 
    *   **Mobile:** 1-column layout with 16px side margins. 
    *   **Tablet:** 2-column layout for cards. 
    *   **Desktop:** 3 or 4-column layout for property search results to allow for sidebar filters.
*   **White Space:** Intentional "dead zones" are used around high-value property imagery to simulate the feeling of a luxury gallery.

## Elevation & Depth

To maintain a "Utility-First" feel, this design system avoids heavy drop shadows. Instead, it uses **Low-Contrast Outlines** and **Tonal Layering**.

*   **Base Surface:** Pure White (#FFFFFF).
*   **Secondary Surface:** Light Slate (#F8FAFC) used for background regions to make white cards "pop" without shadows.
*   **Borders:** Subtle 1px borders (#E2E8F0) define element boundaries.
*   **Interactive Elevation:** Only primary action cards use an **Ambient Shadow** on hover—a very soft, diffused Navy tint (0, 0, 15, 0.05 opacity) to indicate clickability without breaking the minimalist aesthetic.
*   **Glassmorphism:** Use a light backdrop blur (8px) for sticky navigation bars to maintain context of the property images scrolling beneath.

## Shapes

The shape language is defined by **Rounded (Level 2)** geometry. This provides a 0.5rem (8px) radius for standard components like input fields and small cards, and 1rem (16px) for large property detail containers. 

The 8px radius strikes a balance between the "sharp" corporate feel of traditional finance and the "soft" approachability of modern consumer apps. It conveys a sense of modern engineering and precision. "Verified" badges use a **Pill-shape** (full round) to distinguish them as unique status indicators that sit outside the standard grid geometry.

## Components

### Property Cards
The cornerstone of the system. Each card features a high-aspect-ratio image (3:2) with a "Verified" badge floating in the top-left corner. Price points are rendered in Deep Navy bold typography, while utility icons (Solar/Backup) are displayed as subtle line-art icons at the bottom of the card.

### Verified Badges
Constructed with a Safety Gold (#EAB308) background and Deep Navy text. These badges must include a "Checkmark" icon. They are the primary trust signals of the design system.

### Search Filters
Filters are presented in a clean sidebar or horizontal bar. Utility-specific filters (e.g., "Backup Power," "Solar Ready," "Gated Community") use custom-drawn 20px icons. Active filter states use a Deep Navy fill with white text.

### Buttons
*   **Primary:** Deep Navy background, white text, 8px radius. High-weight.
*   **Secondary:** Ghost style with a 1px Navy border.
*   **Featured:** Safety Gold background for "Book Viewing" or "Contact Agent" to drive conversion through high visibility.

### Input Fields
Minimalist styling with 1px light-gray borders. Focus states transition the border to Deep Navy with a soft 2px outer glow in Navy (10% opacity).

### Transparency Indicators
Detailed breakdown components for pricing (taxes, HOA fees, etc.) use a light-gray boxed layout to visually separate financial data from the property description, emphasizing the brand's commitment to honesty.