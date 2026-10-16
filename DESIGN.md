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
    "warning-bg": "#fff5e6"
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
    }
  },
  "rounded": {
    "control": "6px",
    "panel": "9px",
    "badge": "4px"
  },
  "spacing": {
    "tight": "8px",
    "group": "12px",
    "panel": "20px",
    "page": "30px"
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
    }
  }
}
---

# OpsRelay design system

## Overview

**Creative North Star: "Control tower"**

A light control-tower workspace gives priority to connected commitments, current supply facts and the next review decision. Compact type, disciplined rules and a restrained blue action color keep the operational task legible.

**Key Characteristics:**
- Compact, factual task hierarchy.
- Clear relationship paths and chronological evidence.
- Consistent native controls and visible state feedback.

The user delegated the direction and code-first build. Direction seed `e7e7f013` assigned grounded candidate 4. Considered worlds: delivery manifest, incident control room, engineering BOM drawing, flight-strip control tower, allocation ledger, transit network and factory andon. The control tower was chosen. Catalog verdicts: data-sublime, botanical folio and character catalog declined; retain alignment, lifecycle completeness and roster discipline. Star atlas declined; retain fixed graph coordinates. Transit and graphite console were competitive for relationship/task clarity; the built light world retains branching paths and compact controls. No approved reference comp governed this code-led build.

## Colors

Primary blue is reserved for actions, selection and focus. Cool neutral surfaces hold the data. Green communicates covered commitments; amber communicates shortages. The normative values are in the frontmatter.

**The State Text Rule.** Every semantic color is paired with readable text.

## Typography

Geist carries navigation, body and data. Workspace headings use the headline role; section titles use title. The entry headline is an observed large variant: 46px wide, 35px mobile. Compact metadata ranges from 9–12px. Coverage uses tabular numerals.

## Layout

The sidebar is 210px wide, reduces to 185px at 1200px and a 64px rail at 1000px, then becomes horizontal navigation at 600px. The main grid becomes one column below 800px. Its secondary panels remain two columns on tablet, one on phones. The dependency map has a contained 640px minimum-width scroll region with equivalent order buttons below; the page itself must not overflow.

## Elevation & Depth

Hairline borders establish structure. Small offset shadows distinguish graph nodes and active controls; the source drawer receives a broad, soft lateral shadow. No decorative halos or hard block shadows.

## Shapes

Gently curved panels and controls use the frontmatter radius tokens. Status badges use a smaller corner. Avatar and status markers may be circular.

## Components

Primary and secondary buttons share spacing and focus behavior. Inputs keep native date and keyboard behavior. The source viewer uses a native dialog. Success/error messages announce changes. Loading uses a restrained skeleton; reduced-motion disables its animation and smooth scrolling. Control transitions last 160ms.

**The Decision Trail Rule.** A supply update changes current coverage while preserving dated source records and reviewed decisions.

## Do's and Don'ts

- Use actual graph results for relationships and statuses.
- Use visible text alongside semantic state colors.
- Keep mobile navigation and equivalent order controls accessible.
- Do not add decorative eyebrows above headings.
- Do not use color alone to communicate risk.
- Do not hide core actions behind operator credentials when showing the synthetic demo.
