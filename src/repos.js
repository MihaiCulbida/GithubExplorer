const list = document.getElementById('repos-list');
const template = document.getElementById('repo-template');
const reposCard = document.getElementById('repos-card');
const backBtn = document.getElementById('back-btn');
const filterBtn = document.getElementById('filter-btn');
const filterDropdown = document.getElementById('filter-dropdown');
const filterLabel = document.getElementById('filter-label');
const repoSearchBtn = document.getElementById('repo-search-btn');
const repoSearchWrapper = document.getElementById('repo-search-wrapper');
const repoSearchInput = document.getElementById('repo-search-input');
const reposTitleEl = document.getElementById('repos-title');

let currentSort = 'stars';
let currentLangFilter = null;
let isAllReposOpen = false;
let repoSearchOpen = false;
let reposRenderToken = 0;
let langDropdownExpanded = false;

async function loadPinnedRepos(username) {
    const query = `
    {
      user(login: "${username}") {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              url
              stargazerCount
              primaryLanguage { name }
              forkCount
            }
          }
        }
      }
    }`;

    const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + GITHUB_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });

    const data = await res.json();
    return data.data?.user?.pinnedItems?.nodes || [];
}

async function showRepos(repos) {
    const myToken = ++reposRenderToken;

    list.innerHTML = '';
    backBtn.classList.add('hidden');
    filterBtn.classList.add('hidden');
    repoSearchBtn.classList.add('hidden');
    isAllReposOpen = false;
    repoSearchOpen = false;
    repoSearchWrapper.style.maxWidth = '0';
    repoSearchWrapper.style.opacity = '0';
    repoSearchInput.value = '';
    filterDropdown.classList.add('hidden');

    const pinned = await loadPinnedRepos(currentUsername);
    if (myToken !== reposRenderToken) return;

    if (pinned.length > 0) {
        pinned.forEach(function(repo) {
            renderRepoCard({
                name: repo.name,
                description: repo.description,
                html_url: repo.url,
                stargazers_count: repo.stargazerCount,
                language: repo.primaryLanguage?.name || null,
                forks_count: repo.forkCount
            });
        });
    } else {
        reposTitleEl.textContent = 'No pinned repositories';
    }
}

function getRepoLanguages() {
    const langs = new Set();
    allRepos.filter(function(r) { return !r.fork; }).forEach(function(r) {
        if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
}

function buildLanguageFilter(langs) {
    const existing = filterDropdown.querySelector('.lang-filter-section');
    if (existing) existing.remove();

    if (langs.length === 0) return;

    const SHOW_MAX = 6;
    langDropdownExpanded = false;

    const section = document.createElement('div');
    section.className = 'lang-filter-section';

    const divider = document.createElement('div');
    divider.className = 'border-t border-gray-700 mx-2 my-1';
    section.appendChild(divider);

    const label = document.createElement('p');
    label.className = 'px-4 pt-1.5 pb-1 text-xs text-gray-500 font-semibold uppercase tracking-wider';
    label.textContent = 'Language';
    section.appendChild(label);

    const langList = document.createElement('div');
    langList.className = 'lang-list';
    section.appendChild(langList);

    function renderLangItems() {
        langList.innerHTML = '';
        const visible = langDropdownExpanded ? langs : langs.slice(0, SHOW_MAX);

        visible.forEach(function(lang) {
            const btn = document.createElement('button');
            btn.className = 'filter-lang-option w-full text-left px-4 py-2 text-sm transition flex items-center justify-between ' +
                (currentLangFilter === lang ? 'text-blue-400 bg-gray-800' : 'text-gray-300 hover:bg-gray-800');
            btn.dataset.lang = lang;

            const langSpan = document.createElement('span');
            langSpan.textContent = lang;
            btn.appendChild(langSpan);

            if (currentLangFilter === lang) {
                const check = document.createElement('span');
                check.textContent = '✓';
                check.className = 'text-blue-400 text-xs';
                btn.appendChild(check);
            }

            btn.addEventListener('click', function() {
                if (currentLangFilter === lang) {
                    currentLangFilter = null;
                } else {
                    currentLangFilter = lang;
                }
                filterDropdown.classList.add('hidden');
                updateFilterLabel();
                showAllReposSorted();
                buildLanguageFilter(langs);
            });

            langList.appendChild(btn);
        });

        if (langs.length > SHOW_MAX) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'w-full text-left px-4 py-2 text-xs text-blue-400 hover:bg-gray-800 transition font-medium';
            toggleBtn.textContent = langDropdownExpanded
                ? 'See less'
                : '+ ' + (langs.length - SHOW_MAX) + ' more languages';

            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                langDropdownExpanded = !langDropdownExpanded;
                renderLangItems();
            });

            langList.appendChild(toggleBtn);
        }
    }

    renderLangItems();
    filterDropdown.appendChild(section);
}

function updateFilterLabel() {
    const sortLabels = { all: 'All', stars: 'Stars', 'name-az': 'Name (A-Z)', 'name-za': 'Name (Z-A)', forks: 'Forks' };
    let label = sortLabels[currentSort] || 'Filter';
    if (currentLangFilter) label += ' · ' + currentLangFilter;
    filterLabel.textContent = label;
}

function showAllReposSorted() {
    let sorted = currentSort === 'forks'
        ? allRepos.filter(function(r) { return r.fork; })
        : allRepos.filter(function(r) { return !r.fork; });

    if (currentLangFilter) {
        sorted = sorted.filter(function(r) { return r.language === currentLangFilter; });
    }

    if (currentSort === 'stars') {
        sorted.sort(function(a, b) { return b.stargazers_count - a.stargazers_count; });
    } else if (currentSort === 'name-az') {
        sorted.sort(function(a, b) { return a.name.localeCompare(b.name); });
    } else if (currentSort === 'name-za') {
        sorted.sort(function(a, b) { return b.name.localeCompare(a.name); });
    } else if (currentSort === 'forks') {
        sorted.sort(function(a, b) { return b.forks_count - a.forks_count; });
    }

    list.innerHTML = '';

    if (sorted.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'text-gray-500 text-sm text-center py-10';
        empty.textContent = 'No repositories found' + (currentLangFilter ? ' for ' + currentLangFilter : '') + '.';
        list.appendChild(empty);
        return;
    }

    sorted.forEach(function(repo) { renderRepoCard(repo); });
}

function renderRepoCard(repo) {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.repo-link').textContent = repo.name;
    clone.querySelector('.repo-link').href = repo.html_url;
    clone.querySelector('.repo-desc').textContent = repo.description || 'No description';
    clone.querySelector('.repo-stars').textContent = repo.stargazers_count;
    clone.querySelector('.repo-lang').textContent = repo.language || 'N/A';
    list.appendChild(clone);
}

function resetToPinned() {
    isAllReposOpen = false;
    repoSearchOpen = false;
    currentLangFilter = null;
    backBtn.classList.add('hidden');
    filterBtn.classList.add('hidden');
    repoSearchBtn.classList.add('hidden');
    filterDropdown.classList.add('hidden');
    repoSearchWrapper.style.maxWidth = '0';
    repoSearchWrapper.style.opacity = '0';
    repoSearchInput.value = '';
    reposTitleEl.textContent = 'Pinned Repositories';
    showRepos(allRepos);
    activitySection.classList.remove('hidden');
}

reposCard.addEventListener('click', function() {
    if (!currentUsername) return;
    if (isAllReposOpen) {
        resetToPinned();
    } else {
        isAllReposOpen = true;
        currentSort = 'stars';
        currentLangFilter = null;
        filterLabel.textContent = 'Filter';
        langDropdownExpanded = false;

        const langs = getRepoLanguages();
        buildLanguageFilter(langs);

        showAllReposSorted();
        reposTitleEl.textContent = 'All Repositories';
        backBtn.classList.remove('hidden');
        filterBtn.classList.remove('hidden');
        repoSearchBtn.classList.remove('hidden');
        activitySection.classList.add('hidden');
    }
});

backBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    resetToPinned();
});

filterBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    filterDropdown.classList.toggle('hidden');
});

document.querySelectorAll('.filter-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
        currentSort = this.dataset.sort;
        updateFilterLabel();
        filterDropdown.classList.add('hidden');
        showAllReposSorted();
    });
});

document.addEventListener('click', function(e) {
    if (!filterDropdown.classList.contains('hidden') && !filterBtn.contains(e.target)) {
        filterDropdown.classList.add('hidden');
    }
});

repoSearchBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    repoSearchOpen = !repoSearchOpen;
    if (repoSearchOpen) {
        repoSearchWrapper.style.maxWidth = '180px';
        repoSearchWrapper.style.opacity = '1';
        setTimeout(function() { repoSearchInput.focus(); }, 150);
    } else {
        repoSearchWrapper.style.maxWidth = '0';
        repoSearchWrapper.style.opacity = '0';
        repoSearchInput.value = '';
        showAllReposSorted();
    }
});

repoSearchInput.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    const base = isAllReposOpen
        ? (currentSort === 'forks'
            ? allRepos.filter(function(r) { return r.fork; })
            : allRepos.filter(function(r) { return !r.fork; }))
        : allRepos.filter(function(r) { return !r.fork; })
            .sort(function(a,b){ return b.stargazers_count - a.stargazers_count; })
            .slice(0, 6);

    let filtered = currentLangFilter
        ? base.filter(function(r) { return r.language === currentLangFilter; })
        : base;

    if (q) {
        filtered = filtered.filter(function(r) {
            return r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
        });
    }

    list.innerHTML = '';
    if (filtered.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'text-gray-500 text-sm text-center py-10';
        empty.textContent = 'No repositories found.';
        list.appendChild(empty);
        return;
    }
    filtered.forEach(function(repo) { renderRepoCard(repo); });
});