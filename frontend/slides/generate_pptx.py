"""Generate weekly-report.pptx from slide content."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# ── Helpers ──────────────────────────────────────────────────────────────────

W = Inches(13.33)   # 16:9 widescreen width
H = Inches(7.5)     # 16:9 widescreen height

# Brand colours
BLUE       = RGBColor(0x19, 0x76, 0xD2)
BLUE_DARK  = RGBColor(0x0D, 0x47, 0xA1)
BLUE_LT    = RGBColor(0xE3, 0xF0, 0xFC)
GREEN      = RGBColor(0x2E, 0x7D, 0x32)
GREEN_LT   = RGBColor(0xE8, 0xF5, 0xE9)
ORANGE     = RGBColor(0xF5, 0x7C, 0x00)
ORANGE_LT  = RGBColor(0xFF, 0xF3, 0xE0)
PURPLE     = RGBColor(0x6A, 0x1B, 0x9A)
PURPLE_LT  = RGBColor(0xF3, 0xE5, 0xF5)
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
BLACK      = RGBColor(0x21, 0x21, 0x21)
GREY       = RGBColor(0x54, 0x6E, 0x7A)
GREY_LT    = RGBColor(0xFA, 0xFB, 0xFC)
BORDER     = RGBColor(0xE0, 0xE0, 0xE0)


def rgb(r, g, b):
    return RGBColor(r, g, b)


def add_rect(slide, left, top, width, height, fill_color=None, line_color=None, line_width=Pt(0.5)):
    from pptx.util import Pt
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        left, top, width, height
    )
    shape.line.color.rgb = line_color or BORDER
    shape.line.width = line_width
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
        shape.line.fill.background()
    return shape


def add_textbox(slide, left, top, width, height, text, font_size=Pt(14),
                bold=False, color=BLACK, align=PP_ALIGN.LEFT,
                wrap=True, italic=False):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = font_size
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return txBox


def add_text_to_shape(shape, text, font_size=Pt(13), bold=False, color=BLACK,
                      align=PP_ALIGN.LEFT, italic=False):
    tf = shape.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = font_size
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color


def add_card(slide, left, top, width, height, title, body_lines,
             accent_color=BLUE, bg_color=BLUE_LT, title_color=None,
             body_font_size=Pt(12)):
    # background rect
    shape = add_rect(slide, left, top, width, height,
                     fill_color=bg_color, line_color=accent_color, line_width=Pt(1))
    # left accent bar (4px)
    bar = add_rect(slide, left, top, Inches(0.07), height,
                   fill_color=accent_color, line_color=accent_color, line_width=Pt(0))

    # title
    t_col = title_color or accent_color
    if title:
        add_textbox(slide, left + Inches(0.15), top + Inches(0.1),
                    width - Inches(0.2), Inches(0.35),
                    title, font_size=Pt(12), bold=True, color=t_col)
    # body
    y_offset = Inches(0.4) if title else Inches(0.12)
    body = "\n".join(body_lines)
    add_textbox(slide, left + Inches(0.15), top + y_offset,
                width - Inches(0.22), height - y_offset - Inches(0.1),
                body, font_size=body_font_size, color=BLACK)


def slide_header(slide, title, badge_text=None, badge_color=BLUE):
    """Blue title + horizontal rule."""
    # Title
    add_textbox(slide, Inches(0.6), Inches(0.4), Inches(10.5), Inches(0.7),
                title, font_size=Pt(26), bold=True, color=BLUE)
    # Rule line
    line_shape = slide.shapes.add_shape(1, Inches(0.6), Inches(1.05),
                                        Inches(11.7), Inches(0.04))
    line_shape.fill.solid()
    line_shape.fill.fore_color.rgb = BLUE_LT
    line_shape.line.fill.background()
    # Badge pill
    if badge_text:
        pill = add_rect(slide, Inches(11.5), Inches(0.48), Inches(1.2), Inches(0.38),
                        fill_color=badge_color, line_color=badge_color)
        add_text_to_shape(pill, badge_text, font_size=Pt(11), bold=True,
                          color=WHITE, align=PP_ALIGN.CENTER)


def footer_bar(slide):
    bar = slide.shapes.add_shape(1, 0, H - Inches(0.06), W, Inches(0.06))
    bar.fill.solid()
    bar.fill.fore_color.rgb = BLUE
    bar.line.fill.background()


# ── Presentation setup ───────────────────────────────────────────────────────

prs = Presentation()
prs.slide_width  = W
prs.slide_height = H

blank_layout = prs.slide_layouts[6]  # completely blank


def new_slide():
    return prs.slides.add_slide(blank_layout)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — Title
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()

# Gradient-ish background (solid dark blue as pptx gradient support is complex)
bg = add_rect(slide, 0, 0, W, H, fill_color=BLUE_DARK)
bg.line.fill.background()

# Kicker
add_textbox(slide, Inches(0.8), Inches(1.8), Inches(11), Inches(0.4),
            "WEEKLY PROGRESS REPORT · POLYMINDER v3.3",
            font_size=Pt(11), bold=True, color=rgb(0xBB, 0xD5, 0xF8))

# Main title
add_textbox(slide, Inches(0.8), Inches(2.2), Inches(11), Inches(1.6),
            "Guided User Experience Feature",
            font_size=Pt(44), bold=True, color=WHITE)

# Subtitle
add_textbox(slide, Inches(0.8), Inches(3.8), Inches(10), Inches(0.9),
            "Contextual guidance system, workflow stepper, and\n"
            "documentation overhaul — implemented end-to-end.",
            font_size=Pt(18), color=rgb(0xBB, 0xD5, 0xF8))

# Meta
add_textbox(slide, Inches(0.8), Inches(5.2), Inches(10), Inches(0.5),
            "Truong Dinh Do · RIKEN / JAIST · February 2026",
            font_size=Pt(13), color=rgb(0x90, 0xA4, 0xAE))

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — Agenda
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "Agenda")

# Left column: two cards
add_card(slide, Inches(0.6), Inches(1.25), Inches(5.5), Inches(1.3),
         "🎯 Problem",
         ["PolyMinder had no structured guidance. New users had no indication of the typical annotation workflow."],
         accent_color=BLUE, bg_color=BLUE_LT)

add_card(slide, Inches(0.6), Inches(2.65), Inches(5.5), Inches(1.3),
         "✅ Solution",
         ["Built a complete guided UX system: progress stepper, contextual banners, bug fixes, and full documentation."],
         accent_color=GREEN, bg_color=GREEN_LT)

# Right column: numbered list items
items = [
    "1️⃣  Core Infrastructure (GuidanceSystem)",
    "2️⃣  Workflow Stepper + Contextual Banners",
    "3️⃣  Bug Fixes (3 issues found & fixed)",
    "4️⃣  Extended Coverage — All 7 components",
    "5️⃣  Documentation — 4 new + 3 rewritten pages",
]
for i, item in enumerate(items):
    box = add_rect(slide, Inches(6.4), Inches(1.25 + i * 0.72), Inches(6.3), Inches(0.62),
                   fill_color=GREY_LT, line_color=BORDER)
    add_text_to_shape(box, item, font_size=Pt(13.5), color=BLACK)

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — Section: Core System
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()

bg = add_rect(slide, 0, 0, W, H, fill_color=BLUE)
bg.line.fill.background()

add_textbox(slide, Inches(0), Inches(2.0), W, Inches(1.0),
            "🏗️", font_size=Pt(52), color=WHITE, align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0), Inches(3.0), W, Inches(1.2),
            "Core Guidance Infrastructure",
            font_size=Pt(36), bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0), Inches(4.1), W, Inches(0.7),
            "New GuidanceSystem module — shared state, dismissible banners, workflow stepper",
            font_size=Pt(16), color=rgb(0xBB, 0xD5, 0xF8), align=PP_ALIGN.CENTER)

# Large section number watermark
add_textbox(slide, Inches(10.5), Inches(4.5), Inches(2.5), Inches(2.5),
            "1", font_size=Pt(120), bold=True, color=rgb(0xFF, 0xFF, 0xFF))


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — GuidanceSystem Module
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "GuidanceSystem Module", badge_text="NEW", badge_color=GREEN)

# Left: table of new files
headers = ["File", "Role"]
rows = [
    ["useGuidance.ts",    "State hook + localStorage"],
    ["GuidanceContext.tsx","Shared React context"],
    ["GuidanceBanner.tsx","Dismissible alert component"],
    ["WorkflowStepper.tsx","5-step progress bar"],
    ["guidanceConfig.ts", "All guidance definitions"],
]
col_w = [Inches(3.0), Inches(2.9)]
row_h = Inches(0.42)
table_left = Inches(0.6)
table_top  = Inches(1.3)

# Header row
for c, h in enumerate(headers):
    x = table_left + sum(col_w[:c])
    rect = add_rect(slide, x, table_top, col_w[c], row_h, fill_color=BLUE, line_color=BLUE)
    add_text_to_shape(rect, h, font_size=Pt(12), bold=True, color=WHITE)

for r, row in enumerate(rows):
    bg_c = GREY_LT if r % 2 == 0 else WHITE
    for c, cell in enumerate(row):
        x = table_left + sum(col_w[:c])
        y = table_top + row_h * (r + 1)
        rect = add_rect(slide, x, y, col_w[c], row_h, fill_color=bg_c, line_color=BORDER)
        add_text_to_shape(rect, cell, font_size=Pt(12), color=BLACK)

# Right: checklist
add_textbox(slide, Inches(6.5), Inches(1.3), Inches(6.3), Inches(0.45),
            "Key design decisions", font_size=Pt(14), bold=True, color=BLUE)

decisions = [
    "✓  Single shared state via React Context — toggle in one place affects all components",
    "✓  Persisted to localStorage — dismissals survive page refresh",
    "✓  Per-document reset — completed steps clear when a new document opens",
    "✓  Zero new TypeScript errors — maintained pre-existing baseline throughout",
    "✓  Fully dismissible — experienced users can hide all tips",
]
for i, d in enumerate(decisions):
    add_textbox(slide, Inches(6.5), Inches(1.85 + i * 0.78), Inches(6.3), Inches(0.7),
                d, font_size=Pt(12.5), color=BLACK)

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — Workflow Stepper
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "Workflow Stepper", badge_text="NEW", badge_color=GREEN)

add_textbox(slide, Inches(0.6), Inches(1.2), Inches(11.5), Inches(0.4),
            "A collapsible 5-step progress bar at the top of the PDF viewer. Each step ticks when its condition is met.",
            font_size=Pt(13.5), color=GREY)

# Stepper visual mock — background panel
panel = add_rect(slide, Inches(0.6), Inches(1.7), Inches(12.1), Inches(1.6),
                 fill_color=GREY_LT, line_color=BORDER)

step_data = [
    ("✓", "Upload PDF",      GREEN,          True),
    ("✓", "Review Entities", GREEN,          True),
    ("✓", "Check Relations", GREEN,          True),
    ("opt","Run LLM\n(optional)", rgb(0x19,0x76,0xD2), False),
    ("5", "Export Results",  rgb(0xBB,0xBB,0xBB), False),
]
dot_r = Inches(0.4)
step_y = Inches(1.95)
line_y = step_y + dot_r / 2 - Inches(0.02)
step_xs = [Inches(1.4), Inches(3.8), Inches(6.2), Inches(8.6), Inches(11.0)]
line_color_done = GREEN
line_color_grey = BORDER

for i, (num, label, dot_fill, done) in enumerate(step_data):
    x = step_xs[i]
    # dot circle
    dot = slide.shapes.add_shape(9, x - dot_r/2, step_y, dot_r, dot_r)  # 9 = oval
    dot.fill.solid()
    dot.fill.fore_color.rgb = dot_fill
    dot.line.fill.background()
    # dot text
    add_textbox(slide, x - dot_r/2, step_y, dot_r, dot_r,
                num, font_size=Pt(13), bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    # label
    add_textbox(slide, x - Inches(0.55), step_y + dot_r + Inches(0.04), Inches(1.1), Inches(0.55),
                label, font_size=Pt(10), color=BLACK if done else GREY, align=PP_ALIGN.CENTER)
    # connecting line (between steps)
    if i < len(step_data) - 1:
        line_x = x + dot_r / 2 + Inches(0.05)
        next_x = step_xs[i+1] - dot_r / 2 - Inches(0.05)
        lc = line_color_done if (done and step_data[i+1][3]) else line_color_grey
        lshape = slide.shapes.add_shape(1, line_x, line_y, next_x - line_x, Inches(0.04))
        lshape.fill.solid()
        lshape.fill.fore_color.rgb = lc
        lshape.line.fill.background()

# Caption
add_textbox(slide, Inches(0.6), Inches(3.35), Inches(12.1), Inches(0.35),
            "Workflow Guide — (3/4) required steps complete",
            font_size=Pt(11), color=GREY, align=PP_ALIGN.CENTER)

# Three feature cards
card_data = [
    (BLUE,   BLUE_LT,  "CLICK TO NAVIGATE",
     "Each step is clickable — jumps directly to that annotation mode"),
    (GREEN,  GREEN_LT, "OPTIONAL STEP",
     "LLM step shown in faded blue with \"(optional)\" label — skipped in required count"),
    (ORANGE, ORANGE_LT,"COLLAPSIBLE",
     "Collapses to a one-line summary showing only the next required step"),
]
for i, (ac, bg_c, title, body) in enumerate(card_data):
    add_card(slide, Inches(0.6 + i * 4.15), Inches(3.8), Inches(3.9), Inches(1.5),
             title, [body], accent_color=ac, bg_color=bg_c)

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — Contextual Guidance Banners
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "Contextual Guidance Banners", badge_text="NEW", badge_color=GREEN)

# Left: mock banners
add_textbox(slide, Inches(0.6), Inches(1.25), Inches(6.0), Inches(0.35),
            "17 banner items defined in guidanceConfig.ts, each with a condition, context, and priority.",
            font_size=Pt(13), color=GREY)

# Banner mock 1 — info
b1 = add_rect(slide, Inches(0.6), Inches(1.7), Inches(5.9), Inches(1.1),
              fill_color=BLUE_LT, line_color=BLUE, line_width=Pt(1))
add_textbox(slide, Inches(0.75), Inches(1.75), Inches(5.5), Inches(0.35),
            "💡 ENTITIES EXTRACTED", font_size=Pt(11), bold=True, color=BLUE_DARK)
add_textbox(slide, Inches(0.75), Inches(2.1), Inches(5.5), Inches(0.55),
            "Click any entity to scroll to it in the PDF. Right-click for edit and delete options.",
            font_size=Pt(12.5), color=BLACK)

# Banner mock 2 — warning
b2 = add_rect(slide, Inches(0.6), Inches(2.9), Inches(5.9), Inches(1.1),
              fill_color=ORANGE_LT, line_color=ORANGE, line_width=Pt(1))
add_textbox(slide, Inches(0.75), Inches(2.95), Inches(5.5), Inches(0.35),
            "⚠️ NO RELATIONS FOUND", font_size=Pt(11), bold=True, color=ORANGE)
add_textbox(slide, Inches(0.75), Inches(3.3), Inches(5.5), Inches(0.55),
            "No relationships extracted yet. Try re-running the RE model from the toolbar.",
            font_size=Pt(12.5), color=BLACK)

# Right: component coverage table
add_textbox(slide, Inches(6.9), Inches(1.25), Inches(6.0), Inches(0.35),
            "17 guidance items across 7 components", font_size=Pt(13.5), bold=True, color=BLUE)

comp_rows = [
    ("DocumentList",               "2"),
    ("Sidebar (Entities/Relations)","4"),
    ("LLMSidebar",                 "2"),
    ("SettingSidebar",             "4"),
    ("EventSidebar",               "2"),
    ("TableSidebar",               "2"),
    ("ParagraphSidebar",           "1"),
]
col_w2 = [Inches(4.3), Inches(1.0)]
t2_left = Inches(6.9)
t2_top  = Inches(1.7)
# header
for c, h in enumerate(["Component", "Banners"]):
    x = t2_left + sum(col_w2[:c])
    rect = add_rect(slide, x, t2_top, col_w2[c], Inches(0.38),
                    fill_color=BLUE, line_color=BLUE)
    add_text_to_shape(rect, h, font_size=Pt(12), bold=True, color=WHITE)
for r, (comp, count) in enumerate(comp_rows):
    bg_c = GREY_LT if r % 2 == 0 else WHITE
    row_vals = [comp, count]
    for c, val in enumerate(row_vals):
        x = t2_left + sum(col_w2[:c])
        y = t2_top + Inches(0.38) * (r + 1)
        rect = add_rect(slide, x, y, col_w2[c], Inches(0.38),
                        fill_color=bg_c, line_color=BORDER)
        add_text_to_shape(rect, val, font_size=Pt(12), color=BLACK,
                          align=PP_ALIGN.CENTER if c == 1 else PP_ALIGN.LEFT)

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — Section: Bug Fixes
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
bg = add_rect(slide, 0, 0, W, H, fill_color=BLUE)
bg.line.fill.background()

add_textbox(slide, Inches(0), Inches(2.0), W, Inches(1.0),
            "🐛", font_size=Pt(52), color=WHITE, align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0), Inches(3.0), W, Inches(1.2),
            "Bug Fixes", font_size=Pt(36), bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0), Inches(4.1), W, Inches(0.7),
            "3 issues discovered during testing — all fixed",
            font_size=Pt(16), color=rgb(0xBB, 0xD5, 0xF8), align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(10.5), Inches(4.5), Inches(2.5), Inches(2.5),
            "2", font_size=Pt(120), bold=True, color=WHITE)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — 3 Bugs Found & Fixed
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "3 Bugs Found & Fixed", badge_text="FIXED", badge_color=ORANGE)

bugs = [
    ("Bug 1 — Shared state (toggle had no effect)",
     "Root cause: Each component called useGuidance() independently → isolated localStorage reads per component. "
     "Toggle in SettingSidebar only updated its own instance.\n"
     "Fix: Created GuidanceContext.tsx with a single GuidanceProvider at app root. All components share one state via useGuidanceContext()."),
    ("Bug 2 — \"Check Relations\" ticked immediately on load",
     "Root cause: isComplete: (s) => s.relationCount > 0 fired the moment the NLP model returned any relations — before the user did anything.\n"
     "Fix: Changed to () => false. Now ticks only when user switches to Relations mode via completeStep('review-relations')."),
    ("Bug 3 — Stale completed steps across documents",
     "Root cause: completedSteps in localStorage persisted when opening a new document — steps appeared ticked before the user did anything.\n"
     "Fix: Added resetCompletedSteps(); called in ResultComponent whenever documentId changes (tracked via useRef)."),
]
for i, (title, body) in enumerate(bugs):
    add_card(slide, Inches(0.6), Inches(1.25 + i * 1.8), Inches(12.1), Inches(1.65),
             title, [body], accent_color=ORANGE, bg_color=ORANGE_LT,
             title_color=ORANGE, body_font_size=Pt(12))

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — Step Completion Logic
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "Step Completion Logic")

add_textbox(slide, Inches(0.6), Inches(1.2), Inches(11.5), Inches(0.4),
            "Each step uses two independent signals — either one triggers the tick:",
            font_size=Pt(13.5), color=GREY)

step_rows = [
    ("Upload PDF",       "documentId !== null",    "—"),
    ("Review Entities",  "highlights.length > 0",  "—"),
    ("Check Relations",  "— (always false)",        "User switches to Relations mode"),
    ("Run LLM (opt.)",   "LLLOutput has entities",  "User switches to LLM mode"),
    ("Export Results",   "— (always false)",        "User downloads PDF or JSON"),
]
col_w3 = [Inches(2.4), Inches(3.8), Inches(5.5)]
t3_left = Inches(0.6)
t3_top  = Inches(1.7)

for c, h in enumerate(["Step", "Data-driven (auto)", "Action-driven (user visit)"]):
    x = t3_left + sum(col_w3[:c])
    rect = add_rect(slide, x, t3_top, col_w3[c], Inches(0.42),
                    fill_color=BLUE, line_color=BLUE)
    add_text_to_shape(rect, h, font_size=Pt(12), bold=True, color=WHITE)

for r, (step, auto, action) in enumerate(step_rows):
    bg_c = GREY_LT if r % 2 == 0 else WHITE
    for c, val in enumerate([step, auto, action]):
        x = t3_left + sum(col_w3[:c])
        y = t3_top + Inches(0.42) * (r + 1)
        rect = add_rect(slide, x, y, col_w3[c], Inches(0.42),
                        fill_color=bg_c, line_color=BORDER)
        add_text_to_shape(rect, val, font_size=Pt(12), bold=(c == 0), color=BLACK)

# Highlight box
hb = add_rect(slide, Inches(0.6), Inches(4.8), Inches(12.1), Inches(0.9),
              fill_color=BLUE_LT, line_color=rgb(0x90, 0xCA, 0xF9), line_width=Pt(1))
add_text_to_shape(hb,
                  "WorkflowStepper: isComplete(step) || isStepComplete(step.id) — combines both signals. "
                  "Optional step is skipped in active-step calculation and required-step counter.",
                  font_size=Pt(13), color=BLACK)

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 10 — Section: Documentation
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
bg = add_rect(slide, 0, 0, W, H, fill_color=BLUE)
bg.line.fill.background()

add_textbox(slide, Inches(0), Inches(2.0), W, Inches(1.0),
            "📖", font_size=Pt(52), color=WHITE, align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0), Inches(3.0), W, Inches(1.2),
            "Documentation Improvements",
            font_size=Pt(36), bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(0), Inches(4.1), W, Inches(0.7),
            "4 new pages · 3 rewritten pages · 20 real FAQs",
            font_size=Pt(16), color=rgb(0xBB, 0xD5, 0xF8), align=PP_ALIGN.CENTER)
add_textbox(slide, Inches(10.5), Inches(4.5), Inches(2.5), Inches(2.5),
            "3", font_size=Pt(120), bold=True, color=WHITE)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 11 — New Documentation Pages
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "New Documentation Pages", badge_text="NEW", badge_color=GREEN)

new_pages = [
    (BLUE,   BLUE_LT,   "🤖 LLM Extraction",
     ["Switch to LLM mode & click paragraph blocks",
      "Choose prompt preset and model",
      "Parse LLM output → review entities",
      "Compare with model output side-by-side",
      "Merge selected entities into main annotation"]),
    (GREEN,  GREEN_LT,  "📊 Tables Mode",
     ["Browse detected tables in sidebar",
      "Edit table content (OCR corrections)",
      "Run LLM to convert table to natural language",
      "Drag-and-drop to reorder tables"]),
    (PURPLE, PURPLE_LT, "⚡ Events Mode",
     ["What events are (trigger + arguments)",
      "Filter by paragraph with checkbox dialog",
      "Edit trigger text and argument roles",
      "Confirm and export events"]),
    (ORANGE, ORANGE_LT, "🗺️ Workflow Guide",
     ["The 5-step stepper explained",
      "Optional vs required steps",
      "Guidance banners and how to dismiss",
      "Enable/disable in settings"]),
]
for i, (ac, bg_c, title, bullets) in enumerate(new_pages):
    col = i % 2
    row = i // 2
    body = "\n".join(f"✓  {b}" for b in bullets)
    add_card(slide,
             Inches(0.6 + col * 6.35), Inches(1.25 + row * 2.85),
             Inches(6.1), Inches(2.65),
             title, [body], accent_color=ac, bg_color=bg_c, body_font_size=Pt(12))

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 12 — Rewritten Existing Pages
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "Rewritten Existing Pages", badge_text="UPDATED", badge_color=BLUE)

updated_pages = [
    ("Result Visualization", "3 → 6 modes",
     "Extended \"Change Mode\" section to cover all six working modes (added Events, Tables, LLM) "
     "with cross-links to dedicated pages. Updated layout table to include Workflow Guide."),
    ("Quick-Start Guide", "4 → 6 steps",
     "Rewritten as a proper 6-step tutorial (Sign In → Upload → Open → Follow Workflow Guide → Edit → Export). "
     "Added \"What's next?\" cross-link table for all features."),
    ("FAQ", "Empty → 20 Q&As",
     "Replaced the \"Coming soon\" placeholder with 20 real questions across 6 categories: "
     "General, Documents, Entities/Relations, LLM Extraction, Saving/Exporting, Account."),
]
for i, (title, badge, body) in enumerate(updated_pages):
    y = Inches(1.3 + i * 1.8)
    card_shape = add_rect(slide, Inches(0.6), y, Inches(12.1), Inches(1.65),
                          fill_color=WHITE, line_color=BORDER)
    # left bar
    bar = add_rect(slide, Inches(0.6), y, Inches(0.07), Inches(1.65),
                   fill_color=BLUE, line_color=BLUE)
    # title
    add_textbox(slide, Inches(0.8), y + Inches(0.12), Inches(8.0), Inches(0.4),
                title, font_size=Pt(14), bold=True, color=BLUE)
    # badge pill
    pill = add_rect(slide, Inches(11.0), y + Inches(0.15), Inches(1.5), Inches(0.35),
                    fill_color=BLUE_LT, line_color=BLUE)
    add_text_to_shape(pill, badge, font_size=Pt(11), bold=True, color=BLUE, align=PP_ALIGN.CENTER)
    # body
    add_textbox(slide, Inches(0.8), y + Inches(0.55), Inches(11.7), Inches(0.95),
                body, font_size=Pt(13), color=BLACK)

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 13 — Summary
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "Summary")

# 3 stat boxes
stats = [
    ("6",  "Phases Completed"),
    ("17", "Guidance Banners\nacross 7 Components"),
    ("0",  "New TypeScript\nErrors Introduced"),
]
for i, (num, label) in enumerate(stats):
    sx = Inches(0.6 + i * 4.15)
    box = add_rect(slide, sx, Inches(1.25), Inches(3.9), Inches(1.4),
                   fill_color=WHITE, line_color=BORDER)
    add_textbox(slide, sx, Inches(1.3), Inches(3.9), Inches(0.8),
                num, font_size=Pt(48), bold=True, color=BLUE, align=PP_ALIGN.CENTER)
    add_textbox(slide, sx, Inches(2.1), Inches(3.9), Inches(0.5),
                label, font_size=Pt(11), color=GREY, align=PP_ALIGN.CENTER)

# Two columns
add_textbox(slide, Inches(0.6), Inches(2.85), Inches(5.9), Inches(0.4),
            "New files created", font_size=Pt(14), bold=True, color=BLUE)
new_files = [
    "✓  5 GuidanceSystem TypeScript modules",
    "✓  1 Guidance CSS file",
    "✓  4 documentation markdown pages",
    "✓  1 weekly report slide deck (HTML)",
]
for i, f in enumerate(new_files):
    add_textbox(slide, Inches(0.6), Inches(3.3 + i * 0.55), Inches(5.9), Inches(0.48),
                f, font_size=Pt(13), color=BLACK)

add_textbox(slide, Inches(7.0), Inches(2.85), Inches(5.9), Inches(0.4),
            "Existing files modified", font_size=Pt(14), bold=True, color=BLUE)
mod_files = [
    "✓  7 React components integrated",
    "✓  3 markdown pages rewritten",
    "✓  DocsPage.tsx — 4 new nav entries",
    "✓  App.tsx — GuidanceProvider at root",
]
for i, f in enumerate(mod_files):
    add_textbox(slide, Inches(7.0), Inches(3.3 + i * 0.55), Inches(5.9), Inches(0.48),
                f, font_size=Pt(13), color=BLACK)

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 14 — Potential Next Steps
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
slide_header(slide, "Potential Next Steps")

# Short term column
add_textbox(slide, Inches(0.6), Inches(1.25), Inches(5.9), Inches(0.4),
            "Short term", font_size=Pt(15), bold=True, color=BLUE)

short_items = [
    ("User Testing",
     "Observe first-time users with the guidance system. Identify banners that are confusing or unhelpful."),
    ("Banner Copy Refinement",
     "Improve wording based on feedback; shorten descriptions that are too long."),
    ("Screenshots for New Docs",
     "Add screenshots to the LLM Extraction, Tables, and Events documentation pages."),
]
for i, (title, body) in enumerate(short_items):
    add_card(slide, Inches(0.6), Inches(1.75 + i * 1.65), Inches(5.9), Inches(1.5),
             title, [body], accent_color=GREY, bg_color=GREY_LT, title_color=GREY)

# Future column
add_textbox(slide, Inches(7.0), Inches(1.25), Inches(5.9), Inches(0.4),
            "Future", font_size=Pt(15), bold=True, color=BLUE)

future_items = [
    ("Guided Tour Mode",
     "Step-by-step walkthrough using react-joyride that highlights specific UI elements with overlay."),
    ("Per-Document Progress",
     "Track workflow completion per document ID rather than globally across all documents."),
    ("Onboarding Wizard",
     "A one-time modal for brand-new accounts walking through the core workflow in 3 steps."),
]
for i, (title, body) in enumerate(future_items):
    add_card(slide, Inches(7.0), Inches(1.75 + i * 1.65), Inches(5.9), Inches(1.5),
             title, [body], accent_color=BLUE, bg_color=BLUE_LT)

footer_bar(slide)


# ════════════════════════════════════════════════════════════════════════════
# SLIDE 15 — Thank you
# ════════════════════════════════════════════════════════════════════════════
slide = new_slide()
bg = add_rect(slide, 0, 0, W, H, fill_color=BLUE_DARK)
bg.line.fill.background()

add_textbox(slide, Inches(0.8), Inches(1.8), Inches(11), Inches(0.4),
            "POLYMINDER v3.3 · FEBRUARY 2026",
            font_size=Pt(11), bold=True, color=rgb(0xBB, 0xD5, 0xF8))
add_textbox(slide, Inches(0.8), Inches(2.2), Inches(11), Inches(1.4),
            "Thank you",
            font_size=Pt(52), bold=True, color=WHITE)
add_textbox(slide, Inches(0.8), Inches(3.6), Inches(10), Inches(0.5),
            "Questions welcome.",
            font_size=Pt(18), color=rgb(0xBB, 0xD5, 0xF8))
add_textbox(slide, Inches(0.8), Inches(4.8), Inches(10), Inches(1.2),
            "Truong Dinh Do\n"
            "RIKEN Center for Advanced Intelligence Project / JAIST\n"
            "truongdo@jaist.ac.jp",
            font_size=Pt(14), color=rgb(0x90, 0xA4, 0xAE))

footer_bar(slide)


# ── Save ─────────────────────────────────────────────────────────────────────
out = "/home/truongdo/drive/PhD/RIKEN/source_code/PolyMinder_v3.3/slides/weekly-report.pptx"
prs.save(out)
print(f"Saved: {out}")
