from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    Frame,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs"
PDF_PATH = OUT_DIR / "Zenvy_Dine_Complete_Production_Deployment_Guide.pdf"
ICON_PATH = ROOT / "public" / "icons" / "icon-192x192.png"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_X = 0.62 * inch
MARGIN_TOP = 0.68 * inch
MARGIN_BOTTOM = 0.62 * inch

NAVY = colors.HexColor("#101828")
GREEN = colors.HexColor("#16A34A")
ORANGE = colors.HexColor("#F97316")
BLUE = colors.HexColor("#2563EB")
MUTED = colors.HexColor("#667085")
LIGHT = colors.HexColor("#F8FAFC")
BORDER = colors.HexColor("#D0D5DD")
PALE_GREEN = colors.HexColor("#ECFDF3")
PALE_ORANGE = colors.HexColor("#FFF7ED")
PALE_BLUE = colors.HexColor("#EFF6FF")


def register_fonts() -> tuple[str, str, str]:
    font_dir = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    candidates = {
        "regular": [font_dir / "segoeui.ttf", font_dir / "arial.ttf"],
        "bold": [font_dir / "segoeuib.ttf", font_dir / "arialbd.ttf"],
        "mono": [font_dir / "consola.ttf", font_dir / "cour.ttf"],
    }

    names = {}
    for key, files in candidates.items():
        for file in files:
            if file.exists():
                font_name = f"Zenvy-{key}"
                pdfmetrics.registerFont(TTFont(font_name, str(file)))
                names[key] = font_name
                break

    return (
        names.get("regular", "Helvetica"),
        names.get("bold", "Helvetica-Bold"),
        names.get("mono", "Courier"),
    )


FONT, FONT_BOLD, FONT_MONO = register_fonts()


class ZenvyDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            if style_name == "ZHeading1":
                text = flowable.getPlainText()
                self.notify("TOCEntry", (0, text, self.page))
            elif style_name == "ZHeading2":
                text = flowable.getPlainText()
                self.notify("TOCEntry", (1, text, self.page))


class ScreenshotBox(Flowable):
    def __init__(self, label: str, width: float = 6.3 * inch, height: float = 1.35 * inch):
        super().__init__()
        self.label = label
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        c.saveState()
        c.setStrokeColor(BORDER)
        c.setFillColor(colors.HexColor("#FCFCFD"))
        c.roundRect(0, 0, self.width, self.height, 8, fill=1, stroke=1)
        c.setStrokeColor(colors.HexColor("#E4E7EC"))
        c.line(0.25 * inch, self.height - 0.35 * inch, self.width - 0.25 * inch, 0.25 * inch)
        c.line(self.width - 0.25 * inch, self.height - 0.35 * inch, 0.25 * inch, 0.25 * inch)
        c.setFillColor(MUTED)
        c.setFont(FONT_BOLD, 9)
        c.drawCentredString(self.width / 2, self.height / 2 - 4, f"Screenshot placeholder: {self.label}")
        c.restoreState()


class ArchitectureDiagram(Flowable):
    def __init__(self, width: float = 6.3 * inch, height: float = 2.35 * inch):
        super().__init__()
        self.width = width
        self.height = height

    def _box(self, x, y, w, h, title, subtitle, fill):
        c = self.canv
        c.setFillColor(fill)
        c.setStrokeColor(BORDER)
        c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
        c.setFillColor(NAVY)
        c.setFont(FONT_BOLD, 8.6)
        c.drawString(x + 8, y + h - 16, title)
        c.setFillColor(MUTED)
        c.setFont(FONT, 7.2)
        for idx, line in enumerate(subtitle):
            c.drawString(x + 8, y + h - 28 - idx * 10, line)

    def _arrow(self, x1, y1, x2, y2):
        c = self.canv
        c.setStrokeColor(GREEN)
        c.setLineWidth(1.2)
        c.line(x1, y1, x2, y2)
        c.setFillColor(GREEN)
        c.circle(x2, y2, 2.4, fill=1, stroke=0)

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(colors.white)
        c.setStrokeColor(BORDER)
        c.roundRect(0, 0, self.width, self.height, 10, fill=1, stroke=1)
        y_top = self.height - 0.82 * inch
        bw, bh = 1.35 * inch, 0.62 * inch
        self._box(0.22 * inch, y_top, bw, bh, "Customer PWA", ["QR menu", "Cart + payment"], PALE_GREEN)
        self._box(1.95 * inch, y_top, bw, bh, "Next.js / Vercel", ["App Router", "Server pages"], PALE_BLUE)
        self._box(3.68 * inch, y_top, bw, bh, "Firebase", ["Firestore", "Auth + Storage"], colors.HexColor("#FFFBEB"))
        self._box(5.05 * inch, y_top, 1.05 * inch, bh, "Razorpay", ["Checkout", "Webhooks"], PALE_ORANGE)
        self._box(0.95 * inch, 0.28 * inch, 1.35 * inch, bh, "Admin App", ["RBAC", "KDS + orders"], colors.HexColor("#F2F4F7"))
        self._box(2.95 * inch, 0.28 * inch, 1.55 * inch, bh, "Cloud Functions", ["Order verify", "Webhook handler"], colors.HexColor("#F2F4F7"))
        self._box(4.95 * inch, 0.28 * inch, 1.15 * inch, bh, "Operations", ["Logs", "Monitoring"], colors.HexColor("#F2F4F7"))
        self._arrow(1.57 * inch, y_top + bh / 2, 1.95 * inch, y_top + bh / 2)
        self._arrow(3.30 * inch, y_top + bh / 2, 3.68 * inch, y_top + bh / 2)
        self._arrow(5.03 * inch, y_top + bh / 2, 5.05 * inch, y_top + bh / 2)
        self._arrow(1.62 * inch, 0.90 * inch, 2.35 * inch, 1.48 * inch)
        self._arrow(4.25 * inch, 0.90 * inch, 4.30 * inch, 1.48 * inch)
        self._arrow(4.50 * inch, 0.60 * inch, 4.95 * inch, 0.60 * inch)
        c.restoreState()


class DeploymentFlow(Flowable):
    def __init__(self, width: float = 6.3 * inch, height: float = 1.35 * inch):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        labels = ["Code", "CI", "Vercel", "Firebase", "Smoke Test", "Launch"]
        c = self.canv
        c.saveState()
        step_w = self.width / len(labels)
        for i, label in enumerate(labels):
            x = i * step_w + 4
            c.setFillColor(PALE_GREEN if i in [0, 5] else PALE_BLUE)
            c.setStrokeColor(BORDER)
            c.roundRect(x, 0.38 * inch, step_w - 8, 0.46 * inch, 7, fill=1, stroke=1)
            c.setFillColor(NAVY)
            c.setFont(FONT_BOLD, 8)
            c.drawCentredString(x + (step_w - 8) / 2, 0.56 * inch, label)
            if i < len(labels) - 1:
                c.setStrokeColor(GREEN)
                c.line(x + step_w - 8, 0.61 * inch, x + step_w - 1, 0.61 * inch)
                c.setFillColor(GREEN)
                c.circle(x + step_w - 1, 0.61 * inch, 2, fill=1, stroke=0)
        c.restoreState()


def header_footer(canvas, doc):
    canvas.saveState()
    page_num = canvas.getPageNumber()
    if page_num == 1:
        canvas.restoreState()
        return
    canvas.setStrokeColor(BORDER)
    canvas.line(MARGIN_X, PAGE_HEIGHT - 0.48 * inch, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 0.48 * inch)
    canvas.setFillColor(NAVY)
    canvas.setFont(FONT_BOLD, 8)
    canvas.drawString(MARGIN_X, PAGE_HEIGHT - 0.34 * inch, "Zenvy Dine Production Deployment Guide")
    canvas.setFillColor(MUTED)
    canvas.setFont(FONT, 8)
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, 0.34 * inch, f"Page {page_num}")
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle",
    parent=styles["Title"],
    fontName=FONT_BOLD,
    fontSize=28,
    leading=34,
    textColor=colors.white,
    alignment=TA_LEFT,
    spaceAfter=18,
))
styles.add(ParagraphStyle(
    name="CoverSubtitle",
    parent=styles["BodyText"],
    fontName=FONT,
    fontSize=12.5,
    leading=18,
    textColor=colors.HexColor("#D0D5DD"),
    spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="ZHeading1",
    parent=styles["Heading1"],
    fontName=FONT_BOLD,
    fontSize=18,
    leading=22,
    textColor=NAVY,
    spaceBefore=18,
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="ZHeading2",
    parent=styles["Heading2"],
    fontName=FONT_BOLD,
    fontSize=12.8,
    leading=16,
    textColor=GREEN,
    spaceBefore=10,
    spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="Body",
    parent=styles["BodyText"],
    fontName=FONT,
    fontSize=9.3,
    leading=13.2,
    textColor=colors.HexColor("#344054"),
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="Small",
    parent=styles["BodyText"],
    fontName=FONT,
    fontSize=8,
    leading=10.5,
    textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="ZCode",
    parent=styles["Code"],
    fontName=FONT_MONO,
    fontSize=7.5,
    leading=10,
    textColor=colors.HexColor("#111827"),
    backColor=colors.HexColor("#F2F4F7"),
    borderColor=colors.HexColor("#E4E7EC"),
    borderWidth=0.4,
    borderPadding=6,
    spaceBefore=4,
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="Callout",
    parent=styles["Body"],
    fontName=FONT,
    fontSize=8.8,
    leading=12.3,
    textColor=colors.HexColor("#1D2939"),
    backColor=colors.HexColor("#ECFDF3"),
    borderColor=colors.HexColor("#ABEFC6"),
    borderWidth=0.6,
    borderPadding=7,
    spaceBefore=4,
    spaceAfter=8,
))


def p(text: str, style: str = "Body") -> Paragraph:
    return Paragraph(text, styles[style])


def h1(text: str) -> Paragraph:
    return p(text, "ZHeading1")


def h2(text: str) -> Paragraph:
    return p(text, "ZHeading2")


def code(text: str) -> Paragraph:
    escaped = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
        .replace(" ", "&nbsp;")
    )
    return p(escaped, "ZCode")


def bullet(items: Iterable[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(p(item, "Body"), leftIndent=12) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=16,
    )


def checklist(items: Iterable[str]) -> Table:
    rows = [[p("Check", "Small"), p("Launch item", "Small")]]
    for item in items:
        rows.append([p("[ ]", "Body"), p(item, "Body")])
    table = Table(rows, colWidths=[0.55 * inch, 5.55 * inch], hAlign="LEFT")
    table.setStyle(table_style(header=True))
    return table


def table_style(header: bool = True) -> TableStyle:
    style = [
        ("GRID", (0, 0), (-1, -1), 0.35, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
    ]
    if header:
        style.extend([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
        ])
    return TableStyle(style)


def make_table(rows: list[list[str]], widths: list[float]) -> Table:
    rendered = [[p(cell, "Small" if r == 0 else "Body") for cell in row] for r, row in enumerate(rows)]
    table = Table(rendered, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(table_style(header=True))
    return table


def cover() -> list:
    story = []
    story.append(NextPageTemplate("Body"))
    story.append(Spacer(1, 0.55 * inch))
    if ICON_PATH.exists():
        story.append(Image(str(ICON_PATH), width=0.78 * inch, height=0.78 * inch))
        story.append(Spacer(1, 0.20 * inch))
    story.append(p("Zenvy Dine — Complete Production Deployment & Infrastructure Guide", "CoverTitle"))
    story.append(p("A beginner-friendly, production-grade deployment handbook for operating the Zenvy Dine multi-tenant restaurant QR ordering SaaS on Vercel, Firebase, and Razorpay.", "CoverSubtitle"))
    meta = make_table(
        [
            ["Version", "Audience", "Environment"],
            ["1.0", "Founders, developers, DevOps, restaurant onboarding teams", "Production and staging"],
        ],
        [1.0 * inch, 3.0 * inch, 1.9 * inch],
    )
    meta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#182230")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#344054")),
        ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
        ("FONTNAME", (0, 1), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(Spacer(1, 0.35 * inch))
    story.append(meta)
    story.append(Spacer(1, 0.55 * inch))
    story.append(p("Includes architecture diagrams, setup steps, security rules guidance, CI/CD, monitoring, troubleshooting, launch checklists, and a scaling roadmap.", "CoverSubtitle"))
    story.append(PageBreak())
    return story


def section_intro() -> list:
    return [
        h1("1. Introduction"),
        p("Zenvy Dine is a multi-tenant restaurant QR ordering SaaS platform. Each restaurant gets its own branded customer ordering URL, admin dashboard, table QR codes, kitchen workflow, payment configuration, and operational settings while sharing one application codebase."),
        ArchitectureDiagram(),
        h2("Core architecture"),
        make_table(
            [
                ["Layer", "Primary service", "Responsibility"],
                ["Frontend", "Next.js on Vercel", "Customer menu, admin dashboard, server-rendered pages, PWA shell"],
                ["Data", "Firebase Firestore", "Restaurants, categories, menu items, tables, orders, waiter calls, staff users"],
                ["Identity", "Firebase Authentication", "Admin sign-in and staff identity"],
                ["Backend", "Firebase Cloud Functions", "Razorpay order creation, payment verification, webhooks, privileged server logic"],
                ["Payments", "Razorpay", "Online checkout, captured payment webhooks, test/live keys"],
            ],
            [1.0 * inch, 1.45 * inch, 3.65 * inch],
        ),
        h2("Multi-tenant model"),
        p("Tenant isolation is achieved with a `restaurantId` field on tenant-owned documents. Admin users also carry a `restaurantId` and role. Firestore rules validate that staff can only read or mutate records for their own restaurant."),
        p("Use one Firebase project per environment, such as `zenvy-dine-staging` and `zenvy-dine-production`. Avoid mixing staging and production tenants in the same project because billing, payment keys, and security testing become harder to reason about."),
    ]


def section_local() -> list:
    return [
        h1("2. Local Development Setup"),
        h2("Prerequisites"),
        bullet([
            "Node.js 20 or newer, matching the production runtime.",
            "Git for source control.",
            "Firebase CLI for rules, indexes, functions, and emulator workflows.",
            "A Firebase project and Razorpay test account for end-to-end testing.",
        ]),
        code("node --version\nnpm --version\ngit --version\nnpm install -g firebase-tools\nfirebase login"),
        h2("Install and run"),
        code("git clone <your-repository-url>\ncd \"Zenvy Dine\"\nnpm install\ncp .env.example .env.local\nnpm run validate:env\nnpm run dev"),
        p("The local app typically runs at `http://localhost:3000`. If that port is already in use, Next.js may choose another port. Keep the terminal open while testing customer and admin flows."),
        ScreenshotBox("Local development server running in terminal"),
    ]


def section_firebase() -> list:
    return [
        h1("3. Firebase Project Setup"),
        p("Create separate Firebase projects for staging and production. Enable only the services required by the app and deploy rules before adding real restaurant data."),
        h2("Step-by-step setup"),
        bullet([
            "Open the Firebase Console and create a project named `Zenvy Dine Production`.",
            "Create a Web App inside the project and copy the client config values.",
            "Enable Firestore Database in production mode.",
            "Enable Firebase Authentication and turn on Email/Password and any required OAuth providers.",
            "Enable Cloud Storage if menu image uploads will be managed through Firebase.",
            "Enable Cloud Functions and select a region close to your expected restaurant users.",
            "Generate a service account private key from Project Settings > Service Accounts.",
        ]),
        h2("Firebase config values"),
        p("Client Firebase config values are safe to expose as `NEXT_PUBLIC_*` variables, but service account values are private and must only be stored in secure environment variable stores such as Vercel Environment Variables or Firebase Functions secrets/config."),
        ScreenshotBox("Firebase project settings and web app config"),
    ]


def section_firestore() -> list:
    return [
        h1("4. Firestore Database Setup"),
        h2("Collection structure"),
        make_table(
            [
                ["Collection", "Tenant field", "Purpose"],
                ["restaurants", "document id / slug", "Restaurant profile, branding, GST, service charge, payment settings"],
                ["users", "restaurantId", "Admin users, role, tenant membership"],
                ["menuCategories", "restaurantId", "Ordered menu category list"],
                ["menuItems", "restaurantId", "Menu item catalogue, availability, images, add-ons"],
                ["tables", "restaurantId", "Table numbers, capacities, QR URLs"],
                ["orders", "restaurantId", "Customer orders, totals, status, payment data"],
                ["waiterCalls", "restaurantId", "Customer service requests from table screens"],
                ["payments", "restaurantId", "Payment intent/audit records written by Cloud Functions"],
            ],
            [1.25 * inch, 1.05 * inch, 3.8 * inch],
        ),
        h2("Indexes"),
        code("firebase deploy --only firestore:indexes"),
        p("Required query shapes include orders by restaurant and `createdAt`, KDS orders by restaurant/status/createdAt, categories by restaurant/isActive/order, and waiter calls by restaurant/status/createdAt."),
        h2("Security and RBAC"),
        p("Roles should be explicit and minimal: `RESTAURANT_OWNER`, `MANAGER`, `CASHIER`, `KITCHEN_STAFF`, and `SUPER_ADMIN`. Public customer access should only allow creating validated orders and waiter calls, never reading all orders."),
        p("Tenant isolation test: sign in as restaurant A staff and attempt to query restaurant B orders from the browser console. The request must fail with a Firestore permissions error."),
    ]


def section_env() -> list:
    rows = [
        ["Variable", "Where to obtain", "Security notes"],
        ["NEXT_PUBLIC_FIREBASE_API_KEY", "Firebase Web App config", "Public client value, not a secret"],
        ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "Firebase Web App config", "Public client value"],
        ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "Firebase Web App config", "Must match target Firebase project"],
        ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "Firebase Web App config", "Public bucket id; storage rules still protect data"],
        ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "Firebase Web App config", "Public client value"],
        ["NEXT_PUBLIC_FIREBASE_APP_ID", "Firebase Web App config", "Public client value"],
        ["FIREBASE_CLIENT_EMAIL / FIREBASE_ADMIN_CLIENT_EMAIL", "Service account JSON", "Private; never commit to Git"],
        ["FIREBASE_PRIVATE_KEY / FIREBASE_ADMIN_PRIVATE_KEY", "Service account JSON", "Private; preserve newline escaping"],
        ["RAZORPAY_KEY_ID", "Razorpay Dashboard API Keys", "Server-side key id; use live value only in production"],
        ["NEXT_PUBLIC_RAZORPAY_KEY_ID", "Razorpay Dashboard API Keys", "Public checkout key id"],
        ["RAZORPAY_KEY_SECRET", "Razorpay Dashboard API Keys", "Private; rotate if exposed"],
        ["RAZORPAY_WEBHOOK_SECRET", "Razorpay webhook settings", "Private shared secret for webhook verification"],
    ]
    return [
        h1("5. Environment Variables"),
        p("Environment variables are the boundary between code and infrastructure. Use `.env.local` only for local development. Use Vercel project settings and Firebase Functions configuration/secrets for production."),
        make_table(rows, [1.75 * inch, 1.8 * inch, 2.55 * inch]),
        p("Codebase note: this repository currently uses `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`. If your deployment platform standardizes on `FIREBASE_ADMIN_CLIENT_EMAIL` and `FIREBASE_ADMIN_PRIVATE_KEY`, map them consistently or update the app configuration layer before launch.", "Callout"),
        code("npm run validate:env"),
    ]


def section_razorpay() -> list:
    return [
        h1("6. Razorpay Setup"),
        bullet([
            "Create a Razorpay account and complete business/KYC verification.",
            "Use Test Mode for staging and Live Mode for production.",
            "Generate API keys from Razorpay Dashboard > Account & Settings > API Keys.",
            "Add `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` to the correct environment.",
            "Create a webhook endpoint for the deployed Firebase Function URL.",
        ]),
        h2("Webhook configuration"),
        code("Webhook URL:\nhttps://<region>-<firebase-project-id>.cloudfunctions.net/razorpayWebhook\n\nRecommended event:\npayment.captured"),
        p("The webhook secret configured in Razorpay must match `RAZORPAY_WEBHOOK_SECRET` in the function environment. Signature verification is mandatory; never trust payment status sent directly from the browser."),
        h2("Payment verification flow"),
        DeploymentFlow(),
        p("Customer checkout creates a pending order, requests a Razorpay order from Cloud Functions, opens Razorpay Checkout, then verifies the signature server-side before marking payment as paid."),
    ]


def section_functions() -> list:
    return [
        h1("7. Firebase Functions Deployment"),
        p("Cloud Functions own privileged payment operations. They use Firebase Admin SDK and Razorpay server credentials that must never be exposed to the browser."),
        code("cd functions\nnpm install\nnpm run build\nfirebase deploy --only functions"),
        h2("Verify functions"),
        bullet([
            "Confirm `createRazorpayOrder` exists in Firebase Console > Functions.",
            "Confirm `verifyRazorpayPayment` exists and is callable.",
            "Confirm `razorpayWebhook` has an HTTPS URL.",
            "Trigger a test payment and inspect function logs.",
        ]),
        code("firebase functions:log --only createRazorpayOrder\nfirebase functions:log --only razorpayWebhook"),
        ScreenshotBox("Firebase Functions dashboard with deployed functions"),
    ]


def section_vercel() -> list:
    return [
        h1("8. Vercel Deployment"),
        bullet([
            "Push the repository to GitHub.",
            "Open Vercel and import the GitHub repository.",
            "Framework preset should be Next.js.",
            "Install command: `npm install` or `npm ci`.",
            "Build command: `npm run build`.",
            "Output settings: keep Vercel defaults for Next.js.",
            "Add all production environment variables.",
            "Deploy and inspect the build logs.",
        ]),
        h2("Preview deployments"),
        p("Every pull request should produce a preview deployment. Use previews for UI review, smoke testing, and stakeholder approval. Do not point Razorpay live webhooks at preview URLs."),
        code("npm run lint\nnpm run build"),
        ScreenshotBox("Vercel project settings with environment variables"),
    ]


def section_domain_ssl() -> list:
    return [
        h1("9. Domain & SSL Setup"),
        p("Use a clear production URL strategy. Example: `app.zenvydine.com` for the SaaS app, `demo.zenvydine.com` for client presentations, and optional custom domains for premium restaurants later."),
        h2("DNS setup"),
        make_table(
            [
                ["Record", "Host", "Value", "Purpose"],
                ["A", "@", "Vercel-provided IP", "Root domain"],
                ["CNAME", "app", "cname.vercel-dns.com", "Application subdomain"],
                ["CNAME", "www", "cname.vercel-dns.com", "WWW redirect"],
            ],
            [0.7 * inch, 0.8 * inch, 2.1 * inch, 2.5 * inch],
        ),
        p("Vercel automatically provisions SSL certificates after DNS verifies. Wait for HTTPS status to become valid before sharing production URLs."),
    ]


def section_pwa() -> list:
    return [
        h1("10. PWA Setup"),
        p("Zenvy Dine includes a manifest, service worker, app icons, and installable app metadata. The goal is not to make Firestore fully offline-first for restaurants, but to provide a resilient app shell and installable customer/admin experience."),
        make_table(
            [
                ["Asset", "Path", "Purpose"],
                ["Manifest", "/manifest.json", "Name, theme color, display mode, icon list"],
                ["Service worker", "/sw.js", "Caches app shell and static assets"],
                ["192 icon", "/icons/icon-192x192.png", "Android/Chrome install icon"],
                ["512 icon", "/icons/icon-512x512.png", "High-resolution install icon"],
                ["Favicon", "/favicon.ico", "Browser tab identity"],
            ],
            [1.1 * inch, 1.85 * inch, 3.15 * inch],
        ),
        code("curl https://<domain>/manifest.json\ncurl https://<domain>/icons/icon-512x512.png"),
    ]


def section_security() -> list:
    return [
        h1("11. Production Security"),
        h2("Security principles"),
        bullet([
            "Never trust client-computed totals without server-side validation for high-risk payment paths.",
            "Never expose service account JSON or Razorpay secret in public variables.",
            "Keep tenant checks in Firestore rules and server-side admin operations.",
            "Validate webhook signatures before updating payment state.",
            "Use staging projects for destructive testing.",
        ]),
        h2("Operational controls"),
        make_table(
            [
                ["Risk", "Control"],
                ["Cross-tenant data leakage", "All tenant documents include `restaurantId`; rules compare with user claim/document"],
                ["Public order spam", "Validate order shape; add App Check/rate limiting for production"],
                ["Payment spoofing", "Use Razorpay signature verification and webhook secret"],
                ["Secret leakage", "Use Vercel encrypted env vars; rotate keys after exposure"],
                ["Over-privileged staff", "Use role-specific access and periodic staff audits"],
            ],
            [1.7 * inch, 4.4 * inch],
        ),
    ]


def section_monitoring() -> list:
    return [
        h1("12. Monitoring & Logging"),
        bullet([
            "Use Vercel build/runtime logs for frontend deployment and server-rendering issues.",
            "Use Firebase Functions logs for payment creation, verification, and webhook errors.",
            "Use Firestore usage dashboards to monitor reads, writes, deletes, and index growth.",
            "Add uptime monitoring for the production root URL and a demo restaurant menu URL.",
            "Add error tracking before onboarding paying restaurants.",
        ]),
        code("firebase functions:log\nfirebase firestore:indexes\nvercel logs <deployment-url>"),
        ScreenshotBox("Monitoring dashboard: uptime, error rate, function failures"),
    ]


def section_cicd() -> list:
    return [
        h1("13. CI/CD Pipeline"),
        p("CI/CD prevents broken builds from reaching production. The repository includes a GitHub Actions workflow that installs dependencies, runs ESLint, and runs a production build."),
        code("name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: npm\n      - run: npm ci\n      - run: npm run lint\n      - run: npm run build"),
        h2("Rollback strategy"),
        bullet([
            "Use Vercel's previous deployment promotion for frontend rollback.",
            "Keep Firebase rules and indexes versioned in Git.",
            "Deploy Cloud Functions from tagged releases.",
            "Record every production environment variable change in a release note.",
        ]),
    ]


def section_performance() -> list:
    return [
        h1("14. Performance Optimization"),
        h2("Optimization checklist"),
        checklist([
            "Use `next/image` for menu item and logo images.",
            "Use appropriately sized remote images and configured image domains.",
            "Avoid unbounded Firestore collection reads; always filter by `restaurantId`.",
            "Keep realtime listeners limited to active operational screens.",
            "Use Firestore indexes for combined filters and sorting.",
            "Lazy-load non-critical client UI where possible.",
            "Run Lighthouse against production URLs after every major UI change.",
        ]),
        h2("Firestore query efficiency"),
        p("Realtime listeners can become expensive when restaurants scale. KDS and order screens should query only the current restaurant and relevant statuses. Archive or paginate old completed orders."),
        code("npm run build\nnpx lighthouse https://<production-url> --only-categories=performance,accessibility,seo,best-practices"),
    ]


def section_scaling() -> list:
    return [
        h1("15. Scaling Strategy"),
        make_table(
            [
                ["Stage", "Architecture", "Actions"],
                ["1-10 restaurants", "Single Firebase project", "Tenant isolation, manual onboarding, basic logs"],
                ["10-100 restaurants", "Staging + production projects", "Automated seeding, staff roles, monitoring, support playbooks"],
                ["100-500 restaurants", "Operational automation", "Data retention, analytics aggregation, stronger rate limiting"],
                ["500+ restaurants", "Segmented infrastructure", "Regional projects, queue-backed notifications, warehouse analytics"],
            ],
            [1.15 * inch, 1.75 * inch, 3.2 * inch],
        ),
        p("Firestore scales well when document paths and indexes are designed around query patterns. Avoid global realtime dashboards that read all restaurants at once. Aggregate analytics into separate documents instead of scanning orders repeatedly."),
    ]


def section_backup() -> list:
    return [
        h1("16. Backup & Recovery"),
        bullet([
            "Schedule Firestore exports to a protected Google Cloud Storage bucket.",
            "Keep Firebase rules, indexes, and functions in Git.",
            "Use Vercel deployment history for frontend rollback.",
            "Document manual recovery steps for restaurant configuration and menu data.",
            "Test restore procedures quarterly in a staging project.",
        ]),
        code("gcloud firestore export gs://<backup-bucket>/firestore/$(date +%Y-%m-%d)\ngcloud firestore import gs://<backup-bucket>/firestore/<export-folder>"),
        p("For payment records, preserve Razorpay dashboard exports and webhook logs. Financial reconciliation should not depend only on Firestore order documents."),
    ]


def section_troubleshooting() -> list:
    rows = [
        ["Issue", "Likely cause", "Fix"],
        ["Firebase auth errors", "Provider disabled or wrong auth domain", "Enable provider and verify `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`"],
        ["Firestore permission denied", "Missing role, wrong restaurantId, or strict rules", "Inspect user document and security rule path"],
        ["Razorpay checkout opens but payment not paid", "Verification function failed", "Check function logs and key/secret pair"],
        ["Webhook failures", "Wrong webhook secret or URL", "Recreate webhook and compare `RAZORPAY_WEBHOOK_SECRET`"],
        ["Vercel build fails", "TypeScript or missing env var", "Run `npm run build` locally and validate env"],
        ["Hydration warnings", "Browser-only code rendered on server", "Move browser APIs into client components/effects"],
        ["PWA icons 404", "Missing `/public/icons` files", "Verify icon paths and manifest icons"],
        ["Image warnings", "CSS changed only one dimension", "Use `width:auto` or `height:auto`; preserve ratio"],
    ]
    return [
        h1("17. Troubleshooting"),
        make_table(rows, [1.45 * inch, 2.1 * inch, 2.55 * inch]),
        p("When troubleshooting production, always collect the exact URL, deployment id, Firebase project id, restaurant slug, user role, browser console output, and relevant function logs before changing code."),
    ]


def section_checklist() -> list:
    return [
        h1("18. Deployment Checklist"),
        checklist([
            "Production Firebase project created and separate from staging.",
            "Firestore, Authentication, Storage, and Functions enabled.",
            "Firestore rules deployed and tenant isolation manually tested.",
            "Firestore indexes deployed.",
            "Vercel production environment variables added.",
            "Firebase Functions secrets/environment configured.",
            "Razorpay live keys configured only in production.",
            "Razorpay webhook points to production function URL.",
            "Custom domain connected and HTTPS verified.",
            "PWA manifest, icons, favicon, and service worker return HTTP 200.",
            "Mobile customer order flow tested on at least two device sizes.",
            "Admin live orders, KDS, waiter calls, QR printing, and receipts tested.",
            "Lighthouse performance/accessibility/best-practices/SEO reviewed.",
            "Rollback plan documented.",
            "Monitoring and support alert channels configured.",
        ]),
    ]


def final_sections() -> list:
    return [
        h1("Complete Deployment Summary"),
        p("A production Zenvy Dine deployment consists of a Next.js frontend on Vercel, Firebase Firestore/Auth/Storage/Functions for data and privileged server logic, and Razorpay for checkout and payment verification. The operational heart of the system is tenant isolation through `restaurantId`, role-based admin access, and strongly protected payment verification."),
        h2("Production readiness checklist"),
        checklist([
            "Build and lint pass.",
            "Environment validation passes.",
            "All public assets return 200.",
            "Payment test succeeds in Razorpay test mode.",
            "Firestore security rules reject cross-tenant reads.",
            "Admin and customer flows work on mobile.",
            "Backups and rollback plan are documented.",
        ]),
        h2("Recommended future improvements"),
        bullet([
            "Add Firebase App Check and rate limiting for public order and waiter-call writes.",
            "Move WhatsApp notifications from link-based flow to Meta/Twilio server-side messaging.",
            "Add automated Firestore rules tests in CI.",
            "Add end-to-end browser tests for customer ordering, KDS, and receipts.",
            "Add structured error tracking such as Sentry or a Vercel/Firebase observability stack.",
        ]),
        h2("Maintenance workflow"),
        bullet([
            "Weekly: inspect Vercel and Firebase logs, review failed payments, verify uptime checks.",
            "Monthly: rotate non-critical test keys, review staff access, export Firestore backup reports.",
            "Quarterly: run restore drill, Lighthouse audit, security rule review, and dependency updates.",
        ]),
        h2("Scaling roadmap"),
        p("Phase 1 focuses on reliable onboarding and tenant isolation. Phase 2 adds automated setup, stronger monitoring, and notification infrastructure. Phase 3 adds analytics aggregation, cost controls, and regional segmentation for larger restaurant portfolios."),
    ]


def build_story() -> list:
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(name="TOC1", fontName=FONT_BOLD, fontSize=9.2, leading=12, leftIndent=0, firstLineIndent=0, spaceBefore=3),
        ParagraphStyle(name="TOC2", fontName=FONT, fontSize=8.2, leading=10.5, leftIndent=14, firstLineIndent=0),
    ]

    story = cover()
    story.append(h1("Table of Contents"))
    story.append(toc)
    story.append(PageBreak())

    for section in [
        section_intro,
        section_local,
        section_firebase,
        section_firestore,
        section_env,
        section_razorpay,
        section_functions,
        section_vercel,
        section_domain_ssl,
        section_pwa,
        section_security,
        section_monitoring,
        section_cicd,
        section_performance,
        section_scaling,
        section_backup,
        section_troubleshooting,
        section_checklist,
        final_sections,
    ]:
        story.extend(section())
    return story


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.circle(PAGE_WIDTH - 0.95 * inch, PAGE_HEIGHT - 0.95 * inch, 0.55 * inch, fill=1, stroke=0)
    canvas.setFillColor(ORANGE)
    canvas.circle(PAGE_WIDTH - 0.45 * inch, 0.60 * inch, 0.34 * inch, fill=1, stroke=0)
    canvas.setStrokeColor(colors.HexColor("#344054"))
    for i in range(5):
        canvas.line(0.55 * inch, (1.15 + i * 0.18) * inch, PAGE_WIDTH - 0.55 * inch, (1.15 + i * 0.18) * inch)
    canvas.restoreState()


def main():
    OUT_DIR.mkdir(exist_ok=True)
    doc = ZenvyDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        rightMargin=MARGIN_X,
        leftMargin=MARGIN_X,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title="Zenvy Dine - Complete Production Deployment & Infrastructure Guide",
        author="Zenvy Dine",
        subject="Production deployment and infrastructure guide",
    )
    cover_frame = Frame(MARGIN_X, MARGIN_BOTTOM, PAGE_WIDTH - 2 * MARGIN_X, PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM, id="cover")
    body_frame = Frame(MARGIN_X, MARGIN_BOTTOM, PAGE_WIDTH - 2 * MARGIN_X, PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM, id="body")
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=draw_cover),
        PageTemplate(id="Body", frames=[body_frame], onPage=header_footer),
    ])
    doc.multiBuild(build_story())
    print(PDF_PATH)


if __name__ == "__main__":
    main()
