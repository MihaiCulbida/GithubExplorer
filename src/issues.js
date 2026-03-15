const issueStatsSection = document.getElementById('issue-stats-section');
const issueStatsBtn = document.getElementById('issue-stats-btn');
const issueStatsChevron = document.getElementById('issue-stats-chevron');
const issueStatsBody = document.getElementById('issue-stats-body');
const issueStatsLoading = document.getElementById('issue-stats-loading');
const issueStatsContent = document.getElementById('issue-stats-content');
const issueOpenBtn = document.getElementById('issue-open-btn');
const issueClosedBtn = document.getElementById('issue-closed-btn');
const issueTotalBtn = document.getElementById('issue-total-btn');
const issueReposModal = document.getElementById('issue-repos-modal');
const issueReposModalTitle = document.getElementById('issue-repos-modal-title');
const closeIssueReposModal = document.getElementById('close-issue-repos-modal');
const issueReposList = document.getElementById('issue-repos-list');
const issueReposLoading = document.getElementById('issue-repos-loading');
const issueReposSearch = document.getElementById('issue-repos-search');
const issueReposFooter = document.getElementById('issue-repos-footer');
const issueReposCountInfo = document.getElementById('issue-repos-count-info');

let issueStatsLoaded = false;
let issueReposCache = { open: null, closed: null, all: null };
let allIssueReposForFilter = [];

issueStatsBtn.addEventListener('click', function() {
    const isOpen = !issueStatsBody.classList.contains('hidden');
    if (isOpen) {
        issueStatsBody.classList.add('hidden');
        issueStatsChevron.style.transform = 'rotate(90deg)';
    } else {
        issueStatsBody.classList.remove('hidden');
        issueStatsChevron.style.transform = 'rotate(-90deg)';
        if (!issueStatsLoaded) loadIssueStats(currentUsername);
    }
});

async function loadIssueStats(username) {
    issueStatsLoading.classList.remove('hidden');
    issueStatsContent.classList.add('hidden');

    try {
        const [openRes, closedRes] = await Promise.all([
            ghFetch('https://api.github.com/search/issues?q=is:issue+author:' + username + '+is:open&per_page=1'),
            ghFetch('https://api.github.com/search/issues?q=is:issue+author:' + username + '+is:closed&per_page=1')
        ]);
        const [openData, closedData] = await Promise.all([openRes.json(), closedRes.json()]);

        const openCount = openData.total_count || 0;
        const closedCount = closedData.total_count || 0;

        issueOpenBtn.textContent = openCount;
        issueClosedBtn.textContent = closedCount;
        issueTotalBtn.textContent = openCount + closedCount;
        issueStatsLoading.classList.add('hidden');
        issueStatsContent.classList.remove('hidden');
        issueStatsLoaded = true;
    } catch (err) {
        issueStatsLoading.textContent = 'Failed to load issue stats.';
        issueStatsLoading.classList.add('text-red-400');
    }
}

function mergeOpenClosed() {
    const openList = issueReposCache['open'] || [];
    const closedList = issueReposCache['closed'] || [];
    const map = {};
    openList.forEach(function(item) {
        map[item.repo.name] = { repo: item.repo, count: item.count };
    });
    closedList.forEach(function(item) {
        if (map[item.repo.name]) {
            map[item.repo.name].count += item.count;
        } else {
            map[item.repo.name] = { repo: item.repo, count: item.count };
        }
    });
    return Object.values(map).sort(function(a, b) { return b.count - a.count; });
}

function openIssueReposModalWithFilter(filter) {
    const titles = { open: 'Repos with Open Issues', closed: 'Repos with Closed Issues', all: 'Repos with Issues' };
    issueReposModalTitle.textContent = titles[filter] || 'Issues';
    issueReposModal.classList.remove('hidden');
    issueReposModal.classList.add('flex');
    issueReposSearch.value = '';
    issueReposFooter.classList.add('hidden');
    issueReposCountInfo.textContent = '';
    issueReposModal.dataset.filter = filter;

    if (filter === 'all' && issueReposCache['open'] && issueReposCache['closed']) {
        allIssueReposForFilter = mergeOpenClosed();
        issueReposCache['all'] = allIssueReposForFilter;
        renderIssueRepos(allIssueReposForFilter, filter);
        issueReposCountInfo.textContent = 'Showing ' + allIssueReposForFilter.length + ' repo(s)';
        issueReposFooter.classList.remove('hidden');
        return;
    }

    if (issueReposCache[filter]) {
        allIssueReposForFilter = issueReposCache[filter];
        renderIssueRepos(allIssueReposForFilter, filter);
        issueReposCountInfo.textContent = 'Showing ' + allIssueReposForFilter.length + ' repo(s)';
        issueReposFooter.classList.remove('hidden');
        return;
    }

    issueReposList.innerHTML = '';
    issueReposLoading.textContent = 'Loading...';
    issueReposList.appendChild(issueReposLoading);
    loadIssueRepos(currentUsername, filter);
}

async function fetchIssueCount(username, repoName, state) {
    try {
        const res = await ghFetch(
            'https://api.github.com/search/issues?q=is:issue+repo:' + username + '/' + repoName + '+is:' + state + '&per_page=1'
        );
        const data = await res.json();
        return data.total_count || 0;
    } catch (e) {
        return 0;
    }
}

async function loadIssueRepos(username, filter) {
    try {
        const ownRepos = allRepos.filter(function(r) { return !r.fork && r.has_issues; });

        if (filter === 'all') {
            const [openData, closedData] = await Promise.all([
                Promise.all(ownRepos.map(async function(repo) {
                    return { repo: repo, count: await fetchIssueCount(username, repo.name, 'open') };
                })),
                Promise.all(ownRepos.map(async function(repo) {
                    return { repo: repo, count: await fetchIssueCount(username, repo.name, 'closed') };
                }))
            ]);
            issueReposCache['open'] = openData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            issueReposCache['closed'] = closedData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            allIssueReposForFilter = mergeOpenClosed();
            issueReposCache['all'] = allIssueReposForFilter;
        } else {
            const repoIssueData = await Promise.all(
                ownRepos.map(async function(repo) {
                    return { repo: repo, count: await fetchIssueCount(username, repo.name, filter) };
                })
            );
            allIssueReposForFilter = repoIssueData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            issueReposCache[filter] = allIssueReposForFilter;
        }

        renderIssueRepos(allIssueReposForFilter, filter);
        issueReposCountInfo.textContent = 'Showing ' + allIssueReposForFilter.length + ' repo(s)';
        issueReposFooter.classList.remove('hidden');
    } catch (err) {
        issueReposList.innerHTML = '<p class="text-red-400 text-sm text-center py-4">Failed to load repositories.</p>';
    }
}

function renderIssueRepos(items, filter) {
    issueReposList.innerHTML = '';

    if (items.length === 0) {
        issueReposList.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">No repositories found.</p>';
        return;
    }

    const stateParam = filter === 'closed' ? '?state=closed' : (filter === 'open' ? '?state=open' : '');
    const labelColors = { open: 'text-green-400', closed: 'text-red-400', all: 'text-blue-400' };
    const labelColor = labelColors[filter] || 'text-blue-400';

    items.forEach(function(item) {
        const el = document.createElement('a');
        el.href = item.repo.html_url + '/issues' + stateParam;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.className = 'flex items-center justify-between p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition cursor-pointer group';
        el.innerHTML =
            '<div class="min-w-0 flex-1">' +
                '<p class="text-white text-sm font-semibold group-hover:text-blue-400 transition truncate">' + item.repo.name + '</p>' +
                '<p class="text-gray-500 text-xs truncate">' + (item.repo.description || 'No description') + '</p>' +
            '</div>' +
            '<span class="ml-3 shrink-0 text-sm font-bold ' + labelColor + '">' + item.count + ' issue' + (item.count !== 1 ? 's' : '') + '</span>';
        issueReposList.appendChild(el);
    });
}

function closeIssueReposModalFn() {
    issueReposModal.classList.add('hidden');
    issueReposModal.classList.remove('flex');
}

issueReposSearch.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    const filtered = allIssueReposForFilter.filter(function(item) {
        return item.repo.name.toLowerCase().includes(q);
    });
    renderIssueRepos(filtered, issueReposModal.dataset.filter || 'all');
    issueReposCountInfo.textContent = 'Showing ' + filtered.length + ' of ' + allIssueReposForFilter.length + ' repo(s)';
});

issueOpenBtn.addEventListener('click', function() { openIssueReposModalWithFilter('open'); });
issueClosedBtn.addEventListener('click', function() { openIssueReposModalWithFilter('closed'); });
issueTotalBtn.addEventListener('click', function() { openIssueReposModalWithFilter('all'); });

closeIssueReposModal.addEventListener('click', closeIssueReposModalFn);
issueReposModal.addEventListener('click', function(e) {
    if (e.target === issueReposModal) closeIssueReposModalFn();
});