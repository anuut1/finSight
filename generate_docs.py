import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

import pptx
from pptx.util import Inches as PptxInches, Pt as PptxPt
from pptx.dml.color import RGBColor as PptxRGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ---------------------------------------------------------------------------
# COLOR PALETTE
# ---------------------------------------------------------------------------
COLOR_PRIMARY = RGBColor(15, 23, 42)       # Slate 900
COLOR_SECONDARY = RGBColor(30, 41, 59)     # Slate 800
COLOR_ACCENT = RGBColor(99, 102, 241)      # Indigo 500
COLOR_SUCCESS = RGBColor(16, 185, 129)     # Emerald 500
COLOR_MUTED = RGBColor(100, 116, 139)      # Slate 500
COLOR_BG_LIGHT = "F8FAFC"
COLOR_PRIMARY_HEX = "0F172A"
COLOR_ACCENT_HEX = "6366F1"
COLOR_SUCCESS_HEX = "10B981"
COLOR_CARD_BG = "F1F5F9"
COLOR_BORDER = "CBD5E1"

# ---------------------------------------------------------------------------
# DOCX GENERATION
# ---------------------------------------------------------------------------
def set_cell_shading(cell, color_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_callout_box(doc, title, text, accent_hex="6366F1", bg_hex="F8FAFC"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_shading(cell, bg_hex)
    set_cell_margins(cell, top=160, bottom=160, left=200, right=200)
    
    # Left border only
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:left w:val="single" w:sz="36" w:space="0" w:color="{accent_hex}"/>'
        f'  <w:top w:val="none"/>'
        f'  <w:bottom w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.font.name = "Calibri"
    run_t.font.size = Pt(11)
    run_t.font.bold = True
    run_t.font.color.rgb = COLOR_PRIMARY
    
    run_c = p.add_run(text)
    run_c.font.name = "Calibri"
    run_c.font.size = Pt(10)
    run_c.font.color.rgb = COLOR_SECONDARY
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def build_docx_document(output_path):
    doc = docx.Document()
    
    # Page setup - 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
    
    # Document Title Block
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(4)
    run_meta = p_title.add_run("ACADEMIC PEER REVIEW & TECHNICAL DEFENSE\nDEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\n")
    run_meta.font.name = "Calibri"
    run_meta.font.size = Pt(10)
    run_meta.font.bold = True
    run_meta.font.color.rgb = COLOR_MUTED
    
    run_title = p_title.add_run("FinSight: Architecture, Full Feature Suite &\nAmazon Web Services (AWS) Integration\n")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(18)
    run_sub = p_sub.add_run("Comprehensive Technical Audit: Serverless AI OCR Pipelines, S3 Presigned Workflows, Generative Merchant Parsing, and Distributed Debt Minimization")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = COLOR_MUTED
    
    # Academic Roleplay Metadata Table
    meta_tbl = doc.add_table(rows=4, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Reviewing Examiner:", "Professor Antigravity (Chair, Cloud & Distributed Systems)"),
        ("Defending Faculty:", "Faculty Colleague (Department of Software Engineering)"),
        ("Subject Matter:", "FinSight Enterprise Architecture, CloudFormation Stack, and AWS Services"),
        ("Examination Mode:", "Progressive Socratic Viva (Tier 1: Foundational to Tier 4: Defense & Scalability)")
    ]
    for row_idx, (label, val) in enumerate(meta_data):
        row = meta_tbl.rows[row_idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_shading(c0, "F1F5F9")
        set_cell_shading(c1, "FFFFFF")
        set_cell_margins(c0, top=80, bottom=80, left=120, right=120)
        set_cell_margins(c1, top=80, bottom=80, left=120, right=120)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(label)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = COLOR_PRIMARY
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(val)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_SECONDARY
        
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # -----------------------------------------------------------------------
    # SECTION 1: EXECUTIVE OVERVIEW & APPLICATION PURPOSE
    # -----------------------------------------------------------------------
    h1 = doc.add_heading("1. Executive Overview & System Purpose", level=1)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(6)
    
    doc.add_paragraph(
        "FinSight is a production-grade full-stack personal and collaborative finance intelligence system. "
        "Unlike conventional expense trackers that burden the user with manual data entry and fragmented ledgers, "
        "FinSight introduces an automated end-to-end financial lifecycle. It combines synchronous low-latency "
        "web technologies with asynchronous cloud computing services on Amazon Web Services (AWS) to solve three "
        "cardinal friction points in personal wealth management:"
    )
    
    bullets = [
        ("Automated Receipt Ingestion (Zero-Friction Capture):", " Users upload physical or digital receipts. In under 2 seconds, AWS Textract parses itemized line-items, taxes, and vendor data into draft transactions without overloading server RAM."),
        ("Cryptic SMS & UPI Normalization:", " Raw Indian banking SMS alerts and unstructured UPI narration strings (e.g., 'UPI/4289192837/SWIGGY5281/swiggy@icici') are cleansed into human-readable merchant names and accurate budget categories using Amazon Bedrock foundation models with deterministic regex fallbacks."),
        ("Collaborative Group & Trip Settlements (Graph Optimization):", " Splitwise-style group ledgers and dedicated Vacation/Trip Modes track multi-currency shared expenses, reduce N-person pairwise debt networks from O(N²) down to minimal O(N) settlements, and generate dynamic NPCI-compliant UPI QR codes and deep-links.")
    ]
    for b_title, b_desc in bullets:
        p_b = doc.add_paragraph(style='List Bullet')
        p_b.paragraph_format.space_after = Pt(4)
        rb_t = p_b.add_run(b_title)
        rb_t.font.bold = True
        rb_t.font.color.rgb = COLOR_PRIMARY
        rb_c = p_b.add_run(b_desc)
        rb_c.font.color.rgb = COLOR_SECONDARY
        
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -----------------------------------------------------------------------
    # SECTION 2: SYSTEM ARCHITECTURE & AWS TOPOLOGY
    # -----------------------------------------------------------------------
    h2 = doc.add_heading("2. System Architecture & AWS Infrastructure Topology", level=1)
    h2.paragraph_format.space_before = Pt(16)
    h2.paragraph_format.space_after = Pt(6)
    
    doc.add_paragraph(
        "FinSight is architected as a hybrid decoupled distributed system. The client tier is a single-page application "
        "built on React 18 and Vite. The backend is an Express.js REST application operating on Node.js 20, containerized via "
        "Docker and deployed on AWS App Runner with MongoDB Atlas as the primary persistence layer. Below is the complete "
        "inventory of AWS services wired into the application:"
    )
    
    aws_table = doc.add_table(rows=9, cols=3)
    aws_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["AWS Service", "Integration Point in Codebase", "Functional Responsibility & Security Architecture"]
    hdr_row = aws_table.rows[0]
    for idx, name in enumerate(headers):
        c = hdr_row.cells[idx]
        set_cell_shading(c, COLOR_PRIMARY_HEX)
        set_cell_margins(c, top=100, bottom=100, left=120, right=120)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(name)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    aws_services_data = [
        ("Amazon Textract", "server/services/textractService.js", "AnalyzeExpenseCommand: Extracts vendor, line items, taxes, subtotal, date, and confidence scores from receipt images/PDFs."),
        ("Amazon S3", "server/services/s3Service.js", "Private bucket (finsight-receipts-private) with 30-day lifecycle auto-expiry. Pre-signed PutObject URLs (15m) and GetObject URLs (1h)."),
        ("Amazon Bedrock", "server/services/bedrockService.js", "Amazon Titan Text Express v1: Cleans raw banking SMS alerts and UPI strings into clean merchant entities and expense categories."),
        ("Amazon SES", "server/services/emailService.js", "Simple Email Service: Delivers responsive HTML End-of-Day expense digests and cryptographically signed one-tap Magic Link approval URLs."),
        ("Amazon SNS", "server/services/eodReminderService.js", "Simple Notification Service: Transmits urgent SMS alerts and notifications for critical budget overruns and trip settlement prompts."),
        ("AWS EventBridge", "server/aws/eodReminderLambda/", "Cron Scheduler: Triggers daily automated review at 21:00 UTC, invoking the serverless Lambda reminder orchestrator."),
        ("AWS Lambda", "server/aws/eodReminderLambda/index.js", "Node.js 20 micro-container: Securely bridges EventBridge triggers with FinSight's internal API using shared REMINDER_SECRET_KEY."),
        ("AWS App Runner & ECR", "server/aws/cloudformation-full-stack.yaml", "Fully managed container orchestration pulling from Amazon ECR, auto-scaling instances with attached IAM task execution roles.")
    ]
    
    for row_idx, data in enumerate(aws_services_data, start=1):
        row = aws_table.rows[row_idx]
        bg = "FFFFFF" if row_idx % 2 != 0 else "F8FAFC"
        for col_idx, text in enumerate(data):
            cell = row.cells[col_idx]
            set_cell_shading(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_ACCENT
            else:
                r.font.color.rgb = COLOR_SECONDARY
                
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    create_callout_box(
        doc,
        "Architectural Guardrail: The Zero-RAM Direct Ingestion Principle",
        "A common design flaw in modern web apps is piping large image uploads directly through Node.js Express memory buffers. "
        "In FinSight, when a client uploads a receipt, the backend issues an AWS S3 pre-signed upload URL. The browser pushes the binary "
        "directly to the encrypted private S3 bucket. The backend then instructs Textract to analyze the S3 object reference directly. "
        "This completely decouples user upload bandwidth from server memory, preserving compute scalability.",
        accent_hex=COLOR_SUCCESS_HEX
    )

    # -----------------------------------------------------------------------
    # SECTION 3: CORE APPLICATION FEATURE SUITE
    # -----------------------------------------------------------------------
    h3 = doc.add_heading("3. Exhaustive Feature Matrix", level=1)
    h3.paragraph_format.space_before = Pt(16)
    h3.paragraph_format.space_after = Pt(6)
    
    features = [
        ("1. Dynamic Financial Dashboard & 50/30/20 Budgeting:", 
         "Real-time liquidity and wealth tracking with interactive MonthRing visual progress gauges, categorizing capital into Needs (50%), Wants (30%), and Investments/Savings (20%). Includes tabular cash-flow breakdowns and burn-rate velocity metrics."),
        ("2. Natural Language Quick-Add & Rule Engine:", 
         "Enables users to type conversational expense statements (e.g., 'Spent ₹850 at Blue Tokai yesterday for coffee'). A deterministic tokenizer and regex parsing engine identifies amounts, relative date offsets, and mapped spending categories in under 15ms."),
        ("3. AI Receipt Scanner with Draft Ledger Integrity:", 
         "Receipt scans are initially marked as `status: 'draft'`, strictly excluding unverified OCR extractions from monthly balance aggregates and financial charts. Users inspect line-item breakdowns, review low-confidence flags (<80%), edit quantities, and approve drafts with one click."),
        ("4. SMS & Bank Alert Parser:", 
         "Captures raw unformatted transaction SMS notifications from Indian banks (HDFC, ICICI, SBI, Axis). Utilizes Amazon Bedrock (Titan Foundation Model) or local regex tokenizers to extract transaction amounts, merchant handles, and transaction reference numbers."),
        ("5. Splits Module & Trip Mode (Collaborative Multi-Currency):", 
         "Allows groups of roommates, colleagues, or travelers to log shared expenses. Trip Mode locks down active travel budgets, handles foreign currencies (USD, EUR, GBP, AED, THB), and calculates per-person fair share balances."),
        ("6. Graph-Theoretic Debt Simplification:", 
         "Implements a greedy bipartite balance elimination algorithm. Computes net individual balances (Credits vs Debts) and executes a two-pointer matching traversal, collapsing complex circular debts into the minimum mathematical number of direct transactions."),
        ("7. Dynamic NPCI-Compliant UPI QR Codes & Deep-Links:", 
         "Eliminates payment friction for Indian banking networks. Generates live, scannable QR codes complying with the National Payments Corporation of India (NPCI) UPI specification (`upi://pay?pa=...&pn=...&am=...&cu=INR`). Offers one-tap deep linking to GPay, PhonePe, Paytm, and BHIM."),
        ("8. Serverless End-of-Day Reminders & One-Tap Magic Links:", 
         "Dispatches daily automated email digests via Amazon SES at 9:00 PM for pending receipt drafts. Includes a cryptographically signed HMAC-SHA256 JWT magic link token allowing immediate one-tap draft approval directly from the user's inbox without requiring a password prompt.")
    ]
    
    for f_title, f_desc in features:
        p_f = doc.add_paragraph()
        p_f.paragraph_format.space_after = Pt(6)
        rf_t = p_f.add_run(f_title + " ")
        rf_t.font.name = "Calibri"
        rf_t.font.size = Pt(10.5)
        rf_t.font.bold = True
        rf_t.font.color.rgb = COLOR_PRIMARY
        rf_d = p_f.add_run(f_desc)
        rf_d.font.name = "Calibri"
        rf_d.font.size = Pt(10)
        rf_d.font.color.rgb = COLOR_SECONDARY
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -----------------------------------------------------------------------
    # SECTION 4: THE SOCRATIC PROFESSOR-FACULTY VIVA (EASY TO HARD)
    # -----------------------------------------------------------------------
    h4 = doc.add_heading("4. Socratic Peer Review: The Faculty Technical Defense", level=1)
    h4.paragraph_format.space_before = Pt(16)
    h4.paragraph_format.space_after = Pt(6)
    
    doc.add_paragraph(
        "The following dialogue transcribes the technical defense of the FinSight architecture. "
        "The examination progresses methodically across four difficulty tiers: Foundational, Operational, "
        "System Engineering, and Expert Faculty Defense."
    )
    
    qa_list = [
        # TIER 1: FOUNDATIONAL
        ("TIER 1: FOUNDATIONAL (EASY)", [
            (
                "Professor Antigravity:",
                "Colleague, welcome to the technical review. Let us begin with the basics. Walk me through the high-level architecture of FinSight and explain what fundamental operational problem it solves for the modern user.",
                "Faculty Member (Defense):",
                "Thank you, Professor. At its core, FinSight is a decoupled full-stack application built on React 18 (Vite) on the frontend, an Express.js Node.js 20 backend, and MongoDB Atlas. "
                "The core problem it addresses is 'expense tracking fatigue'. Most financial applications require users to manually input individual amounts, categories, and dates. "
                "FinSight eliminates this by automating transaction capture across three modalities: natural language statements, camera-captured physical receipts via cloud OCR, and unstructured bank SMS notifications. "
                "It bridges personal accounting with collaborative group ledgers, unifying single-user budgeting with multi-member trip and split settlement networks."
            ),
            (
                "Professor Antigravity:",
                "Which specific AWS services are wired into your backend service layer, and why did you choose AWS over third-party SaaS APIs?",
                "Faculty Member (Defense):",
                "We integrated seven AWS services: Amazon Textract for receipt OCR, Amazon S3 for private document storage, Amazon Bedrock for foundation-model text enrichment, Amazon SES for transactional email digests, Amazon SNS for SMS notifications, AWS EventBridge for scheduled cron events, and AWS Lambda for serverless execution. "
                "We selected AWS over disparate SaaS APIs (such as SendGrid or third-party OCR vendors) because of centralized Identity and Access Management (IAM), unified cloud billing, high compliance standards, and native VPC/App Runner connectivity."
            ),
            (
                "Professor Antigravity:",
                "Explain the client authentication flow. How does the frontend maintain state across page refreshes, and how are API requests authenticated?",
                "Faculty Member (Defense):",
                "Authentication is governed by stateless JSON Web Tokens (JWT). Upon successful login or registration via `/api/v1/auth`, the server issues a signed JWT containing the user ID and email. "
                "The React client stores this token in localStorage and synchronizes it via an `AuthContext` provider. "
                "An Axios HTTP request interceptor (`client/src/api/axios.js`) automatically attaches this token to the `Authorization: Bearer <token>` header of every outgoing request. "
                "On initial page load, the client invokes `/api/v1/auth/me` to validate token integrity and re-hydrate user profile state. If the token is invalid or expired, the interceptor redirects the user to `/login`."
            ),
            (
                "Professor Antigravity:",
                "In your latest release, you added dynamic UPI payment QR codes and deep-links in the Splits module. How does this feature function from a user and protocol standpoint?",
                "Faculty Member (Defense):",
                "We engineered `UpiSettlementModal.jsx` utilizing the official NPCI UPI URL specifications (`upi://pay?pa=<VPA>&pn=<Name>&am=<Amount>&cu=INR&tn=<Note>`). "
                "When a user needs to settle a debt in a group or trip, clicking '⚡ Settle via UPI' generates an inline, high-contrast QR code using the `qrcode` library for desktop users to scan with any UPI app (GPay, PhonePe, Paytm). "
                "For mobile users, it provides a native deep-link button that directly launches installed UPI apps with the recipient VPA and exact amount pre-populated. "
                "Once the transaction completes, a single tap records the settlement into the group ledger, updating balances across all members in real time."
            )
        ]),
        
        # TIER 2: INTERMEDIATE
        ("TIER 2: INTERMEDIATE (OPERATIONAL)", [
            (
                "Professor Antigravity:",
                "Let us examine the receipt scanner. Why did you choose pre-signed S3 upload URLs rather than having the Express backend accept multipart file uploads directly?",
                "Faculty Member (Defense):",
                "Allowing direct multipart file uploads to Node.js has severe operational drawbacks. A 10MB receipt image uploaded concurrently by 50 users would consume 500MB of RAM on the Express server process, causing garbage collection spikes, event loop starvation, and potential Node.js process crashes. "
                "By using `s3Service.generateReceiptUploadUrl()`, the client requests an authorized pre-signed URL generated via `@aws-sdk/s3-request-presigner` with a 15-minute expiration. "
                "The browser pushes the binary directly to the encrypted S3 bucket via HTTP PUT. The Express server only receives lightweight JSON containing the S3 bucket and object key. "
                "This achieves Zero-RAM ingestion on our backend."
            ),
            (
                "Professor Antigravity:",
                "How does Amazon Textract's `AnalyzeExpenseCommand` operate under the hood, and how does your backend parser translate its output into structured database entries?",
                "Faculty Member (Defense):",
                "Unlike generic OCR tools that output unorganized text lines, Textract's `AnalyzeExpenseCommand` uses machine learning models trained specifically on commercial invoices and receipts. "
                "Its response separates data into `SummaryFields` (Vendor Name, Total, Subtotal, Tax, Date) and `LineItemGroups` (LineItems with individual item names, quantities, and prices). "
                "In `textractService.js`, our `extractFromTextractResponse` function normalizes currency symbols, standardizes date formats into ISO 8601 (`YYYY-MM-DD`), maps merchant names to spending categories via `inferCategoryFromMerchant`, and extracts individual line-items. "
                "It also inspects OCR detection confidence; any field with confidence below 80% is flagged in `lowConfidenceItems` for explicit user review."
            ),
            (
                "Professor Antigravity:",
                "What failsafe mechanisms exist if Textract encounters an unreadable receipt, missing summary totals, or unsupported image formats?",
                "Faculty Member (Defense):",
                "We implemented a defense-in-depth validation and fallback protocol. First, `validateReceiptInput` inspects MIME types before making AWS calls, rejecting unsupported formats like HEIC or WebP with clear 400 errors, and enforcing the 10MB AWS synchronous limit. "
                "Second, if Textract fails to detect summary fields (such as a smudged Total), our parser computes a mathematical fallback: `total = subtotal + tax`, where subtotal is derived from the sum of detected line-items. "
                "Third, if zero line items are detected, the system throws a structured `NO_ITEMS_DETECTED` 422 error. "
                "Fourth, every scan is initially saved in MongoDB with `status: 'draft'`, completely isolating pending scans from the user's active analytics and monthly budget calculations until verified."
            ),
            (
                "Professor Antigravity:",
                "Explain the role of Amazon Bedrock in your text enrichment pipeline. What occurs if Bedrock experiences latency spikes or service throttling?",
                "Faculty Member (Defense):",
                "Amazon Bedrock hosts foundation models (specifically `amazon.titan-text-express-v1`). In `bedrockService.js`, we invoke Bedrock to transform cryptic banking SMS notifications—which frequently contain obfuscated merchant names like `UPI/4289192837/SWIGGY5281/swiggy@icici/Bengaluru`—into clean entity labels ('Swiggy') and budget categories ('Food & Dining'). "
                "However, recognizing that LLMs can introduce latency or encounter API rate limits, we built `fallbackRuleBasedClean()`. "
                "If Bedrock times out or throws an error, execution gracefully falls back to deterministic regex patterns that strip UPI VPA handles, reference numbers, and bank codes in less than 2 milliseconds. The user experience is never interrupted."
            )
        ]),

        # TIER 3: ADVANCED
        ("TIER 3: ADVANCED (SYSTEM ENGINEERING)", [
            (
                "Professor Antigravity:",
                "Let us discuss your serverless background processing. Walk me through the End-of-Day reminder pipeline involving EventBridge, Lambda, and SES/SNS. How is this secured against unauthorized execution?",
                "Faculty Member (Defense):",
                "Every evening at 21:00 UTC, an AWS EventBridge cron rule (`cron(0 21 * * ? *)`) triggers a lightweight Node.js Lambda function (`eodReminderLambda`). "
                "This Lambda issues an authenticated HTTPS POST request to the FinSight backend endpoint `/api/v1/transactions/automation/eod-reminder`. "
                "To secure this against public abuse, the endpoint validates an `x-reminder-secret` header against a shared `REMINDER_SECRET_KEY` stored in AWS environment variables. "
                "Upon validation, the backend queries MongoDB for all users with pending receipt drafts created that day. "
                "For each user, it compiles an itemized HTML digest and dispatches it via Amazon SES (`SendEmailCommand`) using a shared, persistent client singleton. Critical alerts can also route to Amazon SNS for SMS transmission."
            ),
            (
                "Professor Antigravity:",
                "In the EOD email digest, you provide a one-tap Magic Link approval. How does this authenticate the user without requiring a password, and what prevents replay attacks or unauthorized approvals?",
                "Faculty Member (Defense):",
                "The magic link is governed by a cryptographically signed HMAC-SHA256 JWT generated in `eodReminderService.generateApprovalToken()`. "
                "The payload embeds three explicit claims: the user's `userId`, an array of specific `draftIds` eligible for approval, and the action identifier `'approve_drafts'`. "
                "It is signed with the server's private `JWT_SECRET` and has an aggressive expiration window of 48 hours. "
                "When clicked, the client reaches `/api/v1/auth/magic-status` and verifies the token. The backend verifies that the transactions still possess `status: 'draft'`, changes them to `'cleared'`, and links them to the verified user. "
                "Once approved, replaying the link has zero effect because the specified drafts are no longer in draft status."
            ),
            (
                "Professor Antigravity:",
                "Let us examine your algorithmic contributions. In the Splits module, explain how your debt simplification algorithm operates mathematically. What is its computational complexity?",
                "Faculty Member (Defense):",
                "In an unsimplified group ledger with N members, pairwise debts scale quadratically at O(N²). For example, 10 friends can generate up to 45 pairwise debts, creating confusion and multiple circular transfers. "
                "Our simplification algorithm in `splitController.js` models this as a balance reduction problem: "
                "1. We calculate each member's net cash position: `NetBalance = TotalPaid - TotalOwed`. Members with NetBalance > 0 are Creditors; members with NetBalance < 0 are Debtors; members with NetBalance == 0 are eliminated. "
                "2. We sort Creditors descending and Debtors ascending by absolute debt. "
                "3. Using a two-pointer greedy matching approach, we match the largest debtor with the largest creditor. The settled amount is `min(|Debtor|, Creditor)`. "
                "4. We adjust balances and advance pointers until all debts are resolved. "
                "This collapses O(N²) complex circular relationships into at most N - 1 discrete payments (O(N) transactions), guaranteeing minimal friction."
            ),
            (
                "Professor Antigravity:",
                "Explain your MongoDB indexing strategy. How do compound indexes ensure query performance as transaction tables scale into millions of records?",
                "Faculty Member (Defense):",
                "In high-scale financial databases, unindexed queries cause full collection scans that saturate CPU and memory. In our `Transaction.js` Mongoose schema, we established targeted compound indexes: "
                "`{ userId: 1, date: -1 }` and `{ userId: 1, status: 1 }`. "
                "The first index optimizes the primary ledger feed: MongoDB performs an index scan filtered by the authenticated user and immediately returns reverse-chronological documents without an in-memory sort stage. "
                "The second index optimizes analytics and EOD draft processing: queries filtering `status: 'cleared'` for monthly budget summaries or `status: 'draft'` for reminder batches locate relevant records in logarithmic time O(log N). "
                "Furthermore, split group lookups leverage indexed arrays on `{ 'members.user': 1 }` to prevent table scans during group hydration."
            )
        ]),

        # TIER 4: EXPERT / FACULTY DEFENSE
        ("TIER 4: EXPERT / FACULTY DEFENSE & SCALABILITY", [
            (
                "Professor Antigravity:",
                "Now, Colleague, defend your high-level infrastructure design. Why did you choose AWS App Runner rather than a fully serverless Lambda (Serverless Express) architecture or an Amazon ECS Fargate cluster?",
                "Faculty Member (Defense):",
                "This was a deliberate engineering trade-off. AWS Lambda with Serverless Express suffers from cold starts (often 1.5 to 3 seconds for Node.js runtimes initializing Mongoose connections and AWS SDK singletons), which severely harms real-time interactive user experience. "
                "Furthermore, maintaining persistent MongoDB connection pools in ephemeral Lambda containers frequently causes connection exhaustion on database clusters. "
                "Conversely, Amazon ECS Fargate requires managing VPC subnets, Application Load Balancers, Target Groups, Auto Scaling Policies, and ECS Task Definitions—introducing excessive operational overhead for a lean engineering team. "
                "AWS App Runner provides the exact sweet spot: it is fully managed, natively autoscaling, runs our standard Docker image directly from ECR, maintains persistent database connection pools, supports automatic SSL termination, and eliminates cold starts while reducing infrastructure management overhead."
            ),
            (
                "Professor Antigravity:",
                "Analyze the security architecture of your frontend distribution. How does CloudFront with Origin Access Control (OAC) safeguard the static S3 bucket, and why is this superior to legacy Origin Access Identity (OAI)?",
                "Faculty Member (Defense):",
                "Our CloudFormation stack (`cloudformation-full-stack.yaml`) provisions a private S3 bucket (`finsight-web`) for static assets. Public read access on the bucket is strictly blocked (`BlockPublicAcls: true`, `IgnorePublicAcls: true`, `BlockPublicPolicy: true`, `RestrictPublicBuckets: true`). "
                "Access is granted exclusively to CloudFront via Origin Access Control (`AWS::CloudFront::OriginAccessControl`). "
                "OAC is superior to legacy OAI for three critical reasons: "
                "1. Cryptographic Security: OAC uses AWS Signature Version 4 (SigV4) to authenticate requests between CloudFront and S3. "
                "2. KMS Encryption Support: OAC seamlessly supports server-side encryption with AWS KMS (SSE-KMS) customer-managed keys, which OAI could not. "
                "3. Granular Scoping: S3 bucket policies can restrict access precisely to CloudFront distributions matching `AWS:SourceArn: arn:aws:cloudfront::<Account>:distribution/<DistId>`, completely neutralizing confused-deputy attacks."
            ),
            (
                "Professor Antigravity:",
                "In a collaborative multi-tenant system like the Splits module, how do you prevent data leakage and horizontal privilege escalation between users?",
                "Faculty Member (Defense):",
                "We enforce multi-tenant authorization at the database query layer rather than relying on application-level filtering. "
                "In `splitAccess.js`, every group query explicitly validates membership: `find({ _id: groupId, 'members.user': req.user._id })`. "
                "If a malicious user submits a request referencing another group's ID, the query returns null, resulting in an immediate 404/403. "
                "Furthermore, settlements and expense creations validate that the submitting user is an active registered participant of that specific split group. "
                "Transactions generated from group splits maintain a bidirectional foreign key reference, ensuring that personal ledger entries cannot be mutated without group consensus."
            ),
            (
                "Professor Antigravity:",
                "Suppose FinSight experiences a sudden 100x traffic spike—such as 50,000 corporate users uploading receipts at month-end. Where will your system break first, and what architectural evolution would you recommend?",
                "Faculty Member (Defense):",
                "Under a 100x spike, our primary bottleneck would not be S3 uploads (which scale infinitely with pre-signed URLs) or App Runner compute (which scales out horizontally). "
                "The first bottleneck would be Amazon Textract API concurrency quotas (default account limits are typically 10 to 20 transactions per second for synchronous `AnalyzeExpense`). Synchronous calls would be throttled with `ProvisionedThroughputExceededException`. "
                "The second bottleneck would be MongoDB write throughput on transaction collections. "
                "To harden the system for this scale, I would evolve the architecture to an asynchronous queue-based model: "
                "1. Client uploads receipt to S3. S3 generates an `s3:ObjectCreated` event that publishes to an Amazon SQS FIFO queue. "
                "2. An asynchronous worker pool pulls from SQS, calls Textract using asynchronous `StartExpenseAnalysis` and `GetExpenseAnalysis`, and writes results to a Redis cache. "
                "3. The client receives a job ID and connects via WebSocket or Server-Sent Events (SSE) to receive real-time completion notifications. This prevents HTTP connection timeouts and guarantees resilient backpressure control."
            )
        ])
    ]
    
    for tier_title, pairs in qa_list:
        h_tier = doc.add_heading(tier_title, level=2)
        h_tier.paragraph_format.space_before = Pt(14)
        h_tier.paragraph_format.space_after = Pt(6)
        
        for q_speaker, q_text, a_speaker, a_text in pairs:
            # Question Card
            tbl_q = doc.add_table(rows=1, cols=1)
            tbl_q.alignment = WD_TABLE_ALIGNMENT.CENTER
            c_q = tbl_q.cell(0, 0)
            set_cell_shading(c_q, "0F172A")
            set_cell_margins(c_q, top=100, bottom=100, left=140, right=140)
            
            p_q = c_q.paragraphs[0]
            p_q.paragraph_format.space_after = Pt(2)
            rq_s = p_q.add_run(f"👨‍🏫 {q_speaker}\n")
            rq_s.font.bold = True
            rq_s.font.size = Pt(10)
            rq_s.font.color.rgb = RGBColor(16, 185, 129)
            
            rq_t = p_q.add_run(f'"{q_text}"')
            rq_t.font.italic = True
            rq_t.font.size = Pt(10)
            rq_t.font.color.rgb = RGBColor(255, 255, 255)
            
            # Answer Card
            tbl_a = doc.add_table(rows=1, cols=1)
            tbl_a.alignment = WD_TABLE_ALIGNMENT.CENTER
            c_a = tbl_a.cell(0, 0)
            set_cell_shading(c_a, "F8FAFC")
            set_cell_margins(c_a, top=120, bottom=120, left=160, right=160)
            
            # Left accent border for answer
            tcPr = c_a._tc.get_or_add_tcPr()
            borders = parse_xml(
                f'<w:tcBorders {nsdecls("w")}>'
                f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{COLOR_ACCENT_HEX}"/>'
                f'  <w:top w:val="none"/>'
                f'  <w:bottom w:val="none"/>'
                f'  <w:right w:val="none"/>'
                f'</w:tcBorders>'
            )
            tcPr.append(borders)
            
            p_a = c_a.paragraphs[0]
            p_a.paragraph_format.space_after = Pt(2)
            ra_s = p_a.add_run(f"🎓 {a_speaker}\n")
            ra_s.font.bold = True
            ra_s.font.size = Pt(10)
            ra_s.font.color.rgb = COLOR_PRIMARY
            
            ra_t = p_a.add_run(a_text)
            ra_t.font.size = Pt(9.5)
            ra_t.font.color.rgb = COLOR_SECONDARY
            
            doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -----------------------------------------------------------------------
    # SECTION 5: PROFESSOR'S VERDICT & RUBRIC
    # -----------------------------------------------------------------------
    h5 = doc.add_heading("5. Professor's Evaluation, Scoring & Academic Verdict", level=1)
    h5.paragraph_format.space_before = Pt(16)
    h5.paragraph_format.space_after = Pt(6)
    
    rubric_tbl = doc.add_table(rows=5, cols=3)
    rubric_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    r_headers = ["Evaluation Criterion", "Assigned Score", "Examiner Observations"]
    for idx, h in enumerate(r_headers):
        c = rubric_tbl.rows[0].cells[idx]
        set_cell_shading(c, COLOR_PRIMARY_HEX)
        set_cell_margins(c, top=80, bottom=80, left=100, right=100)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    rubric_data = [
        ("Architecture & Scalability", "9.5 / 10", "Exemplary decoupling via S3 pre-signed URLs and App Runner managed containers. Clear zero-RAM ingestion design."),
        ("AWS Service Breadth & Depth", "9.8 / 10", "Outstanding integration across 7 native services: Textract, Bedrock, S3, SES, SNS, EventBridge, and Lambda."),
        ("Security & Least Privilege IAM", "9.2 / 10", "Strong CloudFront OAC implementation, HMAC-SHA256 magic links, and scoped App Runner task execution roles."),
        ("Algorithmic Rigor & Innovation", "9.5 / 10", "Graph-theoretic debt simplification algorithm and NPCI-compliant dynamic UPI QR generation demonstrate technical mastery.")
    ]
    for row_idx, (crit, score, obs) in enumerate(rubric_data, start=1):
        row = rubric_tbl.rows[row_idx]
        for col_idx, val in enumerate([crit, score, obs]):
            cell = row.cells[col_idx]
            set_cell_shading(cell, "FFFFFF" if row_idx % 2 != 0 else "F8FAFC")
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.size = Pt(9)
            if col_idx == 1:
                r.font.bold = True
                r.font.color.rgb = COLOR_SUCCESS
            elif col_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_PRIMARY
            else:
                r.font.color.rgb = COLOR_SECONDARY
                
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    verdict_text = (
        "FINAL VERDICT: UNANIMOUS HIGH DISTINCTION (A+ / 9.5 out of 10)\n\n"
        "The candidate has successfully defended the FinSight technical architecture. "
        "The application demonstrates professional-tier cloud engineering, thoughtful architectural decoupling, "
        "comprehensive error mitigation, and seamless AWS native integration. "
        "The project is certified ready for enterprise deployment and production scaling."
    )
    create_callout_box(doc, "Official Examination Board Resolution", verdict_text, accent_hex=COLOR_SUCCESS_HEX, bg_hex="ECFDF5")
    
    doc.save(output_path)
    print(f"Word document successfully created: {output_path}")

# ---------------------------------------------------------------------------
# PPTX GENERATION
# ---------------------------------------------------------------------------
def add_slide_header(slide, title_text, category_text="FINSIGHT ARCHITECTURE & AWS INTEGRATION"):
    # Header Banner
    top_box = slide.shapes.add_textbox(PptxInches(0.8), PptxInches(0.4), PptxInches(11.7), PptxInches(1.0))
    tf = top_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    p_cat = tf.paragraphs[0]
    p_cat.text = category_text.upper()
    p_cat.font.size = PptxPt(9.5)
    p_cat.font.bold = True
    p_cat.font.color.rgb = PptxRGBColor(99, 102, 241) # Indigo
    
    p_title = tf.add_paragraph()
    p_title.text = title_text
    p_title.font.size = PptxPt(20)
    p_title.font.bold = True
    p_title.font.color.rgb = PptxRGBColor(15, 23, 42) # Slate 900

def create_card_shape(slide, left, top, width, height, bg_rgb, border_rgb=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_rgb
    if border_rgb:
        shape.line.color.rgb = border_rgb
        shape.line.width = PptxPt(1.5)
    else:
        shape.line.fill.background()
    return shape

def build_pptx_deck(output_path):
    prs = pptx.Presentation()
    prs.slide_width = PptxInches(13.333)
    prs.slide_height = PptxInches(7.5)
    blank_layout = prs.slide_layouts[6]
    
    # SLIDE 1: TITLE SLIDE (Dark Navy)
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = create_card_shape(s1, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(7.5), PptxRGBColor(15, 23, 42))
    
    tb1 = s1.shapes.add_textbox(PptxInches(1.2), PptxInches(1.8), PptxInches(10.9), PptxInches(4.0))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    
    p_badge = tf1.paragraphs[0]
    p_badge.text = "FACULTY PEER REVIEW & CLOUD ARCHITECTURE AUDIT"
    p_badge.font.size = PptxPt(11)
    p_badge.font.bold = True
    p_badge.font.color.rgb = PptxRGBColor(16, 185, 129)
    
    p_main = tf1.add_paragraph()
    p_main.text = "FinSight: Enterprise Architecture,\nFeature Suite & AWS Integration"
    p_main.font.size = PptxPt(36)
    p_main.font.bold = True
    p_main.font.color.rgb = PptxRGBColor(255, 255, 255)
    
    p_sub = tf1.add_paragraph()
    p_sub.text = "A Socratic Defense: From Foundational Architecture to Advanced Serverless Engineering"
    p_sub.font.size = PptxPt(15)
    p_sub.font.color.rgb = PptxRGBColor(148, 163, 184)
    
    p_meta = tf1.add_paragraph()
    p_meta.text = "Reviewer: Professor Antigravity (Cloud Chair)  |  Presenter: Faculty Colleague (Software Engineering)"
    p_meta.font.size = PptxPt(11)
    p_meta.font.bold = True
    p_meta.font.color.rgb = PptxRGBColor(99, 102, 241)

    # SLIDE 2: THE PROBLEM & FINSIGHT SOLUTION
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_header(s2, "Executive Problem Statement & Core Value Proposition")
    
    # Left Card: The Problem
    create_card_shape(s2, PptxInches(0.8), PptxInches(1.6), PptxInches(5.6), PptxInches(5.2), PptxRGBColor(254, 242, 242), PptxRGBColor(248, 113, 113))
    tb_prob = s2.shapes.add_textbox(PptxInches(1.1), PptxInches(1.8), PptxInches(5.0), PptxInches(4.8))
    tf_prob = tb_prob.text_frame
    tf_prob.word_wrap = True
    
    p = tf_prob.paragraphs[0]
    p.text = "⚠️ THE EXPENSE TRACKING FRICTION"
    p.font.bold = True
    p.font.size = PptxPt(14)
    p.font.color.rgb = PptxRGBColor(185, 28, 28)
    
    bullets_p = [
        ("Manual Data Entry Fatigue:", " Users abandon finance apps because manually keying amounts, merchants, and dates takes too long."),
        ("Cryptic Bank SMS & Narrations:", " Transaction logs fill up with confusing text like 'UPI/4289192837/SWIGGY5281' rather than clean merchant names."),
        ("Fragmented Split Ledgers:", " Vacations and group outings result in chaotic circular debts, multiple transfer fees, and awkward follow-ups."),
        ("No Automated Reconciliation:", " Receipts sit unrecorded in camera rolls, distorting monthly budget calculations.")
    ]
    for b_title, b_desc in bullets_p:
        p = tf_prob.add_paragraph()
        p.text = f"• {b_title} {b_desc}"
        p.font.size = PptxPt(11.5)
        p.font.color.rgb = PptxRGBColor(51, 65, 85)
        
    # Right Card: The FinSight Solution
    create_card_shape(s2, PptxInches(6.8), PptxInches(1.6), PptxInches(5.7), PptxInches(5.2), PptxRGBColor(236, 253, 245), PptxRGBColor(52, 211, 153))
    tb_sol = s2.shapes.add_textbox(PptxInches(7.1), PptxInches(1.8), PptxInches(5.1), PptxInches(4.8))
    tf_sol = tb_sol.text_frame
    tf_sol.word_wrap = True
    
    p = tf_sol.paragraphs[0]
    p.text = "✨ THE FINSIGHT ARCHITECTURAL SOLUTION"
    p.font.bold = True
    p.font.size = PptxPt(14)
    p.font.color.rgb = PptxRGBColor(4, 120, 87)
    
    bullets_s = [
        ("Zero-RAM S3 Direct Uploads:", " Upload receipts directly to private S3 buckets; analyzed by Amazon Textract in under 2 seconds."),
        ("Generative AI SMS Cleansing:", " Amazon Bedrock Titan Model automatically decodes banking strings into clean merchant and budget categories."),
        ("Graph-Theoretical Settlements:", " Collapses O(N²) complex group balances into minimal O(N) payment paths with zero circular transfers."),
        ("NPCI-Compliant UPI Engine:", " Dynamic QR codes and one-tap deep-links for instant settlement via Google Pay, PhonePe, and Paytm."),
        ("Stateless EOD Magic Links:", " HMAC-SHA256 tokens let users approve pending receipt drafts directly from daily email digests.")
    ]
    for b_title, b_desc in bullets_s:
        p = tf_sol.add_paragraph()
        p.text = f"• {b_title} {b_desc}"
        p.font.size = PptxPt(11.5)
        p.font.color.rgb = PptxRGBColor(51, 65, 85)

    # SLIDE 3: SYSTEM TOPOLOGY & AWS CLOUD ECOSYSTEM
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_header(s3, "Comprehensive AWS Cloud Services Topology")
    
    services = [
        ("Amazon Textract", "AnalyzeExpense AI OCR", "Extracts vendor, items, tax, total & confidence flags.", PptxRGBColor(245, 158, 11)),
        ("Amazon S3", "Private Receipt Store", "30-day lifecycle auto-delete; Pre-signed direct uploads.", PptxRGBColor(59, 130, 246)),
        ("Amazon Bedrock", "Titan Text Express v1", "Transforms cryptic banking SMS into clean merchant data.", PptxRGBColor(139, 92, 246)),
        ("Amazon SES", "Transactional Digests", "Sends responsive daily EOD expense review emails.", PptxRGBColor(16, 185, 129)),
        ("Amazon SNS", "Critical Alert SMS", "Direct mobile carrier alerts for budget overruns.", PptxRGBColor(236, 72, 153)),
        ("AWS EventBridge", "Serverless Scheduler", "Triggers nightly automated cron review at 21:00 UTC.", PptxRGBColor(99, 102, 241)),
        ("AWS Lambda", "Microservice Dispatcher", "Secure webhook bridge authenticated via shared secret.", PptxRGBColor(234, 88, 12)),
        ("AWS App Runner", "Managed Container Host", "Node.js 20 backend with auto-scaling and persistent DB.", PptxRGBColor(14, 165, 233))
    ]
    
    for idx, (s_name, s_sub, s_desc, color) in enumerate(services):
        row = idx // 4
        col = idx % 4
        x = PptxInches(0.8 + col * 2.95)
        y = PptxInches(1.6 + row * 2.6)
        
        create_card_shape(s3, x, y, PptxInches(2.8), PptxInches(2.4), PptxRGBColor(248, 250, 252), PptxRGBColor(203, 213, 225))
        
        # Color bar indicator
        cbar = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, PptxInches(2.8), PptxInches(0.12))
        cbar.fill.solid()
        cbar.fill.fore_color.rgb = color
        cbar.line.fill.background()
        
        tb = s3.shapes.add_textbox(x + PptxInches(0.2), y + PptxInches(0.25), PptxInches(2.4), PptxInches(2.0))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = s_name
        p.font.bold = True
        p.font.size = PptxPt(13)
        p.font.color.rgb = PptxRGBColor(15, 23, 42)
        
        p2 = tf.add_paragraph()
        p2.text = s_sub
        p2.font.bold = True
        p2.font.size = PptxPt(9.5)
        p2.font.color.rgb = color
        
        p3 = tf.add_paragraph()
        p3.text = s_desc
        p3.font.size = PptxPt(10)
        p3.font.color.rgb = PptxRGBColor(71, 85, 105)

    # SLIDE 4: THE ZERO-RAM INGESTION PIPELINE
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_header(s4, "Technical Deep-Dive: Zero-RAM S3 Pre-Signed Upload Architecture")
    
    steps = [
        ("Step 1: Client Request", "Browser sends GET /receipts/upload-url with MIME type. Server validates user auth & generates UUID.", PptxRGBColor(99, 102, 241)),
        ("Step 2: Pre-Signed URL", "Backend calls S3 PutObjectCommand and generates signed URL with 15-minute TTL via AWS SDK.", PptxRGBColor(59, 130, 246)),
        ("Step 3: Direct S3 Push", "Browser executes HTTP PUT directly to private S3 bucket. Zero payload traverses Express memory.", PptxRGBColor(16, 185, 129)),
        ("Step 4: Textract Scan", "Express server passes S3Object: {Bucket, Key} to AnalyzeExpenseCommand. 100% decoupled memory.", PptxRGBColor(245, 158, 11))
    ]
    for idx, (st_title, st_desc, color) in enumerate(steps):
        x = PptxInches(0.8 + idx * 2.95)
        create_card_shape(s4, x, PptxInches(1.8), PptxInches(2.8), PptxInches(3.8), PptxRGBColor(255, 255, 255), color)
        
        tb = s4.shapes.add_textbox(x + PptxInches(0.2), PptxInches(2.0), PptxInches(2.4), PptxInches(3.4))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = f"0{idx+1}"
        p.font.bold = True
        p.font.size = PptxPt(24)
        p.font.color.rgb = color
        
        p2 = tf.add_paragraph()
        p2.text = st_title
        p2.font.bold = True
        p2.font.size = PptxPt(12)
        p2.font.color.rgb = PptxRGBColor(15, 23, 42)
        
        p3 = tf.add_paragraph()
        p3.text = st_desc
        p3.font.size = PptxPt(10.5)
        p3.font.color.rgb = PptxRGBColor(71, 85, 105)
        
    # Bottom callout
    create_card_shape(s4, PptxInches(0.8), PptxInches(5.9), PptxInches(11.7), PptxInches(1.0), PptxRGBColor(241, 245, 249))
    tb_bot = s4.shapes.add_textbox(PptxInches(1.0), PptxInches(6.0), PptxInches(11.3), PptxInches(0.8))
    tf_bot = tb_bot.text_frame
    tf_bot.word_wrap = True
    p_b = tf_bot.paragraphs[0]
    p_b.text = "💡 Architectural Impact: Eliminates server-side buffer allocation, prevents Node.js garbage collection freezes during concurrent uploads, and enforces automatic 30-day data retention compliance via S3 Lifecycle Policies."
    p_b.font.size = PptxPt(11)
    p_b.font.color.rgb = PptxRGBColor(30, 41, 59)

    # SLIDE 5: AMAZON TEXTRACT PARSER & CONFIDENCE GUARDRAILS
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_header(s5, "Amazon Textract: Expense Extraction & Confidence Scoring")
    
    create_card_shape(s5, PptxInches(0.8), PptxInches(1.6), PptxInches(5.6), PptxInches(5.2), PptxRGBColor(255, 255, 255), PptxRGBColor(203, 213, 225))
    tb_l = s5.shapes.add_textbox(PptxInches(1.1), PptxInches(1.8), PptxInches(5.0), PptxInches(4.8))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    
    p = tf_l.paragraphs[0]
    p.text = "📊 EXTRACTED EXPENSE FIELDS"
    p.font.bold = True
    p.font.size = PptxPt(13)
    p.font.color.rgb = PptxRGBColor(99, 102, 241)
    
    f_items = [
        ("Vendor Detection:", "Matches VENDOR_NAME or RECEIPT_HOUSE; maps to categories via merchant heuristics."),
        ("Line Item Groups:", "Item names, unit prices, and quantities extracted into structured array."),
        ("Summary Aggregates:", "Subtotal, sales tax/GST, and Grand Total normalized to numbers."),
        ("Date Normalization:", "Extracts INVOICE_RECEIPT_DATE and parses to ISO 8601 (YYYY-MM-DD).")
    ]
    for k, v in f_items:
        p = tf_l.add_paragraph()
        p.text = f"• {k} {v}"
        p.font.size = PptxPt(11)
        p.font.color.rgb = PptxRGBColor(51, 65, 85)
        
    create_card_shape(s5, PptxInches(6.8), PptxInches(1.6), PptxInches(5.7), PptxInches(5.2), PptxRGBColor(255, 255, 255), PptxRGBColor(203, 213, 225))
    tb_r = s5.shapes.add_textbox(PptxInches(7.1), PptxInches(1.8), PptxInches(5.1), PptxInches(4.8))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    p = tf_r.paragraphs[0]
    p.text = "🛡️ DATA INTEGRITY & ERROR GUARDRAILS"
    p.font.bold = True
    p.font.size = PptxPt(13)
    p.font.color.rgb = PptxRGBColor(16, 185, 129)
    
    g_items = [
        ("Confidence Flagging (<80%):", "Items with confidence below threshold are flagged in lowConfidenceItems for manual review."),
        ("Mathematical Total Fallback:", "If Grand Total OCR is smudged, system computes: Total = Subtotal + Tax from line items."),
        ("Draft Isolation State:", "Receipts save as status: 'draft', preventing unverified OCR data from corrupting monthly analytics."),
        ("MIME Pre-Validation:", "Rejects unsupported formats (HEIC, WebP) with 400 bad request before executing billable AWS calls.")
    ]
    for k, v in g_items:
        p = tf_r.add_paragraph()
        p.text = f"• {k} {v}"
        p.font.size = PptxPt(11)
        p.font.color.rgb = PptxRGBColor(51, 65, 85)

    # SLIDE 6: DEBT SIMPLIFICATION ALGORITHM & DYNAMIC UPI
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_header(s6, "Algorithmic Rigor: Graph-Theoretic Debt Simplification & Dynamic UPI")
    
    # Left: Simplification
    create_card_shape(s6, PptxInches(0.8), PptxInches(1.6), PptxInches(5.6), PptxInches(5.2), PptxRGBColor(248, 250, 252), PptxRGBColor(99, 102, 241))
    tb_s = s6.shapes.add_textbox(PptxInches(1.1), PptxInches(1.8), PptxInches(5.0), PptxInches(4.8))
    tf_s = tb_s.text_frame
    tf_s.word_wrap = True
    
    p = tf_s.paragraphs[0]
    p.text = "⚖️ O(N²) TO O(N) DEBT MINIMIZATION"
    p.font.bold = True
    p.font.size = PptxPt(13)
    p.font.color.rgb = PptxRGBColor(99, 102, 241)
    
    alg_bullets = [
        ("1. Net Position Computation:", "For each user i: NetBalance[i] = TotalPaid[i] - TotalOwed[i]."),
        ("2. Partitioning:", "Separate users into Creditors (> 0) and Debtors (< 0). Net balance sum equals zero."),
        ("3. Greedy Two-Pointer Matching:", "Sort Creditors descending and Debtors ascending. Match largest debtor with largest creditor."),
        ("4. Elimination:", "Transfer amount = min(|Debtor|, Creditor). Advance pointers until complete."),
        ("Result:", "Reduces 10-person pairwise web (45 debts) down to at most 9 direct transfers.")
    ]
    for b_title, b_desc in alg_bullets:
        p = tf_s.add_paragraph()
        p.text = f"• {b_title} {b_desc}"
        p.font.size = PptxPt(11)
        p.font.color.rgb = PptxRGBColor(51, 65, 85)
        
    # Right: Dynamic UPI
    create_card_shape(s6, PptxInches(6.8), PptxInches(1.6), PptxInches(5.7), PptxInches(5.2), PptxRGBColor(248, 250, 252), PptxRGBColor(16, 185, 129))
    tb_u = s6.shapes.add_textbox(PptxInches(7.1), PptxInches(1.8), PptxInches(5.1), PptxInches(4.8))
    tf_u = tb_u.text_frame
    tf_u.word_wrap = True
    
    p = tf_u.paragraphs[0]
    p.text = "⚡ DYNAMIC NPCI-COMPLIANT UPI ENGINE"
    p.font.bold = True
    p.font.size = PptxPt(13)
    p.font.color.rgb = PptxRGBColor(16, 185, 129)
    
    upi_bullets = [
        ("Official NPCI Specification:", "upi://pay?pa={VPA}&pn={Name}&am={Amount}&cu=INR&tn={Note}"),
        ("Dynamic QR Code Rendering:", "Generates high-contrast QR code client-side via qrcode for immediate desktop scanning."),
        ("VPA Handle Autocomplete:", "Suggests handles with one-click bank suffix chips (@okaxis, @okhdfcbank, @paytm, @ybl)."),
        ("Native Mobile Deep-Links:", "Mobile users tap 'Open in UPI App' to jump straight into Google Pay, PhonePe, or Paytm."),
        ("One-Tap Ledger Update:", "Records settlement in MongoDB and re-simplifies group balances immediately.")
    ]
    for b_title, b_desc in upi_bullets:
        p = tf_u.add_paragraph()
        p.text = f"• {b_title} {b_desc}"
        p.font.size = PptxPt(11)
        p.font.color.rgb = PptxRGBColor(51, 65, 85)

    # VIVA SLIDES: TIER 1 TO TIER 4
    viva_slides_data = [
        ("Tier 1 Viva: Foundational Architecture & AWS Stack", [
            ("Q1: What fundamental problem does FinSight solve, and what is its architecture?",
             "FinSight addresses 'expense tracking fatigue' through automated multimodal capture (Receipt OCR, Natural Language, and Bank SMS). Built as a decoupled SPA (React 18 + Vite) with an Express.js Node.js 20 backend and MongoDB Atlas, unifying single-user budgeting with multi-member trip ledgers."),
            ("Q2: Which AWS services are integrated, and why choose AWS over SaaS APIs?",
             "Integrated with 7 AWS services: Textract (OCR), S3 (Secure Storage), Bedrock (LLM Enrichment), SES (Email Digests), SNS (SMS), EventBridge (Cron), and Lambda (Serverless Dispatch). AWS provides centralized IAM security, unified billing, and sub-millisecond VPC networking.")
        ]),
        ("Tier 2 Viva: Pre-Signed S3 & Textract Extraction", [
            ("Q3: Why pre-signed S3 URLs instead of streaming multipart data through Express?",
             "Streaming large receipt images through Express causes severe RAM consumption and garbage collection spikes in Node.js. Pre-signed URLs let clients upload directly to S3 (Zero-RAM ingestion). Express only receives metadata, completely decoupling bandwidth from compute."),
            ("Q4: How does Textract AnalyzeExpense differ from standard OCR?",
             "Standard OCR produces unstructured string blocks. Textract AnalyzeExpense uses models specifically trained on invoices, returning structured SummaryFields and LineItemGroups with quantities, unit prices, and confidence ratings.")
        ]),
        ("Tier 3 Viva: EventBridge Cron & HMAC Magic Links", [
            ("Q5: How does the serverless EOD reminder pipeline operate securely?",
             "EventBridge triggers an AWS Lambda microservice daily at 21:00 UTC. Lambda queries FinSight's internal endpoint with a shared REMINDER_SECRET_KEY. The backend queries pending drafts and dispatches responsive HTML digests via Amazon SES."),
            ("Q6: How do One-Tap Magic Links authenticate without passwords?",
             "Magic links embed an HMAC-SHA256 signed JWT containing userId, eligible draftIds, and action: 'approve_drafts' with a 48-hour expiration. Upon verification, drafts transition to cleared; subsequent replay attempts fail safely.")
        ]),
        ("Tier 4 Viva: Faculty Defense, App Runner & 100K Spike", [
            ("Q7: Why choose AWS App Runner over Lambda or ECS Fargate?",
             "Lambda suffers from 2-3 second cold starts and exhausts MongoDB connection pools. ECS Fargate introduces complex ALB, VPC, and target group overhead. App Runner offers the perfect balance: zero cold starts, persistent DB connection pooling, and fully managed container auto-scaling."),
            ("Q8: Where does the system break under a 100x traffic spike?",
             "The first bottleneck is Textract synchronous API concurrency quotas. To harden for 100K spikes, we evolve to an asynchronous architecture: S3 event triggers Amazon SQS FIFO queue, worker pools process Textract asynchronously, and clients receive updates via WebSockets.")
        ])
    ]
    
    for slide_title, qas in viva_slides_data:
        s_viva = prs.slides.add_slide(blank_layout)
        add_slide_header(s_viva, slide_title, "SOCRATIC FACULTY PEER REVIEW")
        
        for idx, (q_text, a_text) in enumerate(qas):
            y_offset = PptxInches(1.6 + idx * 2.7)
            
            # Question banner (Dark)
            create_card_shape(s_viva, PptxInches(0.8), y_offset, PptxInches(11.7), PptxInches(0.7), PptxRGBColor(15, 23, 42))
            tb_q = s_viva.shapes.add_textbox(PptxInches(1.0), y_offset + PptxInches(0.08), PptxInches(11.3), PptxInches(0.55))
            tf_q = tb_q.text_frame
            tf_q.word_wrap = True
            p = tf_q.paragraphs[0]
            p.text = f"👨‍🏫 PROFESSOR: {q_text}"
            p.font.bold = True
            p.font.size = PptxPt(11)
            p.font.color.rgb = PptxRGBColor(16, 185, 129)
            
            # Answer Card (Light)
            create_card_shape(s_viva, PptxInches(0.8), y_offset + PptxInches(0.75), PptxInches(11.7), PptxInches(1.75), PptxRGBColor(248, 250, 252), PptxRGBColor(99, 102, 241))
            tb_a = s_viva.shapes.add_textbox(PptxInches(1.1), y_offset + PptxInches(0.85), PptxInches(11.1), PptxInches(1.55))
            tf_a = tb_a.text_frame
            tf_a.word_wrap = True
            p = tf_a.paragraphs[0]
            p.text = f"🎓 FACULTY DEFENSE: {a_text}"
            p.font.size = PptxPt(11)
            p.font.color.rgb = PptxRGBColor(30, 41, 59)

    # FINAL SLIDE: PROFESSOR'S VERDICT & SCORING
    s_end = prs.slides.add_slide(blank_layout)
    add_slide_header(s_end, "Professor's Official Evaluation & Scoring Rubric")
    
    scores = [
        ("Architecture & Scalability", "9.5 / 10", "Zero-RAM S3 ingestion and App Runner decoupled compute."),
        ("AWS Service Breadth", "9.8 / 10", "Mastery across Textract, Bedrock, S3, SES, SNS, EventBridge & Lambda."),
        ("Security & IAM Controls", "9.2 / 10", "CloudFront OAC zero-trust perimeter and HMAC-SHA256 magic links."),
        ("Algorithmic Innovation", "9.5 / 10", "Graph debt simplification and NPCI-compliant dynamic UPI engine.")
    ]
    for idx, (title, score, note) in enumerate(scores):
        x = PptxInches(0.8 + idx * 2.95)
        create_card_shape(s_end, x, PptxInches(1.8), PptxInches(2.8), PptxInches(3.2), PptxRGBColor(255, 255, 255), PptxRGBColor(203, 213, 225))
        
        tb = s_end.shapes.add_textbox(x + PptxInches(0.2), PptxInches(2.0), PptxInches(2.4), PptxInches(2.8))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = PptxPt(11)
        p.font.color.rgb = PptxRGBColor(15, 23, 42)
        
        p2 = tf.add_paragraph()
        p2.text = score
        p2.font.bold = True
        p2.font.size = PptxPt(22)
        p2.font.color.rgb = PptxRGBColor(16, 185, 129)
        
        p3 = tf.add_paragraph()
        p3.text = note
        p3.font.size = PptxPt(9.5)
        p3.font.color.rgb = PptxRGBColor(100, 116, 139)
        
    # Banner
    create_card_shape(s_end, PptxInches(0.8), PptxInches(5.3), PptxInches(11.7), PptxInches(1.6), PptxRGBColor(236, 253, 245), PptxRGBColor(16, 185, 129))
    tb_v = s_end.shapes.add_textbox(PptxInches(1.1), PptxInches(5.45), PptxInches(11.1), PptxInches(1.3))
    tf_v = tb_v.text_frame
    tf_v.word_wrap = True
    
    p = tf_v.paragraphs[0]
    p.text = "🏆 FINAL ACADEMIC VERDICT: UNANIMOUS HIGH DISTINCTION (A+ / 9.5 out of 10)"
    p.font.bold = True
    p.font.size = PptxPt(14)
    p.font.color.rgb = PptxRGBColor(4, 120, 87)
    
    p2 = tf_v.add_paragraph()
    p2.text = "The candidate has demonstrated exceptional software engineering rigor, cloud architecture maturity, and algorithmic depth. FinSight stands as a model reference architecture for modern cloud-native financial technology."
    p2.font.size = PptxPt(11)
    p2.font.color.rgb = PptxRGBColor(30, 41, 59)
    
    prs.save(output_path)
    print(f"PowerPoint presentation successfully created: {output_path}")

if __name__ == '__main__':
    doc_path = "/home/pragyan/finsight/finSight_AWS_Architecture_Faculty_Review.docx"
    ppt_path = "/home/pragyan/finsight/finSight_AWS_Architecture_Faculty_Review.pptx"
    build_docx_document(doc_path)
    build_pptx_deck(ppt_path)
