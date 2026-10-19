---
{
  "name": "OpsRelay",
  "description": "A precise control tower for supplier disruption decisions",
  "colors": {
    "primary": "#315bd6",
    "primary-soft": "#eef2ff",
    "background": "#f6f7f9",
    "surface": "#ffffff",
    "ink": "#202632",
    "muted": "#606a7a",
    "line": "#e4e7ed",
    "success": "#287553",
    "success-bg": "#edf7f0",
    "warning": "#96540a",
    "warning-bg": "#fff5e6",
    "public-paper": "#fbfcfa",
    "public-ink": "#192a3c",
    "public-quiet": "#586574",
    "public-rule": "#dce2e5",
    "public-blue-section": "#233e88"
  },
  "typography": {
    "headline": {
      "fontFamily": "Geist, sans-serif",
      "fontSize": "27px",
      "fontWeight": 650,
      "lineHeight": 1.25,
      "letterSpacing": "-0.025em"
    },
    "title": {
      "fontFamily": "Geist, sans-serif",
      "fontSize": "16px",
      "fontWeight": 650,
      "lineHeight": 1.25
    },
    "body": {
      "fontFamily": "Geist, sans-serif",
      "fontSize": "14px",
      "fontWeight": 400,
      "lineHeight": 1.5
    },
    "label": {
      "fontFamily": "Geist, sans-serif",
      "fontSize": "12px",
      "fontWeight": 550
    },
    "public-display": {
      "fontFamily": "Geist, sans-serif",
      "fontSize": "clamp(58px, 5.7vw, 84px)",
      "fontWeight": 550,
      "lineHeight": 1.03,
      "letterSpacing": "-0.04em"
    },
    "public-display-mobile": {
      "fontFamily": "Geist, sans-serif",
      "fontSize": "clamp(44px, 11.4vw, 64px)",
      "fontWeight": 550,
      "lineHeight": 1.06,
      "letterSpacing": "-0.04em"
    },
    "public-body": {
      "fontFamily": "Geist, sans-serif",
      "fontSize": "15px",
      "fontWeight": 400,
      "lineHeight": 1.6
    },
    "public-section-heading": {
      "fontFamily": "Geist, sans-serif",
      "fontSize": "clamp(30px, 3.1vw, 44px)",
      "fontWeight": 500,
      "lineHeight": 1.17,
      "letterSpacing": "-0.035em"
    }
  },
  "rounded": {
    "control": "6px",
    "panel": "9px",
    "badge": "4px",
    "public-preview": "12px",
    "public-evidence": "7px"
  },
  "spacing": {
    "tight": "8px",
    "group": "12px",
    "panel": "20px",
    "page": "30px",
    "public-gutter": "52px",
    "public-gutter-tablet": "32px",
    "public-gutter-phone": "22px",
    "public-section": "108px"
  },
  "components": {
    "button-primary": {
      "backgroundColor": "{colors.primary}",
      "textColor": "{colors.surface}",
      "rounded": "{rounded.control}",
      "padding": "8px 12px"
    },
    "button-secondary": {
      "backgroundColor": "{colors.surface}",
      "textColor": "{colors.ink}",
      "rounded": "{rounded.control}",
      "padding": "8px 12px"
    },
    "panel": {
      "backgroundColor": "{colors.surface}",
      "rounded": "{rounded.panel}"
    },
    "button-public-primary": {
      "backgroundColor": "{colors.primary}",
      "textColor": "{colors.surface}",
      "rounded": "{rounded.control}",
      "padding": "13px 19px",
      "height": "48px"
    },
    "public-preview": {
      "backgroundColor": "{colors.surface}",
      "textColor": "{colors.public-ink}",
      "rounded": "{rounded.public-preview}"
    },
    "public-brain-section": {
      "backgroundColor": "{colors.public-blue-section}",
      "textColor": "{colors.surface}",
      "padding": "90px 52px"
    }
  }
}
---

# OpsRelay design system

## Overview

**Creative North Star: "Control tower"**

A light control-tower workspace gives priority to connected commitments, current supply facts and the next review decision. Compact type, disciplined rules and a restrained blue action color keep the operational task legible.

The public landing and trust pages extend this world with generous display type, near-white paper, a responsive supply scenario and an expansive blue company-memory section. The operator workspace retains its compact hierarchy and existing tokens. Public examples disclose their synthetic or illustrative status beside the content.

**Key Characteristics:**
- Compact, factual task hierarchy.
- Clear relationship paths and chronological evidence.
- Consistent native controls and visible state feedback.
- Spacious public storytelling paired with compact operational detail.

The user delegated the direction and code-first build. Direction seed `e7e7f013` assigned grounded candidate 4. Considered worlds: delivery manifest, incident control room, engineering BOM drawing, flight-strip control tower, allocation ledger, transit network and factory andon. The control tower was chosen. Catalog verdicts: data-sublime, botanical folio and character catalog declined; retain alignment, lifecycle completeness and roster discipline. Star atlas declined; retain fixed graph coordinates. Transit and graphite console were competitive for relationship/task clarity; the built light world retains branching paths and compact controls. No approved reference comp governed this code-led build.

## Colors

Primary blue is reserved for actions, selection and focus. Cool neutral surfaces hold the data. Green communicates covered commitments; amber communicates shortages. The normative values are in the frontmatter.

Public variants use public-paper, public-ink, public-quiet and public-rule from the frontmatter. Shared primary blue connects public actions to workspace actions; public-blue-section is the broad company-memory background. These variants are scoped to the public surface and do not redefine operator colors.

**The State Text Rule.** Every semantic color is paired with readable text.

## Typography

Geist carries navigation, body and data. Workspace headings use the headline role; section titles use title. The entry headline is an observed large variant: 46px wide, 35px mobile. Compact metadata ranges from 9–12px. Coverage uses tabular numerals.

The public display and public-section-heading roles provide the larger editorial hierarchy; public-body is the site base. The hero display steps to 62px at 1100px, 72px at 900px, then the public-display-mobile role at 600px. Trust headings use a 40–64px clamp and 43px on phones. Graph metadata grows to readable 11–14px roles in the phone reflow.

## Layout

The sidebar is 210px wide, reduces to 185px at 1200px and a 64px rail at 1000px, then becomes horizontal navigation at 600px. The main grid becomes one column below 800px. Its secondary panels remain two columns on tablet, one on phones. The dependency map has a contained 640px minimum-width scroll region with equivalent order buttons below; the page itself must not overflow.

Public routes: `/` renders the landing page; `/trust` shares its header, footer and public styles; `/workspace` renders the relocated operational application and retains its protected operator entry. The workspace page is excluded from indexing.

Public containers cap at 1400px with 1296px inner bands. Desktop gutters use public-gutter, then public-gutter-tablet at 1100px and public-gutter-phone at 600px. The sticky header content is 84px high on desktop, 74px at 900px, and 70px at 600px, plus its bottom border. The hero begins in two columns and stacks at 900px. Sections and the company-memory panel stack at 600px. The supply graph becomes two supply nodes above a full-width order list at 600px; connector strokes become short CSS rules and text remains visible without a horizontally scrolling public graph.

The trust page uses a 930px maximum container, ordered ruled sections and shared responsive gutters. Its factual reading layout follows the same type and color family.

## Elevation & Depth

Hairline borders establish structure. Small offset shadows distinguish graph nodes and active controls; the source drawer receives a broad, soft lateral shadow. No decorative halos or hard block shadows. The public preview uses a diffuse shadow (`0 16px 50px -24px #17314d3d`); public graph nodes use a smaller shadow (`0 4px 10px -6px #24476632`). The company-memory section gains depth from the blue ground, pale content panel and white evidence record. Mobile navigation uses a restrained floating shadow.

## Shapes

Gently curved panels and controls use the frontmatter radius tokens. Status badges use a smaller corner. Avatar and status markers may be circular. Public buttons retain the control corner; the large supply preview and company-memory evidence use their named public radius variants. The public logo and favicon share a blue rounded-square mark with a white triangular relationship path and three circular nodes.

## Components

Primary and secondary buttons share spacing and focus behavior. Inputs keep native date and keyboard behavior. The source viewer uses a native dialog. Success/error messages announce changes. Loading uses a restrained skeleton; reduced-motion disables its animation and smooth scrolling. Control transitions last 160ms.

### Public navigation and actions

The sticky public header links to the product scenario, workflow, company brain and FAQ anchors. Open workspace links to `/workspace`. Desktop anchor navigation hides at 900px; the phone native details menu appears at 600px and closes after a destination is selected. A keyboard skip link precedes the header. Public interactive elements use a 3px blue focus outline with 5px offset; the blue section uses a pale outline.

The public demo action creates a demo session via `/api/session`, shows Opening your workspace… while disabled, then navigates to `/workspace`. A request failure appears as an alert beside the action and allows retry. Its 45-second timeout explains that the free service may be waking up. Secondary text links lead to walkthrough content, source code and trust information.

### Supply and company-memory previews

Original plan, Supplier delay and Recovery are pressed-state buttons. The default is Supplier delay. They use the app’s shared pure allocation function against disclosed synthetic commitments; this is a local illustrative interaction, not a live database query. Selecting an order shows coverage, product and response owner. The impact strip announces changes with a status role. Original plan and Recovery share the restored arrival date; Recovery receives an explicit confirmation label.

The blue company-memory section offers three pressed-state capability choices. The selected evidence, lesson or reviewed-response panel updates through a polite live region and is labelled Illustrative product preview · synthetic records. FAQ rows use native details/summary with plus/minus state. Public transitions last 180–200ms; reduced-motion disables animations, transitions and smooth scrolling.

### Recorded walkthrough and provenance

The walkthrough uses a 16:9 native video with controls, inline playback, no preload, English captions, a YouTube fallback and an explicit recorded-core-workflow label. `public/media/walkthrough.jpg` is the existing `demo/opsrelay-walkthrough.jpg` artwork reused without visual edits; its embedded JPEG COM origin identifies the source and the 16 October 2026 recording. It shows fictional company data. Keep provenance and the linked media credits with this asset; the recording is a separate evidence surface from the interactive preview.

**The Public Evidence Rule.** Label synthetic and illustrative previews beside their content and retain provenance for recorded interface media.

**The Decision Trail Rule.** A supply update changes current coverage while preserving dated source records and reviewed decisions.

## Do's and Don'ts

- Use actual graph results for relationships and statuses.
- Use visible text alongside semantic state colors.
- Keep mobile navigation and equivalent order controls accessible.
- Keep public color, type and spacing variants scoped to landing and trust surfaces.
- Label synthetic and illustrative content and retain walkthrough provenance.
- Do not add decorative eyebrows above headings.
- Do not use color alone to communicate risk.
- Do not hide core actions behind operator credentials when showing the synthetic demo.
