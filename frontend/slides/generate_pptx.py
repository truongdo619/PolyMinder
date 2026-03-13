#!/usr/bin/env python3
"""
Generate weekly-report-2026-03-03.pptx — matching the HTML slide deck style.

The HTML deck is 960 x 540 CSS-px with padding 48px 56px.
At 72 CSS-px / inch the PPTX widescreen (13.333 x 7.5 in) maps 1 CSS-px ≈ 1 Pt.
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
import copy

# ── Palette (matching CSS :root) ──
BLUE       = RGBColor(0x19, 0x76, 0xD2)
BLUE_DARK  = RGBColor(0x0D, 0x47, 0xA1)
BLUE_MED   = RGBColor(0x15, 0x65, 0xC0)
BLUE_LT    = RGBColor(0xE3, 0xF0, 0xFC)
BLUE_SKY   = RGBColor(0x42, 0xA5, 0xF5)
BLUE_90    = RGBColor(0x90, 0xCA, 0xF9)
BLUE_BB    = RGBColor(0xBB, 0xDE, 0xFB)
GREEN      = RGBColor(0x2E, 0x7D, 0x32)
GREEN_LT   = RGBColor(0xE8, 0xF5, 0xE9)
ORANGE     = RGBColor(0xF5, 0x7C, 0x00)
ORANGE_LT  = RGBColor(0xFF, 0xF3, 0xE0)
PURPLE     = RGBColor(0x6A, 0x1B, 0x9A)
PURPLE_LT  = RGBColor(0xF3, 0xE5, 0xF5)
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
BLACK      = RGBColor(0x21, 0x21, 0x21)
GREY       = RGBColor(0x54, 0x6E, 0x7A)
GREY_LT    = RGBColor(0xF5, 0xF5, 0xF5)
GREY_88    = RGBColor(0x88, 0x88, 0x88)
BG         = RGBColor(0xFA, 0xFB, 0xFC)
BORDER     = RGBColor(0xE0, 0xE0, 0xE0)
ROW_ALT    = RGBColor(0xF5, 0xF7, 0xFA)

FONT = 'Segoe UI'
MONO = 'Consolas'

# ── Slide dimensions matching 16:9 ──
prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
SW = prs.slide_width
SH = prs.slide_height

# HTML padding: 48px top/bottom, 56px left/right → Inches
PAD_X = Inches(0.78)
PAD_Y = Inches(0.67)
CONTENT_W = SW - 2 * PAD_X           # usable width
HALF_W = (CONTENT_W - Inches(0.33)) / 2  # half of 2-col layout with gap


# ════════════════════════════════════════════════
# HELPERS
# ════════════════════════════════════════════════

def _set_rounded(shape, radius_emu=91440):
    """Set corner radius on a shape (default 1/10 inch ≈ 7.2 px ≈ CSS 8px)."""
    sp = shape._element
    prstGeom = sp.find(qn('a:prstGeom'), sp.nsmap) if hasattr(sp, 'nsmap') else None
    if prstGeom is None:
        # Use spPr route
        spPr = sp.spPr
        prstGeom = spPr.find(qn('a:prstGeom'))
    if prstGeom is not None:
        avLst = prstGeom.find(qn('a:avLst'))
        if avLst is None:
            from lxml import etree
            avLst = etree.SubElement(prstGeom, qn('a:avLst'))


def add_bg(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def rect(slide, left, top, w, h, fill, border=None, border_w=Pt(1), rounded=False):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE
    s = slide.shapes.add_shape(shape_type, left, top, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if border:
        s.line.color.rgb = border
        s.line.width = border_w
    else:
        s.line.fill.background()
    return s


def txt(slide, left, top, w, h, text, size=14, bold=False, italic=False,
        color=BLACK, align=PP_ALIGN.LEFT, font=FONT, valign=MSO_ANCHOR.TOP,
        line_spacing=None):
    """Add a simple single-run text box."""
    tb = slide.shapes.add_textbox(left, top, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    try:
        tf.vertical_anchor = valign
    except Exception:
        pass
    p = tf.paragraphs[0]
    p.alignment = align
    if line_spacing:
        p.line_spacing = Pt(line_spacing)
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = font
    return tb


def multi_txt(slide, left, top, w, h, lines, default_size=14, default_color=BLACK,
              default_bold=False, default_font=FONT, line_spacing=None):
    """Add a textbox with multiple paragraphs. Each line is (text, {overrides})."""
    tb = slide.shapes.add_textbox(left, top, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, item in enumerate(lines):
        if isinstance(item, str):
            text, opts = item, {}
        else:
            text, opts = item[0], item[1] if len(item) > 1 else {}
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        if line_spacing:
            p.line_spacing = Pt(line_spacing)
        p.space_after = Pt(opts.get('space_after', 5))
        p.alignment = opts.get('align', PP_ALIGN.LEFT)
        # Support mixed runs via '|' delimiter — e.g. "bold text|normal text"
        run = p.add_run()
        run.text = text
        run.font.size = Pt(opts.get('size', default_size))
        run.font.bold = opts.get('bold', default_bold)
        run.font.color.rgb = opts.get('color', default_color)
        run.font.name = opts.get('font', default_font)
    return tb


def bullets(slide, left, top, w, h, items, size=14, color=BLACK, spacing=6):
    """Bullet list with \u2022 prefix."""
    tb = slide.shapes.add_textbox(left, top, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(spacing)
        p.line_spacing = Pt(size + 6)
        run = p.add_run()
        run.text = '\u2022  ' + item
        run.font.size = Pt(size)
        run.font.color.rgb = color
        run.font.name = FONT
    return tb


def checklist(slide, left, top, w, h, items, size=14, spacing=5):
    """Green-check list matching HTML .checklist."""
    tb = slide.shapes.add_textbox(left, top, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(spacing)
        p.line_spacing = Pt(size + 6)
        # green check
        r1 = p.add_run()
        r1.text = '\u2713  '
        r1.font.size = Pt(size)
        r1.font.bold = True
        r1.font.color.rgb = GREEN
        r1.font.name = FONT
        # item text
        r2 = p.add_run()
        r2.text = item
        r2.font.size = Pt(size)
        r2.font.color.rgb = BLACK
        r2.font.name = FONT
    return tb


def add_table(slide, left, top, w, rows, col_widths=None, font_size=13):
    """Add a styled table. First row is header (blue bg, white text)."""
    n_rows = len(rows)
    n_cols = len(rows[0])
    tbl_shape = slide.shapes.add_table(n_rows, n_cols, left, top, w, Inches(0.01))
    tbl = tbl_shape.table

    # Compute column widths
    if col_widths:
        for ci, cw in enumerate(col_widths):
            tbl.columns[ci].width = cw
    else:
        cw = w // n_cols
        for ci in range(n_cols):
            tbl.columns[ci].width = cw

    for ri, row in enumerate(rows):
        tbl.rows[ri].height = Inches(0.38)
        for ci, cell_text in enumerate(row):
            cell = tbl.cell(ri, ci)
            cell.text = ''
            p = cell.text_frame.paragraphs[0]
            run = p.add_run()
            run.text = cell_text
            run.font.size = Pt(font_size)
            run.font.name = FONT

            if ri == 0:  # header
                run.font.bold = True
                run.font.color.rgb = WHITE
                cell.fill.solid()
                cell.fill.fore_color.rgb = BLUE
            else:
                run.font.color.rgb = BLACK
                if ri % 2 == 0:
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = ROW_ALT
                else:
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = WHITE

            # Vertical alignment
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            # Margins
            cell.margin_left = Inches(0.1)
            cell.margin_right = Inches(0.05)
            cell.margin_top = Inches(0.03)
            cell.margin_bottom = Inches(0.03)
    return tbl_shape


def footer_strip(slide):
    """Gradient-like footer strip at bottom."""
    rect(slide, Inches(0), SH - Inches(0.055), SW, Inches(0.055), BLUE)


def slide_header(slide, title, tag_text=None, tag_color=None):
    """Content slide header: title + accent bar + optional tag."""
    txt(slide, PAD_X, PAD_Y - Inches(0.1), Inches(7), Inches(0.5),
        title, size=28, bold=True, color=BLUE)
    # accent bar
    bar_left = PAD_X + Inches(0.15) + Pt(28) * len(title) * 0.55 / 72
    bar_left = min(bar_left, Inches(6.5))
    rect(slide, bar_left, PAD_Y + Inches(0.3), CONTENT_W - bar_left + PAD_X, Inches(0.04), BLUE_LT)
    if tag_text:
        bg = GREEN_LT if tag_text == 'New' else ORANGE_LT if tag_text == 'Fixed' else BLUE_LT
        tc = GREEN if tag_text == 'New' else ORANGE if tag_text == 'Fixed' else BLUE
        tag_shape = rect(slide, CONTENT_W + PAD_X - Inches(0.65), PAD_Y - Inches(0.02),
                         Inches(0.6), Inches(0.28), bg, rounded=True)
        txt(slide, CONTENT_W + PAD_X - Inches(0.65), PAD_Y - Inches(0.02),
            Inches(0.6), Inches(0.28),
            tag_text, size=10, bold=True, color=tc, align=PP_ALIGN.CENTER,
            valign=MSO_ANCHOR.MIDDLE)


def section_slide(slide, num, icon, title, subtitle):
    """Blue section divider slide."""
    add_bg(slide, BLUE)
    txt(slide, Inches(0), Inches(1.8), SW, Inches(0.8),
        icon, size=48, color=WHITE, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)
    txt(slide, Inches(0), Inches(2.8), SW, Inches(0.7),
        title, size=32, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txt(slide, Inches(0), Inches(3.6), SW, Inches(0.5),
        subtitle, size=15, color=BLUE_BB, align=PP_ALIGN.CENTER)
    # section number
    txt(slide, SW - Inches(1.4), SH - Inches(1.1), Inches(1.2), Inches(0.9),
        str(num), size=72, bold=True, color=RGBColor(0x3A, 0x9A, 0xE8),
        align=PP_ALIGN.RIGHT)


def card(slide, left, top, w, h, fill, accent_color=None, rounded=True):
    """Card with optional left accent border."""
    if accent_color:
        # Left accent strip
        rect(slide, left, top, Inches(0.05), h, accent_color)
        # Main card body
        r = rect(slide, left + Inches(0.05), top, w - Inches(0.05), h, fill,
                 border=BORDER, rounded=False)
    else:
        r = rect(slide, left, top, w, h, fill, border=BORDER, rounded=rounded)
    return r


# Column positions
COL1_X = PAD_X
COL2_X = PAD_X + HALF_W + Inches(0.33)
BODY_Y = PAD_Y + Inches(0.55)  # below header


# ════════════════════════════════════════════════
# SLIDES
# ════════════════════════════════════════════════

def make_slide():
    return prs.slides.add_slide(prs.slide_layouts[6])  # blank


# ── SLIDE 1: Title ──────────────────────────────
s = make_slide()
add_bg(s, BLUE_DARK)
# Simulate gradient with a semi-transparent overlay
rect(s, Inches(7), Inches(0), Inches(6.333), SH, BLUE_MED)

txt(s, PAD_X, Inches(1.2), Inches(8), Inches(0.3),
    'WEEKLY PROGRESS REPORT  \u00b7  POLYMINDER V3.3',
    size=12, bold=True, color=BLUE_BB)

multi_txt(s, PAD_X, Inches(1.8), Inches(9), Inches(1.6), [
    ('Entity Editing UX Overhaul', {'size': 38, 'bold': True, 'color': WHITE}),
    ('& Responsive Improvements', {'size': 38, 'bold': True, 'color': WHITE}),
], line_spacing=44)

txt(s, PAD_X, Inches(3.8), Inches(10), Inches(0.9),
    'Inline editing panel, live BRAT preview, optimistic saves,\n'
    'constraint-aware relations, responsive layout fixes, and BRAT rendering reliability.',
    size=16, color=BLUE_BB)

txt(s, PAD_X, Inches(5.5), Inches(6), Inches(0.4),
    'Truong Dinh Do  \u00b7  RIKEN / JAIST  \u00b7  March 2026',
    size=13, color=BLUE_90)

rect(s, Inches(0), SH - Inches(0.055), SW, Inches(0.055), BLUE_SKY)


# ── SLIDE 2: Agenda ─────────────────────────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'Agenda')

# Problem card
card(s, COL1_X, BODY_Y + Inches(0.1), HALF_W, Inches(1.5), BLUE_LT, BLUE)
txt(s, COL1_X + Inches(0.2), BODY_Y + Inches(0.18), HALF_W - Inches(0.3), Inches(0.3),
    'Problem', size=15, bold=True, color=BLUE)
txt(s, COL1_X + Inches(0.2), BODY_Y + Inches(0.5), HALF_W - Inches(0.3), Inches(0.9),
    'Entity editing required a full-screen modal dialog with 3 tabs, hard-coded '
    'relation types, and a page reload on every save. No live visual feedback. '
    'BRAT preview had rendering reliability issues and layout problems on resize.',
    size=13, color=BLACK)

# Solution card
card(s, COL1_X, BODY_Y + Inches(1.8), HALF_W, Inches(1.3), GREEN_LT, GREEN)
txt(s, COL1_X + Inches(0.2), BODY_Y + Inches(1.88), HALF_W - Inches(0.3), Inches(0.3),
    'Solution', size=15, bold=True, color=GREEN)
txt(s, COL1_X + Inches(0.2), BODY_Y + Inches(2.2), HALF_W - Inches(0.3), Inches(0.8),
    'Replaced with a fast inline panel, live BRAT visualization with robust rendering, '
    'optimistic saves, schema-driven constraints, and responsive layout handling.',
    size=13, color=BLACK)

# Agenda items
agenda = [
    'Inline EntityEditPanel (replaces Dialog)',
    'Live BRAT Preview (paragraph context)',
    'Settings-driven Relations & Constraints',
    'Optimistic Saves (no page reload)',
    'Responsive Layout & Overflow Fixes',
    'BRAT Rendering Reliability',
    'Bug Fixes & UI Polish',
]
for i, label in enumerate(agenda):
    y = BODY_Y + Inches(0.1) + Inches(i * 0.48)
    rect(s, COL2_X, y, HALF_W, Inches(0.4), GREY_LT, rounded=True)
    txt(s, COL2_X + Inches(0.15), y + Inches(0.03), Inches(0.3), Inches(0.34),
        str(i + 1), size=14, bold=True, color=BLUE)
    txt(s, COL2_X + Inches(0.5), y + Inches(0.03), HALF_W - Inches(0.6), Inches(0.34),
        label, size=13, color=BLACK)

footer_strip(s)


# ── SLIDE 3: Section — Before / After ───────────
s = make_slide()
section_slide(s, 1, '\u270E', 'Before vs After',
              'From modal dialog to inline panel \u2014 fewer clicks, no context switch')


# ── SLIDE 4: UX Comparison Table ────────────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'Editing UX: Before vs After')

rows = [
    ['Action', 'Before (clicks)', 'After (clicks)', 'How'],
    ['Change entity type', '4', '1', 'Colored chip grid \u2014 single click'],
    ['Add a relation', '7+', '3', 'Constraint-filtered dropdowns inline'],
    ['Edit relation type', '5', '2', 'Click pill \u2192 pick type from dropdown'],
    ['Delete a relation', '4', '1', 'Single trash icon click'],
    ['Delete an entity', '5', '2', 'Delete \u2192 confirm inline'],
    ['See visual result', 'Save + reload', 'Instant', 'Live BRAT preview updates in real time'],
]

tbl_s = add_table(s, PAD_X, BODY_Y, CONTENT_W, rows,
                  col_widths=[Inches(2.5), Inches(1.8), Inches(1.8), Inches(5.7)])

# Color the "After" column green for non-header rows
tbl = tbl_s.table
for ri in range(1, len(rows)):
    cell = tbl.cell(ri, 2)
    for p in cell.text_frame.paragraphs:
        for run in p.runs:
            run.font.color.rgb = GREEN
            run.font.bold = True
        p.alignment = PP_ALIGN.CENTER
    # Center "Before" column too
    cell_b = tbl.cell(ri, 1)
    for p in cell_b.text_frame.paragraphs:
        p.alignment = PP_ALIGN.CENTER
# Center header cols 1,2
for ci in [1, 2]:
    for p in tbl.cell(0, ci).text_frame.paragraphs:
        p.alignment = PP_ALIGN.CENTER

# Insight box
y_insight = BODY_Y + Inches(0.42) * len(rows) + Inches(0.25)
rect(s, PAD_X, y_insight, CONTENT_W, Inches(0.75), BLUE_LT, BLUE_90, rounded=True)
txt(s, PAD_X + Inches(0.2), y_insight + Inches(0.08), CONTENT_W - Inches(0.4), Inches(0.6),
    'Key insight: The old dialog blocked the PDF context and required a full page reload '
    'after every save. The new panel stays inside the sidebar with optimistic saves and '
    'live visual feedback.', size=13, color=BLACK)

footer_strip(s)


# ── SLIDE 5: Section — Inline Panel ─────────────
s = make_slide()
section_slide(s, 2, '\U0001F6E0', 'Inline EntityEditPanel',
              '7 new components replacing the monolithic Dialog')


# ── SLIDE 6: New Components ─────────────────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'New Components Created', 'New', GREEN)

comp_rows = [
    ['Component', 'Purpose'],
    ['EntityEditPanel', 'Main inline panel (header, body, footer)'],
    ['EntityTypeChipGrid', 'Colored chip grid for 1-click type selection'],
    ['RelationCard', 'Relation display with inline type edit'],
    ['AddRelationRow', 'Constraint-aware add-relation form'],
    ['SpanAdjustEditor', 'Collapsible span adjustment with preview'],
    ['ParagraphBratPreview', 'Live BRAT visualization preview'],
]
add_table(s, COL1_X, BODY_Y, HALF_W + Inches(0.2), comp_rows,
          col_widths=[Inches(2.5), Inches(3.55)])

util_rows = [
    ['Utility', 'Purpose'],
    ['settingsHelpers.ts', 'Types, constraint helpers, contrast colors'],
]
add_table(s, COL1_X, BODY_Y + Inches(3.5), HALF_W + Inches(0.2), util_rows,
          col_widths=[Inches(2.5), Inches(3.55)])

# Panel layout mockup
txt(s, COL2_X + Inches(0.3), BODY_Y - Inches(0.05), HALF_W, Inches(0.35),
    'Panel Layout', size=17, bold=True, color=BLUE)

rect(s, COL2_X + Inches(0.3), BODY_Y + Inches(0.35), HALF_W - Inches(0.3), Inches(4.7),
     RGBColor(0x1E, 0x1E, 0x2E), rounded=True)

mockup = (
    'POLYMER_FAMILY  "Sulfonated poly..."   X\n'
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'
    '\u25bc PARAGRAPH CONTEXT     [Related]\n'
    '  \u250c BRAT graph (live updating) \u2510\n'
    '  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n'
    '  \u2595\u2595\u2595 drag to resize\n'
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'
    'ENTITY TYPE\n'
    '  [VALUE] [\u2713 POLYMER] [PROP_NAME] ...\n'
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'
    'RELATIONS (1)                +\n'
    '  POLYMER \u2013 has_property \u2192 PROP_NAME\n'
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'
    '  [DELETE]          [CANCEL] [SAVE]'
)
txt(s, COL2_X + Inches(0.5), BODY_Y + Inches(0.5), HALF_W - Inches(0.5), Inches(4.3),
    mockup, size=11, color=RGBColor(0xCD, 0xD6, 0xF4), font=MONO)

footer_strip(s)


# ── SLIDE 7: Section — BRAT Preview ─────────────
s = make_slide()
section_slide(s, 3, '\U0001F441', 'Live BRAT Preview',
              'See how edits look before saving \u2014 no more blind editing')


# ── SLIDE 8: BRAT Preview Details ───────────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'ParagraphBratPreview', 'New', GREEN)

# Left: update mechanics
txt(s, COL1_X, BODY_Y, HALF_W, Inches(0.3),
    'Live Update Mechanics', size=17, bold=True, color=BLUE)

update_rows = [
    ['User Action', 'BRAT Response'],
    ['Click entity type chip', 'Entity colour changes instantly'],
    ['Add/delete relation', 'Relation arrow appears/disappears'],
    ['Change relation type', 'Arrow label updates (new in this fix)'],
    ['Adjust span numbers', 'Entity extent updates (300ms debounce)'],
    ['Type user note', 'No change (memoized, no spurious re-render)'],
]
add_table(s, COL1_X, BODY_Y + Inches(0.4), HALF_W + Inches(0.3), update_rows,
          col_widths=[Inches(2.8), Inches(3.55)], font_size=12)

# How it works box
rect(s, COL1_X, BODY_Y + Inches(3.2), HALF_W + Inches(0.3), Inches(1.0),
     BLUE_LT, BLUE_90, rounded=True)
txt(s, COL1_X + Inches(0.15), BODY_Y + Inches(3.28), HALF_W + Inches(0.05), Inches(0.85),
    'How it works: Each change updates a previewKey string. When the key changes, '
    'React destroys and recreates BratEmbeddingDefault, which calls '
    'window.Util.embed() fresh with the modified entity data.',
    size=12, color=BLACK)

# Right: features
txt(s, COL2_X + Inches(0.3), BODY_Y, HALF_W, Inches(0.3),
    'Features', size=17, bold=True, color=BLUE)

features = [
    'Show All / Related Only toggle \u2014 filter to just the edited entity and its relation partners',
    'Drag-to-resize handle (80px\u2013600px) \u2014 expand for long paragraphs, shrink for compact view',
    'Collapsible accordion \u2014 fully hide the preview when not needed',
    'ResizeObserver \u2014 remounts BRAT when sidebar width changes, preventing blank previews',
    'Memoized docData \u2014 prevents spurious embed() calls on unrelated parent re-renders',
    'Full previewKey \u2014 captures relation type+target, not just count',
    'No extra API calls \u2014 overrides paragraph data locally in memory',
]
checklist(s, COL2_X + Inches(0.3), BODY_Y + Inches(0.4), HALF_W - Inches(0.2), Inches(4.5),
          features, size=12, spacing=4)

footer_strip(s)


# ── SLIDE 9: Section — Relations ─────────────────
s = make_slide()
section_slide(s, 4, '\U0001F517', 'Settings-Driven Relations',
              'Constraint-aware validation powered by settings.json')


# ── SLIDE 10: Relations Detail ──────────────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'Constraint-Aware Relations', 'Fixed', ORANGE)

# Before
txt(s, COL1_X, BODY_Y, HALF_W, Inches(0.3),
    'Before (hard-coded)', size=15, bold=True, color=ORANGE)
card(s, COL1_X, BODY_Y + Inches(0.35), HALF_W, Inches(1.5), ORANGE_LT, ORANGE)
bullets(s, COL1_X + Inches(0.2), BODY_Y + Inches(0.4), HALF_W - Inches(0.4), Inches(1.3), [
    '6 relation types hard-coded as <MenuItem> strings in Sidebar.tsx:1031\u20131038',
    'No validation \u2014 user could create invalid Arg1/Arg2 type combinations',
    'Out of sync with settings.json schema',
    'Adding a new relation type required code change',
], size=12, spacing=3)

# After
txt(s, COL1_X, BODY_Y + Inches(2.1), HALF_W, Inches(0.3),
    'After (settings-driven)', size=15, bold=True, color=GREEN)
card(s, COL1_X, BODY_Y + Inches(2.45), HALF_W, Inches(1.5), GREEN_LT, GREEN)
bullets(s, COL1_X + Inches(0.2), BODY_Y + Inches(2.5), HALF_W - Inches(0.4), Inches(1.3), [
    'Reads settings.relation_types dynamically',
    'Filters valid relation types per source entity type',
    'Filters valid target entities per relation type',
    'Schema change = config change only, no code edits',
], size=12, spacing=3)

# Helper functions table
txt(s, COL2_X, BODY_Y, HALF_W, Inches(0.3),
    'Helper Functions', size=17, bold=True, color=BLUE)

helpers = [
    ['Function', 'Role'],
    ['getRelationTypesForSource()', 'Given source entity type, returns valid relation types'],
    ['getValidTargetTypes\nForRelation()', 'Given relation type, returns valid Arg2 entity types'],
    ['getContrastColor()', 'Computes black/white text color from hex background'],
    ['toRelations()', 'Safe cast from legacy array to typed Relation[]'],
]
add_table(s, COL2_X, BODY_Y + Inches(0.4), HALF_W, helpers,
          col_widths=[Inches(2.8), Inches(3.2)], font_size=12)

# Example box
rect(s, COL2_X, BODY_Y + Inches(3.0), HALF_W, Inches(0.9), BLUE_LT, BLUE_90, rounded=True)
txt(s, COL2_X + Inches(0.15), BODY_Y + Inches(3.08), HALF_W - Inches(0.3), Inches(0.75),
    'Example: If the source entity is POLYMER, only has_property, has_value, '
    'abbreviation_of etc. appear in the relation dropdown. Target entities are '
    'filtered to only valid Arg2 types.',
    size=12, color=BLACK)

footer_strip(s)


# ── SLIDE 11: Optimistic Saves ──────────────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'Optimistic Saves', 'New', GREEN)

# Before card
txt(s, COL1_X, BODY_Y, HALF_W, Inches(0.3),
    'Before', size=15, bold=True, color=ORANGE)
card(s, COL1_X, BODY_Y + Inches(0.35), HALF_W, Inches(1.3), ORANGE_LT, ORANGE)
txt(s, COL1_X + Inches(0.2), BODY_Y + Inches(0.45), HALF_W - Inches(0.4), Inches(1.1),
    'Every entity or relation save called navigate(\'/result\'), triggering a full page '
    'reload. The PDF re-rendered, scroll position was lost, and the user had to find '
    'their entity again.',
    size=13, color=BLACK)

# After card
txt(s, COL1_X, BODY_Y + Inches(1.9), HALF_W, Inches(0.3),
    'After', size=15, bold=True, color=GREEN)
card(s, COL1_X, BODY_Y + Inches(2.25), HALF_W, Inches(1.3), GREEN_LT, GREEN)
txt(s, COL1_X + Inches(0.2), BODY_Y + Inches(2.35), HALF_W - Inches(0.4), Inches(1.1),
    'Saves are optimistic: local state updates instantly, the panel closes, and the '
    'API call runs in the background. On failure, changes revert and a snackbar '
    'notification appears.',
    size=13, color=BLACK)

# Save flow steps
txt(s, COL2_X, BODY_Y, HALF_W, Inches(0.3),
    'Save Flow', size=17, bold=True, color=BLUE)

steps = [
    ('1.', 'User clicks Save', GREEN_LT, GREEN),
    ('2.', 'Local highlights[] updated immediately', GREEN_LT, GREEN),
    ('3.', 'Edit panel closes, entity list shows updated data', GREEN_LT, GREEN),
    ('4.', 'API calls fire in background (entity + relations)', BLUE_LT, BLUE),
    ('5.', 'Server response syncs bratOutput, updateId, etc.', BLUE_LT, BLUE),
    ('6.', 'On error: revert to originalHighlights + show snackbar', ORANGE_LT, ORANGE),
]
for i, (num, text, bg_color, border_color) in enumerate(steps):
    y = BODY_Y + Inches(0.4) + Inches(i * 0.56)
    card(s, COL2_X, y, HALF_W, Inches(0.44), bg_color, border_color)
    txt(s, COL2_X + Inches(0.2), y + Inches(0.05), Inches(0.3), Inches(0.34),
        num, size=13, bold=True, color=border_color)
    txt(s, COL2_X + Inches(0.55), y + Inches(0.05), HALF_W - Inches(0.7), Inches(0.34),
        text, size=13, color=BLACK)

footer_strip(s)


# ── SLIDE 12: Section — Responsive ──────────────
s = make_slide()
section_slide(s, 5, '\U0001F4D0', 'Responsive Layout & Overflow Fixes',
              'Sidebar resize, scroll management, and adaptive BRAT rendering')


# ── SLIDE 13: Responsive Details ────────────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'Responsive Layout & Overflow Fixes', 'Fixed', ORANGE)

# Left col: Sidebar resize
txt(s, COL1_X, BODY_Y, HALF_W, Inches(0.3),
    'Sidebar Resize Handling', size=17, bold=True, color=BLUE)
card(s, COL1_X, BODY_Y + Inches(0.35), HALF_W, Inches(1.5), BLUE_LT, BLUE)
bullets(s, COL1_X + Inches(0.2), BODY_Y + Inches(0.42), HALF_W - Inches(0.4), Inches(1.3), [
    'Sidebar max width increased from 500px \u2192 700px for wider BRAT previews',
    'ResizeObserver tracks container width with >10px change threshold',
    'Debounced 300ms to prevent rapid BRAT remounts during drag',
    'First measurement recorded silently (no spurious initial remount)',
], size=12, spacing=3)

# Left col: Overflow management
txt(s, COL1_X, BODY_Y + Inches(2.1), HALF_W, Inches(0.3),
    'Overflow Management', size=17, bold=True, color=BLUE)
card(s, COL1_X, BODY_Y + Inches(2.45), HALF_W, Inches(1.65), GREEN_LT, GREEN)
bullets(s, COL1_X + Inches(0.2), BODY_Y + Inches(2.52), HALF_W - Inches(0.4), Inches(1.5), [
    'Explicit overflowX: hidden on EntityEditPanel scrollable body',
    'Sidebar overflow toggles to hidden when edit panel is visible (prevents double scrollbar)',
    'CSS fix: overflow-y: auto without overflow-x promotes it to auto per spec',
    'Scrollbar width reduced from 10px to 6px for less visual noise',
], size=12, spacing=3)

# Right col: Drag-to-resize
txt(s, COL2_X, BODY_Y, HALF_W, Inches(0.3),
    'Drag-to-Resize BRAT Preview', size=17, bold=True, color=BLUE)
card(s, COL2_X, BODY_Y + Inches(0.35), HALF_W, Inches(1.5), PURPLE_LT, PURPLE)
bullets(s, COL2_X + Inches(0.2), BODY_Y + Inches(0.42), HALF_W - Inches(0.4), Inches(1.3), [
    'Mouse drag handle at bottom of BRAT preview panel',
    'Height range: 80px (min) to 600px (max), default 180px',
    'Visual grip indicator with hover/active state transitions',
    'Text selection disabled during drag to prevent interference',
], size=12, spacing=3)

# Right col: CSS breakpoints
txt(s, COL2_X, BODY_Y + Inches(2.1), HALF_W, Inches(0.3),
    'CSS Responsive Breakpoints', size=17, bold=True, color=BLUE)

bp_rows = [
    ['Breakpoint', 'Changes'],
    ['\u2264 1200px', 'Smaller entity badges (12px), tighter highlight padding'],
    ['\u2264 900px', 'Further reduced padding and margins for compact view'],
    ['Any width', 'BRAT SVG re-renders on sidebar drag via ResizeObserver'],
]
add_table(s, COL2_X, BODY_Y + Inches(2.45), HALF_W, bp_rows,
          col_widths=[Inches(1.5), Inches(4.5)], font_size=12)

footer_strip(s)


# ── SLIDE 14: Section — BRAT Reliability ────────
s = make_slide()
section_slide(s, 6, '\u2699', 'BRAT Rendering Reliability',
              'Preventing content disappearance during editing, resizing, and relation changes')


# ── SLIDE 15: BRAT Reliability Details ──────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'BRAT Rendering Reliability Fixes', 'Fixed', ORANGE)

# Left: Bug 1
txt(s, COL1_X, BODY_Y, HALF_W + Inches(0.3), Inches(0.3),
    'Bug 1: Incomplete previewKey', size=15, bold=True, color=ORANGE)
card(s, COL1_X, BODY_Y + Inches(0.35), HALF_W + Inches(0.3), Inches(1.6), ORANGE_LT, ORANGE)
txt(s, COL1_X + Inches(0.2), BODY_Y + Inches(0.45), HALF_W - Inches(0.1), Inches(0.5),
    'Problem: previewKey only included currentRelations.length. Changing a '
    'relation\'s type or target (without changing count) did not trigger BRAT remount.',
    size=12, color=BLACK)
rect(s, COL1_X + Inches(0.15), BODY_Y + Inches(1.05), HALF_W, Inches(0.5), GREEN_LT, GREEN)
txt(s, COL1_X + Inches(0.3), BODY_Y + Inches(1.1), HALF_W - Inches(0.3), Inches(0.4),
    'Fix: previewKey now uses relations.map(r => type:arg_id).join(\',\') '
    '\u2014 any change to type or target produces a new key.',
    size=11, color=BLACK)

# Left: Bug 2
txt(s, COL1_X, BODY_Y + Inches(2.2), HALF_W + Inches(0.3), Inches(0.3),
    'Bug 2: New docData reference on every render', size=15, bold=True, color=ORANGE)
card(s, COL1_X, BODY_Y + Inches(2.55), HALF_W + Inches(0.3), Inches(2.0), ORANGE_LT, ORANGE)
txt(s, COL1_X + Inches(0.2), BODY_Y + Inches(2.65), HALF_W - Inches(0.1), Inches(0.8),
    'Problem: docData was constructed inline (new object every render). '
    'BratEmbeddingDefault\'s useEffect([docData]) compares by reference, so it fired '
    'window.Util.embed() on EVERY parent re-render (typing notes, toggling UI, saving). '
    'This caused BRAT to flicker or fail silently.',
    size=12, color=BLACK)
rect(s, COL1_X + Inches(0.15), BODY_Y + Inches(3.6), HALF_W, Inches(0.5), GREEN_LT, GREEN)
txt(s, COL1_X + Inches(0.3), BODY_Y + Inches(3.65), HALF_W - Inches(0.3), Inches(0.4),
    'Fix: Wrapped all computation in useMemo keyed on previewKey + paragraphData. '
    'docData reference only changes when actual content changes.',
    size=11, color=BLACK)

# Right: Other fixes
txt(s, COL2_X + Inches(0.3), BODY_Y, HALF_W, Inches(0.3),
    'Other Rendering Fixes', size=17, bold=True, color=BLUE)

other_fixes = [
    ('BRAT disappears on sidebar resize',
     'ResizeObserver with debounced remount, >10px threshold'),
    ('BRAT renders then vanishes instantly',
     'Skip first width measurement (0\u2192actual was spurious remount)'),
    ('Double scrollbar conflicts',
     'Sidebar overflow toggles to hidden when edit panel is open'),
    ('Horizontal scrollbar from BRAT SVG',
     'Explicit overflowX: hidden on scrollable containers'),
]
for i, (bug, fix) in enumerate(other_fixes):
    y = BODY_Y + Inches(0.4) + Inches(i * 1.15)
    card(s, COL2_X + Inches(0.3), y, HALF_W - Inches(0.3), Inches(0.95), GREY_LT)
    txt(s, COL2_X + Inches(0.5), y + Inches(0.08), HALF_W - Inches(0.6), Inches(0.28),
        bug, size=12, bold=True, color=ORANGE)
    txt(s, COL2_X + Inches(0.5), y + Inches(0.42), HALF_W - Inches(0.6), Inches(0.45),
        '\u2713 ' + fix, size=12, color=GREEN)

footer_strip(s)


# ── SLIDE 16: Section — Bug Fixes ───────────────
s = make_slide()
section_slide(s, 7, '\U0001F41B', 'Bug Fixes & Polish',
              '8 issues discovered and resolved')


# ── SLIDE 17: Bug Fixes Detail ──────────────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'All Bugs Fixed', 'Fixed', ORANGE)

bugs = [
    ('Hard-coded relation types',
     'Replaced 6 hard-coded <MenuItem> strings with dynamic reads from settings.relation_types'),
    ('BRAT preview disappearing on resize',
     'Added ResizeObserver with debounced remount; only triggers when width changes >10px'),
    ('BRAT renders then vanishes instantly',
     'Initial debouncedWidth change (0\u2192actual) was spurious remount; fixed by skipping first measurement'),
    ('Persistent horizontal scrollbar',
     'Added explicit overflowX: hidden; CSS overflow-y: auto without overflow-x promotes to auto'),
    ('Double scrollbar when editing',
     'Sidebar overflow toggles to hidden when EntityEditPanel is visible'),
    ('Sidebar too narrow for BRAT',
     'Increased max resizable width from 500px to 700px'),
    ('Incomplete previewKey for relations',
     'Key now includes full relation type+target, not just count'),
    ('Spurious BRAT re-renders',
     'Memoized docData with useMemo; reference only changes when content changes'),
]

for i, (bug, fix) in enumerate(bugs):
    y = BODY_Y + Inches(i * 0.65)
    card(s, PAD_X, y, CONTENT_W, Inches(0.55), ORANGE_LT, ORANGE)
    txt(s, PAD_X + Inches(0.25), y + Inches(0.05), Inches(3.8), Inches(0.45),
        bug, size=12, bold=True, color=ORANGE)
    txt(s, PAD_X + Inches(4.2), y + Inches(0.05), CONTENT_W - Inches(4.5), Inches(0.45),
        fix, size=11, color=BLACK)

footer_strip(s)


# ── SLIDE 18: Summary ──────────────────────────
s = make_slide()
add_bg(s, WHITE)
slide_header(s, 'Summary')

# Stat boxes
stats = [('7', 'New components\ncreated'), ('8', 'Bugs\nfixed'), ('0', 'Page reloads\non save')]
stat_w = Inches(3.5)
for i, (num, label) in enumerate(stats):
    x = PAD_X + Inches(i * 4.0)
    card(s, x, BODY_Y, stat_w, Inches(1.3), GREY_LT)
    txt(s, x, BODY_Y + Inches(0.1), stat_w, Inches(0.6),
        num, size=40, bold=True, color=BLUE, align=PP_ALIGN.CENTER)
    txt(s, x, BODY_Y + Inches(0.7), stat_w, Inches(0.5),
        label, size=12, color=GREY_88, align=PP_ALIGN.CENTER)

# New files
txt(s, COL1_X, BODY_Y + Inches(1.6), HALF_W, Inches(0.3),
    'New Files', size=17, bold=True, color=BLUE)
checklist(s, COL1_X, BODY_Y + Inches(1.95), HALF_W, Inches(3.5), [
    'EntityEditPanel.tsx \u2014 inline editing panel',
    'EntityTypeChipGrid.tsx \u2014 colored type chips',
    'RelationCard.tsx \u2014 relation display + edit',
    'AddRelationRow.tsx \u2014 constraint-aware add form',
    'SpanAdjustEditor.tsx \u2014 span adjustment',
    'ParagraphBratPreview.tsx \u2014 live BRAT preview',
    'settingsHelpers.ts \u2014 types and utilities',
], size=12, spacing=3)

# Modified files
txt(s, COL2_X, BODY_Y + Inches(1.6), HALF_W, Inches(0.3),
    'Modified Files', size=17, bold=True, color=BLUE)
checklist(s, COL2_X, BODY_Y + Inches(1.95), HALF_W, Inches(2.0), [
    'Sidebar.tsx \u2014 replaced Dialog with inline panel, optimistic saves',
    'ResultComponent.tsx \u2014 sidebar max width 500\u2192700px',
    'Sidebar.css \u2014 entity card styling, scroll fixes, responsive breakpoints',
    'ParagraphBratPreview.tsx \u2014 useMemo + full previewKey fix',
], size=12, spacing=3)

# Key principle box
txt(s, COL2_X, BODY_Y + Inches(3.6), HALF_W, Inches(0.3),
    'Key Principle', size=17, bold=True, color=BLUE)
rect(s, COL2_X, BODY_Y + Inches(3.95), HALF_W, Inches(0.85), BLUE_LT, BLUE_90, rounded=True)
txt(s, COL2_X + Inches(0.15), BODY_Y + Inches(4.03), HALF_W - Inches(0.3), Inches(0.7),
    'Zero changes to BratEmbedding.tsx, BratEmbeddingDefault.tsx, or ResultComponent layout. '
    'All new functionality is additive.',
    size=12, bold=True, color=BLACK)

footer_strip(s)


# ── SLIDE 19: Thank You ────────────────────────
s = make_slide()
add_bg(s, BLUE_DARK)
rect(s, Inches(7), Inches(0), Inches(6.333), SH, BLUE_MED)

txt(s, PAD_X, Inches(1.2), Inches(8), Inches(0.3),
    'POLYMINDER V3.3  \u00b7  MARCH 2026',
    size=12, bold=True, color=BLUE_BB)

txt(s, PAD_X, Inches(2.4), Inches(8), Inches(0.8),
    'Thank you', size=42, bold=True, color=WHITE)

txt(s, PAD_X, Inches(3.6), Inches(6), Inches(0.4),
    'Questions welcome.', size=17, color=BLUE_BB)

multi_txt(s, PAD_X, Inches(5.0), Inches(8), Inches(1.0), [
    ('Truong Dinh Do', {'size': 14, 'color': BLUE_90}),
    ('RIKEN Center for Advanced Intelligence Project / JAIST', {'size': 13, 'color': BLUE_90}),
    ('truongdo@jaist.ac.jp', {'size': 13, 'color': BLUE_90}),
], line_spacing=20)

rect(s, Inches(0), SH - Inches(0.055), SW, Inches(0.055), BLUE_SKY)


# ════════════════════════════════════════════════
# SAVE
# ════════════════════════════════════════════════
out = '/home/truongdo/drive/PhD/RIKEN/source_code/PolyMinder_v3.3/slides/weekly-report-2026-03-03.pptx'
prs.save(out)
print(f'Saved: {out}')
print(f'Total slides: {len(prs.slides)}')
