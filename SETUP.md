# ProCut CNC Laser — Shopify Theme Setup

This repository contains the **ProCut CNC Laser** Online Store 2.0 theme, converted from the static HTML prototype in `design-reference/`.

## Connect to Shopify

1. Push this repo to GitHub (already done if you cloned from remote).
2. In **Shopify Admin → Online Store → Themes**, click **Add theme → Connect from GitHub**.
3. Authorize GitHub and select this repository and branch (`main`).
4. Click **Connect** — Shopify will import the theme as a draft.
5. Click **Customize** to edit sections, then **Publish** when ready.

### Local development (optional)

```bash
shopify theme dev --store YOUR-STORE.myshopify.com
```

Requires [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) and store staff access.

---

## Theme Settings to Configure

Go to **Customize → Theme settings** and fill in:

| Setting | Action |
|---|---|
| Logo image | Upload workshop logo, or leave empty for PRO CUT mark |
| Phone, email, address, hours | Verify real contact details |
| WhatsApp number | International format without `+` (default: `923215568112`) |
| Social links | Facebook, Instagram URLs |
| Delivery estimate | Display-only cart estimate (default: PKR 1,500) |
| Machine specs | Hero sidebar text |

---

## Products to Create (8 items)

Create these products in **Admin → Products** with matching handles so collections and related products work:

| Handle | Title | SKU | Tags | Variants |
|---|---|---|---|---|
| `ayat-al-kursi-wall-clock` | Ayat al-Kursi Wall Clock | PC-CLK-01 | `bestseller`, `calligraphy` | Size: 18"/24"/30" × Finish: Matte Black, Raw Steel, Golden PVD |
| `jaali-partition-panel` | Jaali Partition Panel | PC-PRT-02 | `partition` | Size: 3ft×6ft, etc. |
| `custom-steel-gate` | Custom Steel Gate | PC-GTE-03 | `made-to-order`, `gate` | Single variant or quote |
| `staircase-railing-panel` | Staircase Railing Panel | PC-RAL-04 | `railing` | Per-ft variants |
| `front-elevation-screen` | Front Elevation Screen | PC-ELV-05 | `elevation` | Per sq.ft variants |
| `bulk-mechanical-cutting` | Bulk Mechanical Cutting | PC-MEC-06 | `b2b` | Per-kg / quote |
| `bismillah-wall-panel` | Bismillah Wall Panel | PC-CAL-07 | `calligraphy` | Standard panel |
| `custom-ayat-name-panel` | Custom Ayat / Name Panel | PC-CAL-08 | `made-to-order`, `calligraphy` | Quote variant |

**Also set per product:**
- Featured image (replaces SVG fallback)
- Description from prototype copy
- Metafield `custom.unit_text` (e.g. `/ piece`, `/ panel`) for price suffix
- Metafield `custom.cut_file` (e.g. `CUT FILE V3`) for PDP code line
- Metafield `custom.spec_sheet` (JSON list of `{key, value}` objects) for spec table — see below

### Spec sheet metafield

1. **Settings → Custom data → Products → Add definition**
2. Namespace/key: `custom.spec_sheet`
3. Type: **JSON**
4. Example value for wall clock:

```json
[
  {"key": "Material", "value": "2MM Mild Steel"},
  {"key": "Diameter", "value": "24 IN (609MM)"},
  {"key": "Cut Tolerance", "value": "± 0.10MM"},
  {"key": "Movement", "value": "Silent Sweep Quartz"},
  {"key": "Mounting", "value": "Rear Keyhole Bracket"},
  {"key": "Lead Time", "value": "3–5 Working Days"}
]
```

Until metafields are set, the product template uses editable spec blocks in the theme editor.

---

## Collections

1. Create collection **Catalog** (handle: `catalog` or use **All products**)
2. Add all 8 products
3. In **Featured collection** sections (homepage, service detail, related products), select this collection

---

## Pages to Create

| Page title | Handle | Template |
|---|---|---|
| Services | `services` | `page.services` |
| Contact | `contact` | `page.contact` |
| Islamic Calligraphy | `islamic-calligraphy` | `page.service-detail` |

Duplicate the service-detail page for other services (Gates, Railing, etc.) and update section content in the theme editor.

---

## Navigation Menu

Create menu **Main menu** (handle: `main-menu`) with:

- Home → `/`
- Shop → `/collections/all`
- Services → `/pages/services`
- Process → `/#process`
- Contact → `/pages/contact`

Assign in **Customize → Header**.

---

## Search & Discovery Filters

The shop sidebar uses Shopify native `collection.filters`. Configure in **Admin → Search & Discovery → Filters**:

- **Product tag** filters for categories (e.g. `calligraphy`, `partition`, `gate`)
- **Variant option** filters for Material if needed

Static prototype checkboxes were cosmetic; filters only work after configuration here.

---

## Placeholder Content to Replace Before Launch

- [ ] Product photos (all 8 products)
- [ ] Service gallery images (4 blocks on service-detail)
- [ ] Service detail hero image
- [ ] Map image or directions URL on contact page
- [ ] Stats numbers (if real figures differ from prototype)
- [ ] Social media URLs
- [ ] Facebook link in footer/contact
- [ ] Shipping rates in **Settings → Shipping** (cart delivery line is display-only)

---

## Prototype vs Theme Adaptations

| Prototype | Theme |
|---|---|
| Static filter checkboxes | Shopify Search & Discovery filters |
| Cart promo apply | Discount codes applied at Shopify checkout |
| Flat PKR 1,500 delivery in cart | Display estimate; configure real rates in Shipping |
| All services → one detail page | One `page.service-detail` template; multiple Page instances |
| SVG product placeholders | Shown only when product has no featured image |
| Fake form submit on contact | Real `{% form 'contact' %}` to Shopify |

---

## Repository Structure

```
layout/theme.liquid       Global shell
sections/                 Editable sections (hero, cart, PDP, etc.)
snippets/                 Logo, product-card, price, fallback SVGs
templates/*.json          Page templates (index, product, collection, cart, pages)
assets/theme.css          Full ProCut design system
assets/theme.js           Cart AJAX, variant picker, mobile nav, marquee
design-reference/         Original static HTML/CSS prototype (not served)
```

## Support

Workshop: Shop # W/572, Ratta Road, Rawalpindi — 0321-5568112 — hassan4515@yahoo.com
