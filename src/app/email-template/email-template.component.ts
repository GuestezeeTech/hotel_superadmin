import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { DOMAIN_NAME } from '../app.config';

/* ─────────────────────────────────────────────────────────────────────────
 *  ENDPOINTS for the trigger-config (email template) module.
 *  getall : returns every template document.
 *  update : updates one document, matched by extras.find.template_code.
 * ──────────────────────────────────────────────────────────────────────── */
const TRIGGERCONFIG_GETALL = 'https://www.guestezee.com:8011/triggerconfig/getall';
const TRIGGERCONFIG_UPDATE = 'https://www.guestezee.com:8012/triggerconfig/update';

/* ─────────────────────────────────────────────────────────────────────────
 *  GEMINI BACKEND PROXY.
 *  The Gemini API key must NEVER live in this frontend (it ships to the
 *  browser and can be stolen). Stand up a small backend endpoint that holds
 *  the key and forwards the request to Gemini.
 *
 *  Expected contract:
 *    POST  GEMINI_PROXY_ENDPOINT
 *    body  ->  { "prompt": "<full prompt string built below>" }
 *    resp  ->  { "text": "<model output: a complete HTML document>" }
 *              (also accepts { "html": "..." } or Gemini's raw
 *               { candidates:[{ content:{ parts:[{ text }] } }] } shape)
 *
 *  Leave this blank until the proxy exists – the AI button stays disabled
 *  with a "configure proxy" notice.
 * ──────────────────────────────────────────────────────────────────────── */
const GEMINI_PROXY_ENDPOINT = 'http://164.52.214.114:8013/refine';

interface AttachmentEdit {
  filename: string;
  html: string;
  original: string;
  mode: 'content' | 'html';
  contentText: string;
}

interface TemplateDoc {
  _id?: string;
  template_code: string;
  title?: string;
  system_label?: string;
  channel?: string;
  event?: string;
  subject_template?: string;
  body_html?: string;
  attachments?: { filename: string; html: string }[];
  [key: string]: any;
}

type RefineTarget = { kind: 'email' } | { kind: 'attachment'; index: number };

@Component({
  selector: 'app-email-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-template.component.html',
  styleUrl: './email-template.component.scss'
})
export class EmailTemplateComponent implements OnInit {
  /* list / selection */
  templates: TemplateDoc[] = [];
  filtered: TemplateDoc[] = [];
  search = '';
  selected: TemplateDoc | null = null;
  loadingList = false;

  /* editor state for the selected doc */
  subject = '';
  hasEmail = false;
  emailHtml = '';
  emailOriginal = '';
  emailMode: 'content' | 'html' = 'content';
  emailContentText = '';
  attachments: AttachmentEdit[] = [];

  /* preview */
  previewTarget: RefineTarget = { kind: 'email' };
  previewSafe: SafeHtml | string = '';
  previewDevice: 'desktop' | 'mobile' = 'desktop';

  /* AI refine */
  aiInstruction = '';
  aiTarget: RefineTarget = { kind: 'email' };
  aiBusy = false;
  proxyConfigured = !!GEMINI_PROXY_ENDPOINT;

  /* status banner */
  banner: { type: 'success' | 'error' | 'info'; msg: string } | null = null;
  saving = false;

  private userId: number;
  private domain: string;

  constructor(
    private http: HttpClient,
    private auth: AuthTokenService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {
    const uid = this.auth.getUserId();
    this.userId = uid && !isNaN(uid) ? uid : 1;
    this.domain = this.auth.getDomain() || DOMAIN_NAME;
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  /* ── navigation ─────────────────────────────────────────────────────── */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /* ── networking ─────────────────────────────────────────────────────── */
  private headers(): HttpHeaders {
    let h = new HttpHeaders().set('Content-Type', 'application/json');
    const tok = this.auth.getAccessAPIToken();
    if (tok) h = h.set('authorization', 'Bearer ' + tok);
    return h;
  }

  loadTemplates(): void {
    this.loadingList = true;
    this.banner = null;
    const body = { user_id: this.userId, domain_name: this.domain, extras: { find: {} } };
    this.http.post<any>(TRIGGERCONFIG_GETALL, body, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.loadingList = false;
        const data: TemplateDoc[] = res?.result?.data ?? res?.data ?? [];
        const allowedChannels = ['EMAIL', 'DOWNLOAD'];
        this.templates = (data || []).filter((d) => {
          if (d['is_deleted']) return false;
          const ch = (d.channel || '').toUpperCase();
          return allowedChannels.some((allowed) => ch.includes(allowed));
        });
        this.applyFilter();
        if (!this.templates.length) this.setBanner('info', 'No templates found.');
      },
      error: (err) => {
        this.loadingList = false;
        this.setBanner('error', 'Failed to load templates: ' + this.errText(err));
      }
    });
  }

  applyFilter(): void {
    const q = this.search.trim().toLowerCase();
    this.filtered = !q
      ? [...this.templates]
      : this.templates.filter((t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.template_code || '').toLowerCase().includes(q) ||
          (t.system_label || '').toLowerCase().includes(q)
        );
  }

  /* ── selection / editor init ────────────────────────────────────────── */
  selectTemplate(t: TemplateDoc): void {
    this.selected = t;
    this.banner = null;
    this.subject = t.subject_template || '';
    this.emailHtml = this.normalizeLogoSize(t.body_html || '');
    this.emailOriginal = this.emailHtml;
    this.hasEmail = !!(t.body_html && t.body_html.trim());
    this.emailMode = 'content';
    this.emailContentText = this.extractContentText(this.emailHtml);

    this.attachments = (t.attachments || []).map((a) => {
      const cleanAttHtml = this.normalizeLogoSize(a.html || '');
      return {
        filename: a.filename || 'attachment',
        html: cleanAttHtml,
        original: cleanAttHtml,
        mode: 'content' as const,
        contentText: this.extractContentText(cleanAttHtml)
      };
    });

    this.previewTarget = this.hasEmail ? { kind: 'email' } : { kind: 'attachment', index: 0 };
    this.aiTarget = this.previewTarget;
    this.refreshPreview();
  }

  get hasAttachments(): boolean {
    return this.attachments.length > 0;
  }

  /* ── content <-> html editor wiring ─────────────────────────────────── */
  setEmailMode(mode: 'content' | 'html'): void {
    if (mode === 'content') this.emailContentText = this.extractContentText(this.emailHtml);
    this.emailMode = mode;
  }

  onEmailHtmlChange(): void {
    if (this.isPreview({ kind: 'email' })) this.refreshPreview();
  }

  onEmailContentChange(): void {
    this.emailHtml = this.applyContentText(this.emailHtml, this.emailContentText);
    if (this.isPreview({ kind: 'email' })) this.refreshPreview();
  }

  setAttMode(att: AttachmentEdit, mode: 'content' | 'html'): void {
    if (mode === 'content') att.contentText = this.extractContentText(att.html);
    att.mode = mode;
  }

  onAttHtmlChange(att: AttachmentEdit, index: number): void {
    if (this.isPreview({ kind: 'attachment', index })) this.refreshPreview();
  }

  onAttContentChange(att: AttachmentEdit, index: number): void {
    att.html = this.applyContentText(att.html, att.contentText);
    if (this.isPreview({ kind: 'attachment', index })) this.refreshPreview();
  }

  /* ── preview ────────────────────────────────────────────────────────── */
  selectPreview(target: RefineTarget): void {
    this.previewTarget = target;
    this.refreshPreview();
  }

  isPreview(target: RefineTarget): boolean {
    if (target.kind !== this.previewTarget.kind) return false;
    if (target.kind === 'attachment' && this.previewTarget.kind === 'attachment')
      return target.index === this.previewTarget.index;
    return true;
  }

  private currentHtmlOf(target: RefineTarget): string {
    return target.kind === 'email' ? this.emailHtml : (this.attachments[target.index]?.html || '');
  }

  refreshPreview(): void {
    const html = this.currentHtmlOf(this.previewTarget);
    this.previewSafe = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /* ── AI refine ──────────────────────────────────────────────────────── */
  refineWithAI(): void {
    if (!this.proxyConfigured) {
      this.setBanner('error', 'AI proxy is not configured. Set GEMINI_PROXY_ENDPOINT in email-template.component.ts.');
      return;
    }
    const instruction = this.aiInstruction.trim();
    if (!instruction) {
      this.setBanner('info', 'Type how you want the design refined.');
      return;
    }
    const oldHtml = this.currentHtmlOf(this.aiTarget);
    if (!oldHtml.trim()) {
      this.setBanner('error', 'Nothing to refine for the selected section.');
      return;
    }

    this.aiBusy = true;
    this.banner = null;
    const prompt = this.buildPrompt(instruction, oldHtml);

    this.http.post<any>(GEMINI_PROXY_ENDPOINT, { prompt }, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.aiBusy = false;
        const raw =
          res?.text ??
          res?.html ??
          res?.candidates?.[0]?.content?.parts?.[0]?.text ??
          '';
        const newHtml = this.stripFences(String(raw || ''));
        if (!newHtml.trim()) {
          this.setBanner('error', 'AI returned an empty result. Try again.');
          return;
        }
        const guard = this.enforceTextPreservation(oldHtml, newHtml);
        if (!guard.ok) {
          this.setBanner('error', 'AI result rejected – it altered the wording (' + guard.reason + '). The text content is locked; refine the design only.');
          return;
        }
        this.applyRefinedHtml(this.aiTarget, guard.html);
        this.aiInstruction = '';
        const usedModel = res?.model ? ' via ' + res.model : '';
        this.setBanner('success', 'Design refined' + usedModel + '. Wording preserved exactly.');
      },
      error: (err) => {
        this.aiBusy = false;
        this.setBanner('error', 'AI request failed: ' + this.errText(err));
      }
    });
  }

  private buildPrompt(instruction: string, html: string): string {
    const contentText = this.extractContentText(html);

    return [
      'You are an expert HTML email and document designer for GuestEzee.',
      '',
      'BRAND PALETTE & ASSETS:',
      '- Logo Image URL: https://www.guestezee.com/assets/images/guestezee/page_1%201.png',
      '- LOGO SIZING & DISPLAY: Place the logo inside a clean header on a WHITE background card: <img src="https://www.guestezee.com/assets/images/guestezee/page_1%201.png" alt="" width="150" style="width: 150px; max-width: 150px; height: auto; display: block; background-color: #ffffff; padding: 8px 12px; border-radius: 6px; outline: none; border: 0;" />.',
      '- Primary Brand Colors: Maroon (#800020) and White (#ffffff).',
      '- Accent Colors: Black (#000000), Blue (#0056b3), Light Gray (#f8f9fa).',
      '',
      'DESIGN TASK:',
      '- Build a COMPLETELY NEW, modern, beautifully styled, responsive HTML email template from scratch.',
      '- Do NOT reuse broken or legacy table/div structures. Re-architect the layout with clean cards, key-value tables, and professional spacing.',
      '- Organize headings, subheadings, key-value data fields, and block sections cleanly with professional padding, subtle borders, and harmonious maroon/white brand styling.',
      instruction ? '  Client Instruction: ' + instruction : '  Client Instruction: Build a clean, structured key-value template design.',
      '',
      'STRICT WORD-FOR-WORD LOCK (CRITICAL REQUIREMENT):',
      '- Build the HTML layout using ONLY the exact text lines and {{placeholder}} tokens provided in the RAW TEXT CONTENT below.',
      '- Do NOT add new copy text, slogans, or extra words. Keep every word token and {{placeholder}} byte-for-byte identical in sequence.',
      '- If Handlebars block syntax (such as {{#if ...}} and {{/if}}) is present in the text, preserve the block logic around the table rows/elements.',
      '- Return ONLY the complete, self-contained HTML document. No markdown fences or extra commentary.',
      '',
      'RAW TEXT CONTENT TO FORMAT INTO FRESH HTML DESIGN:',
      contentText,
      '',
      'EXISTING HTML REFERENCE (For context only):',
      html
    ].join('\n');
  }

  private applyRefinedHtml(target: RefineTarget, html: string): void {
    const cleanHtml = this.normalizeLogoSize(html);
    if (target.kind === 'email') {
      this.emailHtml = cleanHtml;
      if (this.emailMode === 'content') this.emailContentText = this.extractContentText(cleanHtml);
    } else {
      const att = this.attachments[target.index];
      if (att) {
        att.html = cleanHtml;
        if (att.mode === 'content') att.contentText = this.extractContentText(cleanHtml);
      }
    }
    this.previewTarget = target;
    this.refreshPreview();
  }

  private normalizeLogoSize(html: string): string {
    if (!html) return html;
    const doc = this.parseDoc(html);
    this.cleanEmptyElements(doc);

    let outHtml = this.serialize(doc, html);
    return outHtml.replace(/<img([^>]*src=["'][^"']*(?:guestezee|logo)[^"']*["'][^>]*)>/gi, (match, p1) => {
      if (/width=/i.test(match) || /style=/i.test(match)) {
        let updated = match;
        if (!/width=["']?150/i.test(updated)) {
          updated = updated.replace(/width=["'][^"']*["']/gi, 'width="150"');
        }
        if (/style=["']/i.test(updated)) {
          updated = updated.replace(/style=["']([^"']*)["']/i, (m, s) => {
            const clean = s.replace(/(width|max-width|height|background|background-color)\s*:[^;]+;?/gi, '').trim();
            return `style="${clean ? clean + '; ' : ''}width: 150px; max-width: 150px; height: auto; background-color: #ffffff; padding: 8px 12px; border-radius: 6px;"`;
          });
        } else {
          updated = updated.replace(/>$/, ' style="width: 150px; max-width: 150px; height: auto; background-color: #ffffff; padding: 8px 12px; border-radius: 6px;">');
        }
        return updated;
      }
      return `<img ${p1} width="150" style="width: 150px; max-width: 150px; height: auto; display: block; background-color: #ffffff; padding: 8px 12px; border-radius: 6px;" />`;
    });
  }

  /** Clean up empty clickable elements (like buttons, links, CTA containers) that have no text and no images. */
  private cleanEmptyElements(doc: Document): Document {
    const candidates = doc.querySelectorAll('a, button, [class*="btn"], [class*="button"], [class*="cta"]');
    candidates.forEach((el) => {
      const text = (el.textContent || '').trim();
      const hasImg = el.querySelector('img') !== null;
      if (!text && !hasImg) {
        el.remove();
      }
    });
    return doc;
  }

  /* ── save ───────────────────────────────────────────────────────────── */
  save(): void {
    if (!this.selected) return;
    this.saving = true;
    this.banner = null;

    const data: any = {};
    if (this.hasEmail) {
      data.body_html = this.emailHtml;
      data.subject_template = this.subject;
    }
    if (this.hasAttachments) {
      data.attachments = this.attachments.map((a) => ({ filename: a.filename, html: a.html }));
    }

    const body = {
      user_id: this.userId,
      domain_name: this.domain,
      payload: { data },
      extras: { find: { template_code: this.selected.template_code } }
    };

    this.http.post<any>(TRIGGERCONFIG_UPDATE, body, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.saving = false;
        const ok = res?.success === 1 || res?.status_code === 200 || res?.success === true;
        if (ok) {
          // sync local cache so re-selecting shows saved content
          if (this.hasEmail) {
            this.selected!.body_html = this.emailHtml;
            this.selected!.subject_template = this.subject;
            this.emailOriginal = this.emailHtml;
          }
          if (this.hasAttachments) {
            this.selected!.attachments = this.attachments.map((a) => ({ filename: a.filename, html: a.html }));
            this.attachments.forEach((a) => (a.original = a.html));
          }
          this.setBanner('success', 'Template saved.');
        } else {
          this.setBanner('error', 'Save did not succeed: ' + (res?.message || JSON.stringify(res)));
        }
      },
      error: (err) => {
        this.saving = false;
        this.setBanner('error', 'Save failed: ' + this.errText(err));
      }
    });
  }

  resetEdits(): void {
    if (!this.selected) return;
    this.selectTemplate(this.selected);
    this.setBanner('info', 'Reverted to last loaded version.');
  }

  /* ── helpers: text-node extraction & re-injection ───────────────────── */
  private parseDoc(html: string): Document {
    return new DOMParser().parseFromString(html || '', 'text/html');
  }

  private meaningfulTextNodes(doc: Document): Text[] {
    const root = doc.body || doc.documentElement;
    if (!root) return [];
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const parent = (n as Text).parentElement;
      if (parent && /^(SCRIPT|STYLE|TITLE)$/.test(parent.tagName)) continue;
      if (n.nodeValue && n.nodeValue.trim().length) nodes.push(n as Text);
    }
    return nodes;
  }

  /** Visible text, one segment per line, for the Content editor. */
  private extractContentText(html: string): string {
    return this.meaningfulTextNodes(this.parseDoc(html))
      .map((n) => (n.nodeValue || '').trim())
      .join('\n');
  }

  /** Write edited lines back onto matching text nodes and dynamically append any new lines. */
  private applyContentText(html: string, contentText: string): string {
    const doc = this.parseDoc(html);
    const nodes = this.meaningfulTextNodes(doc);
    const lines = contentText.split('\n');
    const minCount = Math.min(nodes.length, lines.length);

    for (let i = 0; i < minCount; i++) {
      nodes[i].nodeValue = lines[i];
    }

    // If lines were removed, clear out trailing text nodes
    if (nodes.length > lines.length) {
      for (let i = lines.length; i < nodes.length; i++) {
        nodes[i].nodeValue = '';
      }
    }

    // If new content lines were added, append them so they are included in the HTML tree
    if (lines.length > nodes.length) {
      const targetContainer = doc.body || doc.documentElement;
      for (let i = nodes.length; i < lines.length; i++) {
        if (lines[i].trim()) {
          const p = doc.createElement('p');
          p.style.margin = '10px 0';
          p.style.lineHeight = '1.5';
          p.textContent = lines[i];
          targetContainer.appendChild(p);
        }
      }
    }

    // Clean up empty button/anchor/CTA elements whose text was deleted
    this.cleanEmptyElements(doc);

    return this.serialize(doc, html);
  }

  private serialize(doc: Document, original: string): string {
    const out = doc.documentElement ? doc.documentElement.outerHTML : original;
    return /^\s*<!doctype/i.test(original) ? '<!DOCTYPE html>\n' + out : out;
  }

  private placeholders(html: string): Set<string> {
    const found = html.match(/{{\s*[\w.]+\s*}}/g) || [];
    return new Set(found.map((p) => p.replace(/\s+/g, '')));
  }

  private normalizeToken(token: string): string {
    if (!token) return '';
    if (/^{{.*}}$/.test(token)) {
      return token.replace(/\s+/g, '');
    }
    return token.toLowerCase().replace(/^[:.,!?\-\s]+|[:.,!?\-\s]+$/g, '').trim();
  }

  /** Visible text as an ordered list of word tokens — agnostic to markup,
   *  element nesting and whitespace, so design/structure changes are allowed. */
  private visibleTokens(html: string): string[] {
    const text = this.meaningfulTextNodes(this.parseDoc(html))
      .map((n) => n.nodeValue || '')
      .join(' ');
    return text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  }

  /**
   * Allow the AI to change design/structure but NOT the wording. We compare normalized word
   * frequencies and placeholder tokens so restyling, table layout shifts, or node nesting all pass
   * while genuine word additions or deletions are rejected.
   */
  private enforceTextPreservation(
    oldHtml: string,
    newHtml: string
  ): { ok: true; html: string } | { ok: false; reason: string } {
    const oldPH = this.placeholders(oldHtml);
    const newPH = this.placeholders(newHtml);
    const missing = [...oldPH].filter((p) => !newPH.has(p));
    if (missing.length) return { ok: false, reason: 'dropped placeholder(s): ' + missing.join(', ') };

    const oldTokens = this.visibleTokens(oldHtml);
    const newTokens = this.visibleTokens(newHtml);

    const normOld = oldTokens.map((t) => this.normalizeToken(t)).filter(Boolean);
    const normNew = newTokens.map((t) => this.normalizeToken(t)).filter(Boolean);

    const countMap = (arr: string[]) => {
      const m = new Map<string, number>();
      arr.forEach((t) => m.set(t, (m.get(t) || 0) + 1));
      return m;
    };

    const mapOld = countMap(normOld);
    const mapNew = countMap(normNew);

    const added: string[] = [];
    const removed: string[] = [];

    mapOld.forEach((cnt, word) => {
      const newCnt = mapNew.get(word) || 0;
      if (newCnt < cnt) {
        for (let k = 0; k < cnt - newCnt; k++) removed.push(word);
      }
    });

    mapNew.forEach((cnt, word) => {
      const oldCnt = mapOld.get(word) || 0;
      if (oldCnt < cnt) {
        for (let k = 0; k < cnt - oldCnt; k++) added.push(word);
      }
    });

    if (added.length > 0 || removed.length > 0) {
      let msg = `altered wording (${oldTokens.length} → ${newTokens.length})`;
      if (added.length) msg += `; added: “${added.slice(0, 6).join(' ')}”`;
      if (removed.length) msg += `; removed: “${removed.slice(0, 6).join(' ')}”`;
      return { ok: false, reason: msg };
    }

    return { ok: true, html: newHtml };
  }

  /** Human-readable summary of which words the AI changed. */
  private wordingDiff(oldTokens: string[], newTokens: string[]): string {
    const count = (arr: string[]) => arr.reduce((m, t) => m.set(t, (m.get(t) || 0) + 1), new Map<string, number>());
    const oldC = count(oldTokens), newC = count(newTokens);
    const added: string[] = [], removed: string[] = [];
    newC.forEach((c, t) => { for (let k = 0; k < c - (oldC.get(t) || 0); k++) added.push(t); });
    oldC.forEach((c, t) => { for (let k = 0; k < c - (newC.get(t) || 0); k++) removed.push(t); });
    let msg = `changed the words (${oldTokens.length} → ${newTokens.length})`;
    if (added.length) msg += `; added: “${added.slice(0, 6).join(' ')}”`;
    if (removed.length) msg += `; removed: “${removed.slice(0, 6).join(' ')}”`;
    return msg;
  }

  private stripFences(text: string): string {
    let t = text.trim();
    const fence = t.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/);
    if (fence) t = fence[1].trim();
    return t;
  }

  /* ── misc ───────────────────────────────────────────────────────────── */
  channelBadge(t: TemplateDoc): string {
    if (t.body_html && t.attachments?.length) return 'EMAIL + FILE';
    if (t.attachments?.length) return t.channel || 'FILE';
    return t.channel || 'EMAIL';
  }

  private setBanner(type: 'success' | 'error' | 'info', msg: string): void {
    this.banner = { type, msg };
  }

  private errText(err: any): string {
    return err?.error?.message || err?.message || err?.statusText || 'unknown error';
  }
}
