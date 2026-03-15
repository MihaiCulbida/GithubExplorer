const prStatsSection = document.getElementById('pr-stats-section');
const prStatsBtn = document.getElementById('pr-stats-btn');
const prStatsChevron = document.getElementById('pr-stats-chevron');
const prStatsBody = document.getElementById('pr-stats-body');
const prStatsLoading = document.getElementById('pr-stats-loading');
const prStatsContent = document.getElementById('pr-stats-content');
const prMergedBtn = document.getElementById('pr-merged-btn');
const prOpenBtn = document.getElementById('pr-open-btn');
const prClosedBtn = document.getElementById('pr-closed-btn');
const prTotalBtn = document.getElementById('pr-total-btn');
const prReposModal = document.getElementById('pr-repos-modal');
const prReposModalTitle = document.getElementById('pr-repos-modal-title');
const closePrReposModal = document.getElementById('close-pr-repos-modal');
const prReposList = document.getElementById('pr-repos-list');
const prReposLoading = document.getElementById('pr-repos-loading');
const prReposSearch = document.getElementById('pr-repos-search');
const prReposFooter = document.getElementById('pr-repos-footer');
const prReposCountInfo = document.getElementById('pr-repos-count-info');

let prStatsLoaded = false;
let prReposCache = { merged: null, open: null, closed: null, all: null };
let allPrReposForFilter = [];

prStatsBtn.addEventListener('click', function() {
    const isOpen = !prStatsBody.classList.contains('hidden');
    if (isOpen) {
        prStatsBody.classList.add('hidden');
        prStatsChevron.style.transform = 'rotate(90deg)';
    } else {
        prStatsBody.classList.remove('hidden');
        prStatsChevron.style.transform = 'rotate(-90deg)';
        if (!prStatsLoaded) loadPRStats(currentUsername);
    }
});

async function loadPRStats(username) {
    prStatsLoading.classList.remove('hidden');
    prStatsContent.classList.add('hidden');

    try {
        const [mergedRes, openRes, closedRes] = await Promise.all([
            ghFetch('https://api.github.com/search/issues?q=is:pr+author:' + username + '+is:merged&per_page=1'),
            ghFetch('https://api.github.com/search/issues?q=is:pr+author:' + username + '+is:open&per_page=1'),
            ghFetch('https://api.github.com/search/issues?q=is:pr+author:' + username + '+is:closed&per_page=1')
        ]);
        const [mergedData, openData, closedData] = await Promise.all([
            mergedRes.json(), openRes.json(), closedRes.json()
        ]);

        const mergedCount = mergedData.total_count || 0;
        const openCount = openData.total_count || 0;
        const closedCount = (closedData.total_count || 0) - mergedCount;

        prMergedBtn.textContent = mergedCount;
        prOpenBtn.textContent = openCount;
        prClosedBtn.textContent = closedCount;
        prTotalBtn.textContent = mergedCount + openCount + closedCount;

        prStatsLoading.classList.add('hidden');
        prStatsContent.classList.remove('hidden');
        prStatsLoaded = true;
    } catch (err) {
        prStatsLoading.textContent = 'Failed to load PR stats.';
        prStatsLoading.classList.add('text-red-400');
    }
}

function mergePrFilters(filters) {
    const map = {};
    filters.forEach(function(list) {
        (list || []).forEach(function(item) {
            if (map[item.repo.name]) {
                map[item.repo.name].count += item.count;
            } else {
                map[item.repo.name] = { repo: item.repo, count: item.count };
            }
        });
    });
    return Object.values(map).sort(function(a, b) { return b.count - a.count; });
}

function openPrReposModalWithFilter(filter) {
    const titles = { merged: 'Repos with Merged PRs', open: 'Repos with Open PRs', closed: 'Repos with Closed PRs', all: 'Repos with Pull Requests' };
    prReposModalTitle.textContent = titles[filter] || 'Pull Requests';
    prReposModal.classList.remove('hidden');
    prReposModal.classList.add('flex');
    prReposSearch.value = '';
    prReposFooter.classList.add('hidden');
    prReposCountInfo.textContent = '';
    prReposModal.dataset.filter = filter;

    if (filter === 'all' && prReposCache['merged'] && prReposCache['open'] && prReposCache['closed']) {
        allPrReposForFilter = mergePrFilters([prReposCache['merged'], prReposCache['open'], prReposCache['closed']]);
        prReposCache['all'] = allPrReposForFilter;
        renderPrRepos(allPrReposForFilter, filter);
        prReposCountInfo.textContent = 'Showing ' + allPrReposForFilter.length + ' repo(s)';
        prReposFooter.classList.remove('hidden');
        return;
    }

    if (prReposCache[filter]) {
        allPrReposForFilter = prReposCache[filter];
        renderPrRepos(allPrReposForFilter, filter);
        prReposCountInfo.textContent = 'Showing ' + allPrReposForFilter.length + ' repo(s)';
        prReposFooter.classList.remove('hidden');
        return;
    }

    prReposList.innerHTML = '';
    prReposLoading.textContent = 'Loading...';
    prReposList.appendChild(prReposLoading);
    loadPrRepos(currentUsername, filter);
}

async function fetchPrCount(username, repoName, state) {
    try {
        let q;
        if (state === 'merged') {
            q = 'is:pr+repo:' + username + '/' + repoName + '+is:merged';
        } else if (state === 'closed') {
            q = 'is:pr+repo:' + username + '/' + repoName + '+is:closed+is:unmerged';
        } else {
            q = 'is:pr+repo:' + username + '/' + repoName + '+is:' + state;
        }
        const res = await ghFetch('https://api.github.com/search/issues?q=' + q + '&per_page=1');
        const data = await res.json();
        return data.total_count || 0;
    } catch (e) {
        return 0;
    }
}

async function loadPrRepos(username, filter) {
    try {
        const ownRepos = allRepos.filter(function(r) { return !r.fork; });

        if (filter === 'all') {
            const [mergedData, openData, closedData] = await Promise.all([
                Promise.all(ownRepos.map(async function(repo) {
                    return { repo: repo, count: await fetchPrCount(username, repo.name, 'merged') };
                })),
                Promise.all(ownRepos.map(async function(repo) {
                    return { repo: repo, count: await fetchPrCount(username, repo.name, 'open') };
                })),
                Promise.all(ownRepos.map(async function(repo) {
                    return { repo: repo, count: await fetchPrCount(username, repo.name, 'closed') };
                }))
            ]);
            prReposCache['merged'] = mergedData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            prReposCache['open'] = openData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            prReposCache['closed'] = closedData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            allPrReposForFilter = mergePrFilters([prReposCache['merged'], prReposCache['open'], prReposCache['closed']]);
            prReposCache['all'] = allPrReposForFilter;
        } else {
            const repoData = await Promise.all(
                ownRepos.map(async function(repo) {
                    return { repo: repo, count: await fetchPrCount(username, repo.name, filter) };
                })
            );
            allPrReposForFilter = repoData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            prReposCache[filter] = allPrReposForFilter;
        }

        renderPrRepos(allPrReposForFilter, filter);
        prReposCountInfo.textContent = 'Showing ' + allPrReposForFilter.length + ' repo(s)';
        prReposFooter.classList.remove('hidden');
    } catch (err) {
        prReposList.innerHTML = '<p class="text-red-400 text-sm text-center py-4">Failed to load repositories.</p>';
    }
}

function renderPrRepos(items, filter) {
    prReposList.innerHTML = '';

    if (items.length === 0) {
        prReposList.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">No repositories found.</p>';
        return;
    }

    const labelColors = { merged: 'text-purple-400', open: 'text-green-400', closed: 'text-red-400', all: 'text-blue-400' };
    const labelColor = labelColors[filter] || 'text-blue-400';

    items.forEach(function(item) {
        const prUrl = item.repo.html_url + '/pulls' + (filter === 'open' ? '?q=is:open' : filter === 'closed' ? '?q=is:closed' : filter === 'merged' ? '?q=is:merged' : '');
        const el = document.createElement('a');
        el.href = prUrl;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.className = 'flex items-center justify-between p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition cursor-pointer group';
        el.innerHTML =
            '<div class="min-w-0 flex-1">' +
                '<p class="text-white text-sm font-semibold group-hover:text-blue-400 transition truncate">' + item.repo.name + '</p>' +
                '<p class="text-gray-500 text-xs truncate">' + (item.repo.description || 'No description') + '</p>' +
            '</div>' +
            '<span class="ml-3 shrink-0 text-sm font-bold ' + labelColor + '">' + item.count + ' PR' + (item.count !== 1 ? 's' : '') + '</span>';
        prReposList.appendChild(el);
    });
}

function closePrReposModalFn() {
    prReposModal.classList.add('hidden');
    prReposModal.classList.remove('flex');
}

prReposSearch.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    const filtered = allPrReposForFilter.filter(function(item) {
        return item.repo.name.toLowerCase().includes(q);
    });
    renderPrRepos(filtered, prReposModal.dataset.filter || 'all');
    prReposCountInfo.textContent = 'Showing ' + filtered.length + ' of ' + allPrReposForFilter.length + ' repo(s)';
});

prMergedBtn.addEventListener('click', function() { openPrReposModalWithFilter('merged'); });
prOpenBtn.addEventListener('click', function() { openPrReposModalWithFilter('open'); });
prClosedBtn.addEventListener('click', function() { openPrReposModalWithFilter('closed'); });
prTotalBtn.addEventListener('click', function() { openPrReposModalWithFilter('all'); });

closePrReposModal.addEventListener('click', closePrReposModalFn);
prReposModal.addEventListener('click', function(e) {
    if (e.target === prReposModal) closePrReposModalFn();
});