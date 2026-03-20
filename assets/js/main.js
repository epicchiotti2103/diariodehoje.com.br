/* ══════════════════════════════════════════════════════════════
   diariodehoje.com.br — Main JS
   PostHog + RSS Proxy + Mobile Nav
   ══════════════════════════════════════════════════════════════ */

// ─── Config ───
const RSS_PROXY = "https://rss-proxy-ugzah7lydq-rj.a.run.app";
const CATEGORIES = ["brasil", "mundo", "economia", "esporte", "tecnologia"];
const ITEMS_PER_CATEGORY = 12;

// ─── PostHog ───
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_TkTy3hnKuJf3XOWsPjvKW8MHdNt2zCCWGQXFLLzNxuQ', {
  api_host: 'https://ph.diariodehoje.com.br',
  person_profiles: 'identified_only',
});

// ─── Utility: Tempo relativo ───
function timeAgo(isoDate) {
  if (!isoDate) return "";
  const now = new Date();
  const past = new Date(isoDate);
  const diffMs = now - past;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ontem";
  if (diffD < 7) return `há ${diffD} dias`;

  return past.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

// ─── Utility: Categoria display name ───
function catLabel(cat) {
  const labels = {
    brasil: "Brasil",
    mundo: "Mundo",
    economia: "Economia",
    esporte: "Esporte",
    tecnologia: "Tecnologia",
  };
  return labels[cat] || cat;
}

// ─── Skeleton Cards ───
function renderSkeletons(container, count = 6) {
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `
      <div class="news-card skeleton-card">
        <div class="news-card-img skeleton" style="aspect-ratio:16/9"></div>
        <div class="news-card-body">
          <div class="skeleton skel-line" style="height:0.6rem;width:30%;margin-bottom:0.75rem"></div>
          <div class="skeleton skel-line" style="height:1.1rem;margin-bottom:0.4rem"></div>
          <div class="skeleton skel-line" style="height:1.1rem;width:80%;margin-bottom:0.75rem"></div>
          <div class="skeleton skel-line" style="height:0.8rem;margin-bottom:0.3rem"></div>
          <div class="skeleton skel-line skel-line-short" style="height:0.8rem"></div>
        </div>
      </div>`;
  }
  container.innerHTML = html;
}

// ─── Render News Card ───
function renderCard(item, isHero = false) {
  const imgHtml = item.image
    ? `<img src="${item.image}" alt="${item.title}" loading="lazy">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--secondary);font-family:var(--font-label);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em">${catLabel(item.category)}</div>`;

  const descHtml = item.description && item.description.length > 20
    ? `<p>${item.description}</p>`
    : "";

  if (isHero) {
    return `
      <a class="news-hero" href="${item.link}" target="_blank" rel="noopener">
        <div class="news-card-img">${imgHtml}</div>
        <div class="news-card-body">
          <div class="news-card-meta">
            <span class="cat">${catLabel(item.category)}</span>
            <span>${item.source} • ${timeAgo(item.published)}</span>
          </div>
          <h3>${item.title}</h3>
          ${descHtml}
        </div>
      </a>`;
  }

  return `
    <a class="news-card" href="${item.link}" target="_blank" rel="noopener">
      <div class="news-card-img">${imgHtml}</div>
      <div class="news-card-body">
        <div class="news-card-meta">
          <span class="cat">${catLabel(item.category)}</span>
          <span>${item.source} • ${timeAgo(item.published)}</span>
        </div>
        <h3>${item.title}</h3>
        ${descHtml}
      </div>
    </a>`;
}

// ─── Fetch & Render News ───
async function loadNews(category = "") {
  const grid = document.getElementById("news-grid");
  const tabsContainer = document.getElementById("cat-tabs");

  if (!grid) return;

  renderSkeletons(grid);

  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("limit", ITEMS_PER_CATEGORY.toString());

    const url = `${RSS_PROXY}?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--secondary);padding:2rem">Nenhuma notícia encontrada.</p>`;
      return;
    }

    // Render cards — first one as hero
    let html = "";
    data.items.forEach((item, i) => {
      html += renderCard(item, i === 0);
    });
    grid.innerHTML = html;

    // Update active tab
    if (tabsContainer) {
      tabsContainer.querySelectorAll(".cat-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.cat === category);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar notícias:", err);
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--secondary);padding:2rem">Erro ao carregar notícias. Tente novamente.</p>`;
  }
}

// ─── Sidebar: Most Read (from RSS) ───
async function loadMostRead() {
  const container = document.getElementById("most-read");
  if (!container) return;

  try {
    const res = await fetch(`${RSS_PROXY}?limit=5`);
    const data = await res.json();

    if (!data.items) return;

    let html = "";
    data.items.slice(0, 5).forEach((item, i) => {
      html += `
        <a class="most-read-item" href="${item.link}" target="_blank" rel="noopener">
          <span class="most-read-num">${String(i + 1).padStart(2, "0")}</span>
          <div>
            <div class="most-read-title">${item.title}</div>
            <div class="most-read-meta">${catLabel(item.category)} • ${item.source}</div>
          </div>
        </a>`;
    });
    container.innerHTML = html;
  } catch (err) {
    console.error("Erro ao carregar mais lidas:", err);
  }
}

// ─── Mobile Menu ───
function initMobileMenu() {
  const btnOpen = document.getElementById("btn-menu-open");
  const btnClose = document.getElementById("btn-menu-close");
  const menu = document.getElementById("mobile-menu");

  if (!btnOpen || !menu) return;

  btnOpen.addEventListener("click", () => menu.classList.add("open"));
  btnClose?.addEventListener("click", () => menu.classList.remove("open"));

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => menu.classList.remove("open"));
  });
}

// ─── Category Tabs ───
function initCategoryTabs() {
  const tabsContainer = document.getElementById("cat-tabs");
  if (!tabsContainer) return;

  tabsContainer.addEventListener("click", (e) => {
    const tab = e.target.closest(".cat-tab");
    if (!tab) return;

    const cat = tab.dataset.cat || "";
    loadNews(cat);
  });
}

// ─── Date bar ───
function initDateBar() {
  const el = document.getElementById("date-today");
  if (!el) return;

  const now = new Date();
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  el.textContent = now.toLocaleDateString("pt-BR", options);
}

// ─── Init ───
document.addEventListener("DOMContentLoaded", () => {
  initDateBar();
  initMobileMenu();
  initCategoryTabs();

  // Load news if on homepage
  if (document.getElementById("news-grid")) {
    loadNews();
    loadMostRead();
  }
});
