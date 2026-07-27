import DOMPurify from 'dompurify';
import { marked } from 'marked';
import './styles.css';
import { contentSources, excludedReviewPaths, type ContentSource } from './content';

type ReviewStatus = 'pending' | 'approved' | 'changes';

type FrontmatterValue = string | string[];

interface ParsedDocument extends ContentSource {
  body: string;
  frontmatter: Record<string, FrontmatterValue>;
  plainText: string;
}

interface ReviewEntry {
  status: ReviewStatus;
  note: string;
  updatedAt: string | null;
}

interface OpenDecision {
  id: string;
  owner: string;
  question: string;
  sourceIds: string[];
}

const appElement = document.querySelector<HTMLDivElement>('#app');
if (!appElement) throw new Error('Missing #app root');
const app = appElement;

const STORAGE_KEY = 'noah-public-review-v1';
const sourceByPath = new Map(contentSources.map((source) => [source.sourcePath, source]));
const statusMeta: Record<ReviewStatus, { label: string; shortLabel: string; className: string }> = {
  pending: { label: 'Not reviewed', shortLabel: 'Pending', className: 'pending' },
  approved: { label: 'Looks good', shortLabel: 'Reviewed', className: 'approved' },
  changes: { label: 'Needs changes', shortLabel: 'Changes', className: 'changes' },
};

const documents: ParsedDocument[] = contentSources.map((source) => {
  const { frontmatter, body } = parseFrontmatter(source.raw);
  const bodyWithoutTitle = body.replace(/^\s*#\s+[^\n]+\n+/, '');
  return {
    ...source,
    body: bodyWithoutTitle,
    frontmatter,
    plainText: markdownToPlainText(bodyWithoutTitle),
  };
});

const documentById = new Map(documents.map((document) => [document.id, document]));
const openDecisions = extractOpenDecisions(documents);
let reviews = loadReviews();
let tocObserver: IntersectionObserver | null = null;
const mobileNavigationQuery = window.matchMedia('(max-width: 900px)');
const unsavedReviewIds = new Set<string>();

marked.setOptions({
  gfm: true,
  breaks: false,
});
marked.use({
  extensions: [
    {
      name: 'sourceCitation',
      level: 'inline',
      start(source: string) {
        return source.indexOf('[src:');
      },
      tokenizer(source: string) {
        const match = /^\[src:\s*([^\]]+)\]/.exec(source);
        if (!match) return undefined;
        return { type: 'sourceCitation', raw: match[0], source: match[1].trim() };
      },
      renderer(token) {
        return renderCitationHtml(String(token.source ?? ''));
      },
    },
  ],
});

function parseFrontmatter(raw: string): { frontmatter: Record<string, FrontmatterValue>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: {}, body: raw };

  const frontmatter: Record<string, FrontmatterValue> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: raw.slice(match[0].length) };
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_|~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractOpenDecisions(items: ParsedDocument[]): OpenDecision[] {
  const decisionMap = new Map<string, OpenDecision>();
  const pattern = /TODO\((Q-\d{2})\s+([^:]+):\s*([^)]+)\)/g;

  for (const document of items) {
    for (const match of document.body.matchAll(pattern)) {
      const [, id, owner, question] = match;
      const existing = decisionMap.get(id);
      if (existing) {
        if (!existing.sourceIds.includes(document.id)) existing.sourceIds.push(document.id);
      } else {
        decisionMap.set(id, {
          id,
          owner: owner.trim(),
          question: question.trim(),
          sourceIds: [document.id],
        });
      }
    }
  }

  return [...decisionMap.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function loadReviews(): Record<string, ReviewEntry> {
  const defaults: Record<string, ReviewEntry> = Object.fromEntries(
    documents.map((document) => [document.id, { status: 'pending', note: '', updatedAt: null }]),
  );

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored) as Record<string, Partial<ReviewEntry>>;
    for (const document of documents) {
      const entry = parsed[document.id];
      if (!entry) continue;
      if (entry.status === 'approved' || entry.status === 'changes' || entry.status === 'pending') {
        defaults[document.id] = {
          status: entry.status,
          note: typeof entry.note === 'string' ? entry.note : '',
          updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : null,
        };
      }
    }
    return defaults;
  } catch {
    return defaults;
  }
}

function persistReviews(): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch {
    return false;
  }
}

function getReview(documentId: string): ReviewEntry {
  return reviews[documentId] ?? { status: 'pending', note: '', updatedAt: null };
}

function reviewedCount(): number {
  return documents.filter((document) => getReview(document.id).status !== 'pending').length;
}

function reviewProgress(): number {
  return Math.round((reviewedCount() / documents.length) * 100);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function icon(name: 'home' | 'file' | 'search' | 'menu' | 'close' | 'arrow' | 'download' | 'copy' | 'lock'): string {
  switch (name) {
    case 'home':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9Z"/></svg>';
    case 'file':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l4 4v16H6V2Z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></svg>';
    case 'search':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
    case 'menu':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    case 'close':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    case 'arrow':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    case 'download':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/></svg>';
    case 'copy':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
    case 'lock':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
  }
}

function formatDate(value: FrontmatterValue | undefined): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Not scheduled';
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function currentRoute(): string {
  const requested = new URLSearchParams(window.location.search).get('doc');
  return requested && documentById.has(requested) ? requested : 'home';
}

function navigateTo(documentId: string, anchor = ''): void {
  const url = new URL(window.location.href);
  if (documentId === 'home') url.searchParams.delete('doc');
  else url.searchParams.set('doc', documentId);
  url.hash = anchor;
  history.pushState({}, '', url);
  render();
}

function render(): void {
  tocObserver?.disconnect();
  tocObserver = null;

  const route = currentRoute();
  const currentDocument = route === 'home' ? null : documentById.get(route) ?? null;
  window.document.title = currentDocument ? `${currentDocument.title} — Noah Home Base` : 'Noah Business Home Base';
  app.innerHTML = renderShell(currentDocument);
  syncMobileNavigation(false, false);

  if (currentDocument) enhanceDocumentPage(currentDocument);

  const anchor = window.location.hash.slice(1);
  requestAnimationFrame(() => {
    if (anchor) window.document.getElementById(anchor)?.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  });
}
function syncMobileNavigation(open: boolean, restoreFocus: boolean): void {
  const sidebar = document.querySelector<HTMLElement>('#sidebar-navigation');
  const trigger = document.querySelector<HTMLButtonElement>('.mobile-menu');
  const pageColumn = document.querySelector<HTMLElement>('.page-column');
  const skipLink = document.querySelector<HTMLElement>('.skip-link');
  if (!sidebar || !trigger || !pageColumn || !skipLink) return;

  const shouldOpen = mobileNavigationQuery.matches && open;
  document.body.classList.toggle('menu-open', shouldOpen);
  trigger.setAttribute('aria-expanded', String(shouldOpen));
  trigger.setAttribute('aria-label', shouldOpen ? 'Close navigation' : 'Open navigation');

  if (mobileNavigationQuery.matches) {
    sidebar.inert = !shouldOpen;
    sidebar.setAttribute('aria-hidden', String(!shouldOpen));
  } else {
    sidebar.inert = false;
    sidebar.removeAttribute('aria-hidden');
  }

  pageColumn.inert = shouldOpen;
  skipLink.inert = shouldOpen;
  if (shouldOpen) {
    pageColumn.setAttribute('aria-hidden', 'true');
    skipLink.setAttribute('aria-hidden', 'true');
    requestAnimationFrame(() => sidebar.querySelector<HTMLElement>('[data-doc="home"]')?.focus());
  } else {
    pageColumn.removeAttribute('aria-hidden');
    skipLink.removeAttribute('aria-hidden');
    if (restoreFocus) trigger.focus();
  }
}


function renderShell(document: ParsedDocument | null): string {
  return `
    <div class="site-shell">
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <div class="mobile-scrim" data-action="toggle-menu" aria-hidden="true"></div>
      ${renderSidebar(document?.id ?? 'home')}
      <div class="page-column">
        ${renderTopbar(document)}
        <main id="main-content" class="main-content">
          ${document ? renderDocument(document) : renderDashboard()}
        </main>
      </div>
      ${renderSearchDialog()}
      <div class="toast" id="toast" role="status" aria-live="polite"></div>
    </div>
  `;
}

function renderSidebar(activeId: string): string {
  const progress = reviewProgress();
  const groups: Array<'Home' | 'Identity' | 'Market'> = ['Home', 'Identity', 'Market'];

  return `
    <aside class="sidebar" id="sidebar-navigation" aria-label="Document navigation">
      <button class="brand" data-doc="home" aria-label="Open dashboard">
        <img class="brand-mark" src="./noah-logo.png" alt="" width="42" height="42" decoding="async" />
        <span class="brand-copy"><strong>Noah</strong><small>Business home base</small></span>
      </button>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <p class="nav-label">Workspace</p>
          <button class="nav-item ${activeId === 'home' ? 'is-active' : ''}" data-doc="home" ${activeId === 'home' ? 'aria-current="page"' : ''}>
            <span class="nav-icon">${icon('home')}</span>
            <span>Review dashboard</span>
          </button>
        </div>
        ${groups
          .map((group) => {
            const groupDocuments = documents.filter((document) => document.group === group);
            if (!groupDocuments.length) return '';
            return `
              <div class="nav-group">
                <p class="nav-label">${group}</p>
                ${groupDocuments
                  .map((document) => {
                    const review = getReview(document.id);
                    return `
                      <button class="nav-item ${activeId === document.id ? 'is-active' : ''}" data-doc="${document.id}" ${activeId === document.id ? 'aria-current="page"' : ''}>
                        <span class="nav-icon">${icon('file')}</span>
                        <span class="nav-text">${escapeHtml(document.shortTitle)}</span>
                        <span class="review-dot ${statusMeta[review.status].className}" title="${statusMeta[review.status].label}"></span>
                      </button>
                    `;
                  })
                  .join('')}
              </div>
            `;
          })
          .join('')}
      </nav>

      <div class="sidebar-progress">
        <div class="progress-ring" style="--progress: ${progress}%"><span>${reviewedCount()}/${documents.length}</span></div>
        <div><strong>Review progress</strong><small>Saved in this browser</small></div>
      </div>
      <p class="sidebar-safety">Public edition · private material excluded</p>
    </aside>
  `;
}

function renderTopbar(document: ParsedDocument | null): string {
  return `
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-button mobile-menu" data-action="toggle-menu" aria-label="Open navigation" aria-controls="sidebar-navigation" aria-expanded="false">${icon('menu')}</button>
        <div class="breadcrumb">
          <button data-doc="home">Home base</button>
          ${document ? `<span>/</span><strong>${escapeHtml(document.shortTitle)}</strong>` : ''}
        </div>
      </div>
      <div class="topbar-actions">
        <button class="search-button" data-action="open-search" aria-label="Search documents">
          ${icon('search')}<span>Search</span><kbd>⌘ K</kbd>
        </button>
        <span class="edition-badge">Public review</span>
      </div>
    </header>
  `;
}

function renderDashboard(): string {
  const progress = reviewProgress();
  const changedCount = documents.filter((document) => getReview(document.id).status === 'changes').length;

  return `
    <div class="dashboard">
      <section class="hero-panel">
        <div class="hero-grid" aria-hidden="true"></div>
        <div class="hero-copy">
          <p class="eyebrow"><span></span> Public review workspace</p>
          <h1>Decisions,<br /><em>not decks.</em></h1>
          <p class="hero-lede">Four sourced Draft-0 documents, organized so the team can review the ideas instead of wrestling with raw Markdown.</p>
          <div class="hero-actions">
            <button class="button primary" data-doc="overview">Start with the overview ${icon('arrow')}</button>
            <button class="button secondary" data-action="copy-review">${icon('copy')} Copy review summary</button>
          </div>
        </div>
        <div class="hero-status">
          <div class="hero-orbit" style="--progress: ${progress}%">
            <div><strong>${progress}%</strong><span>reviewed</span></div>
          </div>
          <dl>
            <div><dt>${documents.length}</dt><dd>Public documents</dd></div>
            <div><dt>${openDecisions.length}</dt><dd>Open decisions</dd></div>
            <div><dt>${changedCount}</dt><dd>Need changes</dd></div>
          </dl>
        </div>
      </section>

      <section class="dashboard-section" aria-labelledby="documents-title">
        <div class="section-heading">
          <div><p class="eyebrow muted">Reading room</p><h2 id="documents-title">Review the public set</h2></div>
          <p>Each document carries its sources, unresolved decisions, and a private-to-your-browser review note.</p>
        </div>
        <div class="document-grid">
          ${documents.map(renderDocumentCard).join('')}
        </div>
      </section>

      <section class="dashboard-split" id="decisions">
        <div class="decision-panel">
          <div class="section-heading compact">
            <div><p class="eyebrow muted">Unresolved state</p><h2>Decisions surfaced publicly</h2></div>
            <span class="count-badge">${openDecisions.length}</span>
          </div>
          <div class="decision-list">
            ${openDecisions.map(renderDecisionRow).join('')}
          </div>
        </div>
        <aside class="privacy-panel">
          <div class="privacy-icon">${icon('lock')}</div>
          <p class="eyebrow muted">Deliberately absent</p>
          <h2>Private stays private.</h2>
          <p>This public site contains only the four files classified for public sharing. Team strategy, operating notes, voice corpus, handoff controls, and local review artifacts are not bundled into the site.</p>
          <div class="privacy-rule"><span>4</span> public files included</div>
          <div class="privacy-rule"><span>12</span> restricted files excluded</div>
        </aside>
      </section>

      <section class="review-export-panel">
        <div>
          <p class="eyebrow muted">Your review</p>
          <h2>Take the notes with you.</h2>
          <p>Review status and notes stay in this browser until you copy or export them. Nothing is sent from this static site.</p>
        </div>
        <div class="export-actions">
          <button class="button secondary dark" data-action="copy-review">${icon('copy')} Copy summary</button>
          <button class="button primary" data-action="download-review">${icon('download')} Download notes</button>
        </div>
      </section>
    </div>
  `;
}

function renderDocumentCard(document: ParsedDocument): string {
  const review = getReview(document.id);
  const blockers = document.frontmatter.blocking_questions;
  const blockerCount = Array.isArray(blockers) ? blockers.length : 0;

  return `
    <a class="document-card accent-${document.accent}" href="?doc=${document.id}" data-doc="${document.id}">
      <div class="card-topline">
        <span>${escapeHtml(document.group)}</span>
        <span class="review-pill ${statusMeta[review.status].className}">${statusMeta[review.status].shortLabel}</span>
      </div>
      <div class="card-number">0${document.order}</div>
      <h3>${escapeHtml(document.title)}</h3>
      <p>${escapeHtml(document.description)}</p>
      <div class="card-footer">
        <span>${blockerCount ? `${blockerCount} open ${blockerCount === 1 ? 'decision' : 'decisions'}` : 'No blockers'}</span>
        <span class="card-arrow">${icon('arrow')}</span>
      </div>
    </a>
  `;
}

function renderDecisionRow(decision: OpenDecision): string {
  const sourceNames = decision.sourceIds
    .map((id) => documentById.get(id)?.shortTitle)
    .filter((title): title is string => Boolean(title))
    .join(' · ');

  return `
    <button class="decision-row" data-doc="${decision.sourceIds[0]}">
      <span class="decision-id">${decision.id}</span>
      <span class="decision-copy"><strong>${escapeHtml(decision.question)}</strong><small>${escapeHtml(decision.owner)} · ${escapeHtml(sourceNames)}</small></span>
      <span class="decision-arrow">${icon('arrow')}</span>
    </button>
  `;
}

function renderDocument(document: ParsedDocument): string {
  const rawHtml = marked.parse(document.body, { async: false, gfm: true }) as string;
  const cleanHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
  const status = typeof document.frontmatter.status === 'string' ? document.frontmatter.status : 'draft-0';
  const owner = typeof document.frontmatter.owner === 'string' ? document.frontmatter.owner : 'Noah team';
  const blockers = Array.isArray(document.frontmatter.blocking_questions) ? document.frontmatter.blocking_questions : [];

  return `
    <div class="document-page accent-${document.accent}">
      <header class="document-header">
        <div class="document-header-main">
          <p class="eyebrow"><span></span> ${escapeHtml(document.group)} document · 0${document.order}</p>
          <h1>${escapeHtml(document.title)}</h1>
          <p>${escapeHtml(document.description)}</p>
          <div class="document-badges">
            <span class="status-badge">${escapeHtml(status)}</span>
            <span class="public-badge">Public</span>
            ${blockers.map((blocker) => `<span class="question-badge">${escapeHtml(blocker)}</span>`).join('')}
          </div>
        </div>
        <dl class="document-meta">
          <div><dt>Owner</dt><dd>${escapeHtml(owner)}</dd></div>
          <div><dt>Review date</dt><dd>${escapeHtml(formatDate(document.frontmatter.review_date))}</dd></div>
          <div><dt>Source file</dt><dd><code>${escapeHtml(document.sourcePath)}</code></dd></div>
        </dl>
      </header>

      <div class="reading-layout">
        <article class="prose" id="document-article">${cleanHtml}</article>
        <aside class="toc-rail" aria-label="On this page">
          <p>On this page</p>
          <nav id="table-of-contents"></nav>
          <button class="toc-copy" data-action="copy-link">${icon('copy')} Copy page link</button>
        </aside>
      </div>

      ${renderReviewPanel(document)}
      ${renderDocumentPager(document)}
    </div>
  `;
}

function renderReviewPanel(document: ParsedDocument): string {
  const review = getReview(document.id);
  const saveLabel = unsavedReviewIds.has(document.id)
    ? 'Not saved · export still available'
    : review.updatedAt
      ? `Saved ${new Date(review.updatedAt).toLocaleString()}`
      : 'Not saved yet';
  return `
    <section class="review-panel" aria-labelledby="review-title">
      <div class="review-heading">
        <div><p class="eyebrow muted">Local review</p><h2 id="review-title">What is your read?</h2></div>
        <span class="local-only">Stored only in this browser</span>
      </div>
      <div class="review-options" role="group" aria-label="Review status">
        ${(['approved', 'changes', 'pending'] as ReviewStatus[])
          .map(
            (status) => `
              <button class="review-option ${statusMeta[status].className} ${review.status === status ? 'is-selected' : ''}" data-action="review-status" data-status="${status}" aria-pressed="${review.status === status}">
                <span class="review-symbol"></span>${statusMeta[status].label}
              </button>
            `,
          )
          .join('')}
      </div>
      <label class="review-note-label" for="review-note">Review note</label>
      <textarea id="review-note" data-review-note="${document.id}" rows="5" placeholder="Capture the decision, concern, or exact wording you would change…">${escapeHtml(review.note)}</textarea>
      <div class="review-note-footer">
        <span>${escapeHtml(saveLabel)}</span>
        <button data-action="copy-review">${icon('copy')} Copy all review notes</button>
      </div>
    </section>
  `;
}

function renderDocumentPager(document: ParsedDocument): string {
  const index = documents.findIndex((candidate) => candidate.id === document.id);
  const previous = documents[index - 1];
  const next = documents[index + 1];

  return `
    <nav class="document-pager" aria-label="Adjacent documents">
      ${
        previous
          ? `<button class="pager-link previous" data-doc="${previous.id}"><small>Previous</small><strong>← ${escapeHtml(previous.shortTitle)}</strong></button>`
          : '<span></span>'
      }
      ${
        next
          ? `<button class="pager-link next" data-doc="${next.id}"><small>Next</small><strong>${escapeHtml(next.shortTitle)} →</strong></button>`
          : `<button class="pager-link next" data-doc="home"><small>Finish</small><strong>Review dashboard →</strong></button>`
      }
    </nav>
  `;
}

function renderSearchDialog(): string {
  return `
    <dialog class="search-dialog" id="search-dialog" aria-labelledby="search-title">
      <div class="search-box">
        <div class="search-input-row">
          ${icon('search')}
          <label class="sr-only" for="global-search" id="search-title">Search documents</label>
          <input id="global-search" type="search" autocomplete="off" placeholder="Search the public home base…" />
          <button class="icon-button" data-action="close-search" aria-label="Close search">${icon('close')}</button>
        </div>
        <div class="search-results" id="search-results"></div>
        <div class="search-help"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>esc</kbd> close</span></div>
      </div>
    </dialog>
  `;
}

function enhanceDocumentPage(doc: ParsedDocument): void {
  const article = document.querySelector<HTMLElement>('#document-article');
  if (!article) return;

  enhanceInlineTokens(article);
  enhanceLinks(article, doc.sourcePath);
  buildTableOfContents(article);
}

function enhanceInlineTokens(container: HTMLElement): void {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (parent && !parent.closest('code, pre, a, button, script, style')) textNodes.push(textNode);
    node = walker.nextNode();
  }

  const decisionPattern = /TODO\((Q-\d{2})\s+([^:]+):\s*([^)]+)\)/g;
  for (const textNode of textNodes) {
    const value = textNode.nodeValue ?? '';
    decisionPattern.lastIndex = 0;
    if (!decisionPattern.test(value)) continue;
    decisionPattern.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of value.matchAll(decisionPattern)) {
      const index = match.index ?? 0;
      if (index > cursor) fragment.append(value.slice(cursor, index));
      fragment.append(createDecisionToken(match[2], match[3], match[1]));
      cursor = index + match[0].length;
    }
    if (cursor < value.length) fragment.append(value.slice(cursor));
    textNode.replaceWith(fragment);
  }
}


function sourceLabel(source: string): string {
  if (source.startsWith('gist ')) return 'design gist ↗';
  if (source.startsWith('noah/')) return `repo · ${source.split('/').at(-1) ?? 'source'}`;
  if (source.startsWith('tg:')) return 'team source';
  try {
    return `${new URL(source).hostname.replace(/^www\./, '')} ↗`;
  } catch {
    return 'source';
  }
}
function renderCitationHtml(source: string): string {
  const label = escapeHtml(sourceLabel(source));
  const title = escapeHtml(source);
  const href = source.startsWith('gist ')
    ? 'https://gist.github.com/hsjoberg/8196abaa9ef365f25038f9130b585559'
    : /^https?:\/\//.test(source)
      ? source
      : null;
  if (href) {
    return `<a class="citation-chip" href="${escapeHtml(href)}" title="${title}">${label}</a>`;
  }
  return `<span class="citation-chip" title="${title}">${label}</span>`;
}

function createDecisionToken(owner: string, question: string, id: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'inline-decision';
  button.dataset.decision = id;
  button.title = `${owner.trim()}: ${question.trim()}`;
  button.textContent = `${id} · open decision`;
  return button;
}

function enhanceLinks(container: HTMLElement, currentPath: string): void {
  for (const anchor of container.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const href = anchor.getAttribute('href') ?? '';
    if (!href || href.startsWith('#')) continue;
    if (/^(https?:|mailto:)/.test(href)) {
      if (href.startsWith('http')) {
        anchor.target = '_blank';
        anchor.rel = 'noreferrer';
      }
      continue;
    }

    const [pathPart, hashPart = ''] = href.split('#', 2);
    const normalizedPath = normalizeRelativePath(currentPath, pathPart);
    const publicSource = sourceByPath.get(normalizedPath);
    if (publicSource) {
      anchor.href = `?doc=${publicSource.id}${hashPart ? `#${hashPart}` : ''}`;
      anchor.dataset.doc = publicSource.id;
      if (hashPart) anchor.dataset.anchor = hashPart;
      continue;
    }

    if (excludedReviewPaths[normalizedPath] || normalizedPath.endsWith('.md')) {
      const locked = document.createElement('span');
      locked.className = 'locked-link';
      locked.title = 'Not included in the public review edition';
      locked.append(anchor.textContent ?? normalizedPath);
      const badge = document.createElement('span');
      badge.textContent = 'private';
      locked.append(badge);
      anchor.replaceWith(locked);
    }
  }
}

function normalizeRelativePath(currentPath: string, relativePath: string): string {
  if (relativePath.startsWith('/')) return relativePath.slice(1);
  const segments = currentPath.split('/').slice(0, -1);
  for (const segment of relativePath.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') segments.pop();
    else segments.push(segment);
  }
  return segments.join('/');
}

function buildTableOfContents(article: HTMLElement): void {
  const headings = [...article.querySelectorAll<HTMLElement>('h2, h3')];
  const toc = document.querySelector<HTMLElement>('#table-of-contents');
  if (!toc) return;

  const slugCounts = new Map<string, number>();
  for (const heading of headings) {
    const base = slugify(heading.textContent ?? 'section');
    const count = slugCounts.get(base) ?? 0;
    slugCounts.set(base, count + 1);
    heading.id = count ? `${base}-${count + 1}` : base;
  }

  toc.innerHTML = headings
    .map(
      (heading) =>
        `<a href="#${heading.id}" class="toc-level-${heading.tagName.toLowerCase()}">${escapeHtml(heading.textContent ?? '')}</a>`,
    )
    .join('');

  if (!('IntersectionObserver' in window)) return;
  tocObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      for (const link of toc.querySelectorAll('a')) link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`);
    },
    { rootMargin: '-18% 0px -72% 0px' },
  );
  headings.forEach((heading) => tocObserver?.observe(heading));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}


function openSearch(): void {
  syncMobileNavigation(false, false);
  const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
  const input = document.querySelector<HTMLInputElement>('#global-search');
  if (!dialog || !input) return;
  if (!dialog.open) dialog.showModal();
  input.value = '';
  renderSearchResults('');
  requestAnimationFrame(() => input.focus());
}

function renderSearchResults(query: string): void {
  const results = document.querySelector<HTMLElement>('#search-results');
  if (!results) return;
  const normalized = query.trim().toLowerCase();
  const matches = documents
    .map((document) => {
      const titleMatch = document.title.toLowerCase().includes(normalized);
      const descriptionMatch = document.description.toLowerCase().includes(normalized);
      const contentMatch = document.plainText.toLowerCase().includes(normalized);
      const score = titleMatch ? 3 : descriptionMatch ? 2 : contentMatch ? 1 : 0;
      return { document, score };
    })
    .filter(({ score }) => !normalized || score > 0)
    .sort((a, b) => b.score - a.score || a.document.order - b.document.order);

  if (!matches.length) {
    results.innerHTML = '<div class="search-empty"><strong>No match</strong><span>Try a product, audience, wallet, or decision ID.</span></div>';
    return;
  }

  results.innerHTML = matches
    .map(
      ({ document }) => `
        <button class="search-result" data-doc="${document.id}">
          <span class="search-result-icon">${icon('file')}</span>
          <span><strong>${escapeHtml(document.title)}</strong><small>${escapeHtml(document.description)}</small></span>
          <span class="search-result-group">${escapeHtml(document.group)}</span>
        </button>
      `,
    )
    .join('');
}

function setReviewStatus(documentId: string, status: ReviewStatus): void {
  const current = getReview(documentId);
  reviews = {
    ...reviews,
    [documentId]: { ...current, status, updatedAt: new Date().toISOString() },
  };
  const saved = persistReviews();
  if (saved) unsavedReviewIds.clear();
  else unsavedReviewIds.add(documentId);
  refreshReviewUi(documentId, status, saved);
  showToast(
    saved
      ? `${documentById.get(documentId)?.shortTitle ?? 'Document'} marked “${statusMeta[status].label}”`
      : 'Review changed but could not be saved; export is still available',
  );
}
function refreshReviewUi(documentId: string, status: ReviewStatus, saved: boolean): void {
  for (const option of document.querySelectorAll<HTMLButtonElement>('.review-option')) {
    const selected = option.dataset.status === status;
    option.classList.toggle('is-selected', selected);
    option.setAttribute('aria-pressed', String(selected));
  }

  const navItem = document.querySelector<HTMLElement>(`.nav-item[data-doc="${documentId}"]`);
  const reviewDot = navItem?.querySelector<HTMLElement>('.review-dot');
  if (reviewDot) {
    reviewDot.className = `review-dot ${statusMeta[status].className}`;
    reviewDot.title = statusMeta[status].label;
  }

  const progressRing = document.querySelector<HTMLElement>('.progress-ring');
  progressRing?.style.setProperty('--progress', `${reviewProgress()}%`);
  const progressLabel = progressRing?.querySelector<HTMLElement>('span');
  if (progressLabel) progressLabel.textContent = `${reviewedCount()}/${documents.length}`;

  const savedLabel = document.querySelector<HTMLElement>('.review-note-footer span');
  if (savedLabel) savedLabel.textContent = saved ? 'Saved just now' : 'Not saved · export still available';
}

function updateReviewNote(documentId: string, note: string): void {
  const current = getReview(documentId);
  reviews = {
    ...reviews,
    [documentId]: { ...current, note, updatedAt: new Date().toISOString() },
  };
  const saved = persistReviews();
  if (saved) unsavedReviewIds.clear();
  else unsavedReviewIds.add(documentId);
  const footer = document.querySelector<HTMLElement>('.review-note-footer span');
  if (footer) footer.textContent = saved ? 'Saved just now' : 'Not saved · export still available';
}

function buildReviewMarkdown(): string {
  const lines = [
    '# Noah Public Home Base — Review',
    '',
    `Generated: ${new Date().toLocaleString()}`,
    `Progress: ${reviewedCount()}/${documents.length} documents reviewed`,
    '',
  ];

  for (const document of documents) {
    const review = getReview(document.id);
    lines.push(`## ${document.title}`, '', `Status: **${statusMeta[review.status].label}**`);
    lines.push('', review.note.trim() || '_No note recorded._', '');
  }

  lines.push('## Open decisions surfaced in the public set', '');
  for (const decision of openDecisions) lines.push(`- **${decision.id}** — ${decision.question} (${decision.owner})`);
  lines.push('', '_Review notes are local browser data until explicitly copied or exported._', '');
  return lines.join('\n');
}

async function copyReview(): Promise<void> {
  try {
    await copyText(buildReviewMarkdown());
    showToast('Review summary copied');
  } catch {
    showToast('Review summary could not be copied');
  }
}

function downloadReview(): void {
  const blob = new Blob([buildReviewMarkdown()], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `noah-public-review-${new Date().toISOString().slice(0, 10)}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Review notes downloaded');
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the selection-based copy path.
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    textarea.remove();
  }
  if (!copied) throw new Error('Clipboard copy failed');
}

function showToast(message: string): void {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

app.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-doc], [data-action], [data-decision]');
  if (!target) return;

  const documentId = target.dataset.doc;
  if (documentId) {
    if (
      target instanceof HTMLAnchorElement &&
      (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    ) {
      return;
    }
    event.preventDefault();
    const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
    if (dialog?.open) dialog.close();
    syncMobileNavigation(false, false);
    navigateTo(documentId, target.dataset.anchor ?? '');
    return;
  }

  if (target.dataset.decision) {
    event.preventDefault();
    navigateTo('home', 'decisions');
    return;
  }

  switch (target.dataset.action) {
    case 'toggle-menu': {
      const opening = !document.body.classList.contains('menu-open');
      syncMobileNavigation(opening, !opening);
      break;
    }
    case 'open-search':
      openSearch();
      break;
    case 'close-search':
      document.querySelector<HTMLDialogElement>('#search-dialog')?.close();
      break;
    case 'copy-review':
      void copyReview();
      break;
    case 'download-review':
      downloadReview();
      break;
    case 'copy-link':
      void copyText(window.location.href)
        .then(() => showToast('Page link copied'))
        .catch(() => showToast('Page link could not be copied'));
      break;
    case 'review-status': {
      const route = currentRoute();
      const status = target.dataset.status as ReviewStatus | undefined;
      if (route !== 'home' && status && status in statusMeta) setReviewStatus(route, status);
      break;
    }
  }
});

app.addEventListener('input', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.id === 'global-search') renderSearchResults(target.value);
  if (target instanceof HTMLTextAreaElement && target.dataset.reviewNote) updateReviewNote(target.dataset.reviewNote, target.value);
});

app.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  if (target instanceof HTMLInputElement && target.id === 'global-search' && event.key === 'ArrowDown') {
    event.preventDefault();
    document.querySelector<HTMLButtonElement>('.search-result')?.focus();
    return;
  }
  if (target.matches('.search-result') && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    event.preventDefault();
    const results = [...document.querySelectorAll<HTMLButtonElement>('.search-result')];
    const currentIndex = results.indexOf(target as HTMLButtonElement);
    const offset = event.key === 'ArrowDown' ? 1 : -1;
    results[(currentIndex + offset + results.length) % results.length]?.focus();
    return;
  }
});

window.addEventListener('keydown', (event) => {
  const active = document.activeElement;
  const isTyping = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
    event.preventDefault();
    syncMobileNavigation(false, true);
    return;
  }
  if (event.key === 'Tab' && document.body.classList.contains('menu-open')) {
    const focusable = [
      ...document.querySelectorAll<HTMLElement>('#sidebar-navigation button:not([disabled]), #sidebar-navigation a[href]'),
    ];
    if (focusable.length) {
      event.preventDefault();
      const currentIndex = focusable.indexOf(active as HTMLElement);
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + focusable.length) % focusable.length;
      focusable[nextIndex].focus();
    }
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch();
  } else if (event.key === '/' && !isTyping) {
    event.preventDefault();
    openSearch();
  }
});

mobileNavigationQuery.addEventListener('change', () => syncMobileNavigation(false, false));

window.addEventListener('popstate', render);
render();
