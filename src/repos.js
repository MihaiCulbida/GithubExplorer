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
let isAllReposOpen = false;
let repoSearchOpen = false;

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

function showAllReposSorted() {
    let sorted = currentSort === 'forks'
        ? allRepos.filter(function(r) { return r.fork; })
        : allRepos.filter(function(r) { return !r.fork; });

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
        filterLabel.textContent = 'Filter';
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
        const labels = { all: 'All', stars: 'Stars', 'name-az': 'Name (A-Z)', 'name-za': 'Name (Z-A)', forks: 'Forks' };
        filterLabel.textContent = labels[currentSort];
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

    const filtered = q ? base.filter(function(r) {
        return r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
    }) : base;

    list.innerHTML = '';
    filtered.forEach(function(repo) { renderRepoCard(repo); });
});