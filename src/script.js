function ghFetch(url) {
    const headers = { 'Accept': 'application/vnd.github+json' };
    if (GITHUB_TOKEN) headers['Authorization'] = 'Bearer ' + GITHUB_TOKEN;
    return fetch(url, { headers: headers });
}

const searchInput = document.getElementById('search');
const btn = document.getElementById('btn');
const errorMsg = document.getElementById('error-msg');
const mainLayout = document.getElementById('main-layout');
const list = document.getElementById('repos-list');
const template = document.getElementById('repo-template');
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const loginEl = document.getElementById('login');
const bio = document.getElementById('bio');
const followers = document.getElementById('followers');
const following = document.getElementById('following');
const reposCount = document.getElementById('repos-count');
const createdAt = document.getElementById('created-at');
const locationRow = document.getElementById('location-row');
const locationEl = document.getElementById('location');
const blogRow = document.getElementById('blog-row');
const blogEl = document.getElementById('blog');
const twitterRow = document.getElementById('twitter-row');
const twitterEl = document.getElementById('twitter');
const companyRow = document.getElementById('company-row');
const companyEl = document.getElementById('company');
const followersCard = document.getElementById('followers-card');
const followersModal = document.getElementById('followers-modal');
const closeModal = document.getElementById('close-modal');
const followersList = document.getElementById('followers-list');
const followersLoading = document.getElementById('followers-loading');
const followersSearch = document.getElementById('followers-search');
const modalFooter = document.getElementById('modal-footer');
const followersCountInfo = document.getElementById('followers-count-info');
const followingCard = document.getElementById('following-card');
const followingModal = document.getElementById('following-modal');
const closeFollowingModal_btn = document.getElementById('close-following-modal');
const followingList = document.getElementById('following-list');
const followingLoading = document.getElementById('following-loading');
const followingSearch = document.getElementById('following-search');
const followingModalFooter = document.getElementById('following-modal-footer');
const followingCountInfo = document.getElementById('following-count-info');
const readmeSection = document.getElementById('readme-section');
const readmeBody = document.getElementById('readme-body');
const readmeTitle = document.getElementById('readme-title');
const languagesSection = document.getElementById('languages-section');
const languagesBtn = document.getElementById('languages-btn');
const languagesList = document.getElementById('languages-list');
const languagesChevron = document.getElementById('languages-chevron');
const filterBtn = document.getElementById('filter-btn');
const filterDropdown = document.getElementById('filter-dropdown');
const filterLabel = document.getElementById('filter-label');
const repoSearchBtn = document.getElementById('repo-search-btn');
const repoSearchWrapper = document.getElementById('repo-search-wrapper');
const repoSearchInput = document.getElementById('repo-search-input');
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
const issueStatsSection = document.getElementById('issue-stats-section');
const issueStatsBtn = document.getElementById('issue-stats-btn');
const issueStatsChevron = document.getElementById('issue-stats-chevron');
const issueStatsBody = document.getElementById('issue-stats-body');
const issueStatsLoading = document.getElementById('issue-stats-loading');
const issueStatsContent = document.getElementById('issue-stats-content');
const issueOpenBtn = document.getElementById('issue-open-btn');
const issueClosedBtn = document.getElementById('issue-closed-btn');
const issueTotalBtn = document.getElementById('issue-total-btn');
const prReposModal = document.getElementById('pr-repos-modal');
const prReposModalTitle = document.getElementById('pr-repos-modal-title');
const closePrReposModal = document.getElementById('close-pr-repos-modal');
const prReposList = document.getElementById('pr-repos-list');
const prReposLoading = document.getElementById('pr-repos-loading');
const prReposSearch = document.getElementById('pr-repos-search');
const prReposFooter = document.getElementById('pr-repos-footer');
const prReposCountInfo = document.getElementById('pr-repos-count-info');

const issueReposModal = document.getElementById('issue-repos-modal');
const issueReposModalTitle = document.getElementById('issue-repos-modal-title');
const closeIssueReposModal = document.getElementById('close-issue-repos-modal');
const issueReposList = document.getElementById('issue-repos-list');
const issueReposLoading = document.getElementById('issue-repos-loading');
const issueReposSearch = document.getElementById('issue-repos-search');
const issueReposFooter = document.getElementById('issue-repos-footer');
const issueReposCountInfo = document.getElementById('issue-repos-count-info');

let currentSort = 'stars';
let isAllReposOpen = false;
let currentUsername = '';
let allFollowers = [];
let repoSearchOpen = false;
let prStatsLoaded = false;
let issueStatsLoaded = false;

let issueReposCache = { open: null, closed: null, all: null };
let prReposCache = { merged: null, open: null, closed: null, all: null };
let allPrReposForFilter = [];
let allIssueReposForFilter = [];

function searchUser() {
    const username = searchInput.value.trim();
    if (!username) return;
    history.pushState(null, '', '?user=' + encodeURIComponent(username));

    currentUsername = username;
    prStatsLoaded = false;
    issueStatsLoaded = false;
    issueReposCache = { open: null, closed: null, all: null };
    prReposCache = { merged: null, open: null, closed: null, all: null };
    errorMsg.classList.add('hidden');
    mainLayout.classList.add('hidden');
    mainLayout.classList.remove('flex');
    prStatsSection.classList.add('hidden');
    prStatsBody.classList.add('hidden');
    prStatsContent.classList.add('hidden');
    prStatsLoading.classList.remove('hidden');
    prStatsLoading.textContent = 'Loading...';
    prStatsChevron.style.transform = 'rotate(90deg)';
    issueStatsSection.classList.add('hidden');
    issueStatsBody.classList.add('hidden');
    issueStatsContent.classList.add('hidden');
    issueStatsLoading.classList.remove('hidden');
    issueStatsLoading.textContent = 'Loading...';
    issueStatsChevron.style.transform = 'rotate(90deg)';

    ghFetch('https://api.github.com/users/' + username)
        .then(function(res) { return res.json(); })
        .then(function(user) {
            if (user.message) throw new Error(user.message);
            showProfile(user);
            loadProfileReadme(username);
            return ghFetch('https://api.github.com/users/' + username + '/repos?sort=stars&per_page=100');
        })
        .then(function(res) { return res.json(); })
        .then(function(repos) {
            allRepos = repos;
            showRepos(repos);
            loadLanguages(repos, username);
            mainLayout.classList.remove('hidden');
            mainLayout.classList.add('flex');
            prStatsSection.classList.remove('hidden');
            issueStatsSection.classList.remove('hidden');
        })
        .catch(function(err) {
            errorMsg.textContent = 'Error: ' + err.message;
            errorMsg.classList.remove('hidden');
        });
}

function showProfile(user) {
    avatar.src = user.avatar_url;
    nameEl.textContent = user.name || user.login;
    loginEl.textContent = '@' + user.login;
    bio.textContent = user.bio || '';
    followers.textContent = user.followers;
    following.textContent = user.following;
    reposCount.textContent = user.public_repos;
    createdAt.textContent = new Date(user.created_at).toLocaleDateString();

    showOrHide(locationRow, locationEl, user.location);
    showOrHide(blogRow, blogEl, user.blog, true);
    showOrHide(twitterRow, twitterEl, user.twitter_username ? '@' + user.twitter_username : null);
    showOrHide(companyRow, companyEl, user.company);
}

function showOrHide(row, valueEl, value, isLink) {
    if (!value) {
        row.classList.add('hidden');
        return;
    }
    valueEl.textContent = value;
    if (isLink) valueEl.href = value;
    row.classList.remove('hidden');
}

function showRepos(repos) {
    const top = repos
        .filter(function(r) { return !r.fork; })
        .sort(function(a, b) { return b.stargazers_count - a.stargazers_count; })
        .slice(0, 6);

    list.innerHTML = '';

    top.forEach(function(repo) {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.repo-link').textContent = repo.name;
        clone.querySelector('.repo-link').href = repo.html_url;
        clone.querySelector('.repo-desc').textContent = repo.description || 'No description';
        clone.querySelector('.repo-stars').textContent = repo.stargazers_count;
        clone.querySelector('.repo-lang').textContent = repo.language || 'N/A';
        list.appendChild(clone);
    });
}

const reposCard = document.getElementById('repos-card');
const backBtn = document.getElementById('back-btn');
let allRepos = [];

reposCard.addEventListener('click', function() {
    if (!currentUsername) return;

    if (isAllReposOpen) {
        isAllReposOpen = false;
        showRepos(allRepos);
        document.getElementById('repos-title').textContent = 'Top Repositories';
        backBtn.classList.add('hidden');
        filterBtn.classList.add('hidden');
        repoSearchBtn.classList.add('hidden');
        repoSearchWrapper.style.maxWidth = '0';
        repoSearchWrapper.style.opacity = '0';
        repoSearchInput.value = '';
        repoSearchOpen = false;
    } else {
        isAllReposOpen = true;
        currentSort = 'stars';
        filterLabel.textContent = 'Filter';
        showAllReposSorted();
        document.getElementById('repos-title').textContent = 'All Repositories';
        backBtn.classList.remove('hidden');
        filterBtn.classList.remove('hidden');
        repoSearchBtn.classList.remove('hidden');
    }
});

backBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    isAllReposOpen = false;
    showRepos(allRepos);
    document.getElementById('repos-title').textContent = 'Top Repositories';
    backBtn.classList.add('hidden');
    filterBtn.classList.add('hidden');
    filterDropdown.classList.add('hidden');
    repoSearchBtn.classList.add('hidden');
    repoSearchWrapper.style.maxWidth = '0';
    repoSearchWrapper.style.opacity = '0';
    repoSearchInput.value = '';
    repoSearchOpen = false;
});

function showAllReposSorted() {
    let sorted = allRepos.filter(function(r) { return !r.fork; });

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
    sorted.forEach(function(repo) {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.repo-link').textContent = repo.name;
        clone.querySelector('.repo-link').href = repo.html_url;
        clone.querySelector('.repo-desc').textContent = repo.description || 'No description';
        clone.querySelector('.repo-stars').textContent = repo.stargazers_count;
        clone.querySelector('.repo-lang').textContent = repo.language || 'N/A';
        list.appendChild(clone);
    });
}

prStatsBtn.addEventListener('click', function() {
    const isOpen = !prStatsBody.classList.contains('hidden');
    if (isOpen) {
        prStatsBody.classList.add('hidden');
        prStatsChevron.style.transform = 'rotate(90deg)';
    } else {
        prStatsBody.classList.remove('hidden');
        prStatsChevron.style.transform = 'rotate(-90deg)';
        if (!prStatsLoaded) {
            loadPRStats(currentUsername);
        }
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
            mergedRes.json(),
            openRes.json(),
            closedRes.json()
        ]);

        const mergedCount = mergedData.total_count || 0;
        const openCount = openData.total_count || 0;
        const closedCount = (closedData.total_count || 0) - mergedCount;
        const totalCount = mergedCount + openCount + closedCount;

        prMergedBtn.textContent = mergedCount;
        prOpenBtn.textContent = openCount;
        prClosedBtn.textContent = closedCount;
        prTotalBtn.textContent = totalCount;

        prStatsLoading.classList.add('hidden');
        prStatsContent.classList.remove('hidden');
        prStatsLoaded = true;
    } catch (err) {
        prStatsLoading.textContent = 'Failed to load PR stats.';
        prStatsLoading.classList.add('text-red-400');
    }
}

issueStatsBtn.addEventListener('click', function() {
    const isOpen = !issueStatsBody.classList.contains('hidden');
    if (isOpen) {
        issueStatsBody.classList.add('hidden');
        issueStatsChevron.style.transform = 'rotate(90deg)';
    } else {
        issueStatsBody.classList.remove('hidden');
        issueStatsChevron.style.transform = 'rotate(-90deg)';
        if (!issueStatsLoaded) {
            loadIssueStats(currentUsername);
        }
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

        const [openData, closedData] = await Promise.all([
            openRes.json(),
            closedRes.json()
        ]);

        const openCount = openData.total_count || 0;
        const closedCount = closedData.total_count || 0;
        const totalCount = openCount + closedCount;

        issueOpenBtn.textContent = openCount;
        issueClosedBtn.textContent = closedCount;
        issueTotalBtn.textContent = totalCount;
        issueStatsLoading.classList.add('hidden');
        issueStatsContent.classList.remove('hidden');
        issueStatsLoaded = true;
    } catch (err) {
        issueStatsLoading.textContent = 'Failed to load issue stats.';
        issueStatsLoading.classList.add('text-red-400');
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
            const filtered = repoData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            prReposCache[filter] = filtered;
            allPrReposForFilter = filtered;
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
        const repo = item.repo;
        const prUrl = repo.html_url + '/pulls' + (filter === 'open' ? '?q=is:open' : filter === 'closed' ? '?q=is:closed' : filter === 'merged' ? '?q=is:merged' : '');

        const el = document.createElement('a');
        el.href = prUrl;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.className = 'flex items-center justify-between p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition cursor-pointer group';

        el.innerHTML =
            '<div class="min-w-0 flex-1">' +
                '<p class="text-white text-sm font-semibold group-hover:text-blue-400 transition truncate">' + repo.name + '</p>' +
                '<p class="text-gray-500 text-xs truncate">' + (repo.description || 'No description') + '</p>' +
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

prMergedBtn.addEventListener('click', function() {
    prReposModal.dataset.filter = 'merged';
    openPrReposModalWithFilter('merged');
});

prOpenBtn.addEventListener('click', function() {
    prReposModal.dataset.filter = 'open';
    openPrReposModalWithFilter('open');
});

prClosedBtn.addEventListener('click', function() {
    prReposModal.dataset.filter = 'closed';
    openPrReposModalWithFilter('closed');
});

prTotalBtn.addEventListener('click', function() {
    prReposModal.dataset.filter = 'all';
    openPrReposModalWithFilter('all');
});

closePrReposModal.addEventListener('click', closePrReposModalFn);
prReposModal.addEventListener('click', function(e) {
    if (e.target === prReposModal) closePrReposModalFn();
});

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
                    const count = await fetchIssueCount(username, repo.name, 'open');
                    return { repo: repo, count: count };
                })),
                Promise.all(ownRepos.map(async function(repo) {
                    const count = await fetchIssueCount(username, repo.name, 'closed');
                    return { repo: repo, count: count };
                }))
            ]);

            issueReposCache['open'] = openData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            issueReposCache['closed'] = closedData.filter(function(i) { return i.count > 0; }).sort(function(a,b){ return b.count - a.count; });
            allIssueReposForFilter = mergeOpenClosed();
            issueReposCache['all'] = allIssueReposForFilter;
        } else {
            const repoIssueData = await Promise.all(
                ownRepos.map(async function(repo) {
                    const count = await fetchIssueCount(username, repo.name, filter);
                    return { repo: repo, count: count };
                })
            );
            const filtered = repoIssueData
                .filter(function(item) { return item.count > 0; })
                .sort(function(a, b) { return b.count - a.count; });
            issueReposCache[filter] = filtered;
            allIssueReposForFilter = filtered;
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
        const repo = item.repo;
        const issuesUrl = repo.html_url + '/issues' + stateParam;

        const el = document.createElement('a');
        el.href = issuesUrl;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.className = 'flex items-center justify-between p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition cursor-pointer group';

        el.innerHTML =
            '<div class="min-w-0 flex-1">' +
                '<p class="text-white text-sm font-semibold group-hover:text-blue-400 transition truncate">' + repo.name + '</p>' +
                '<p class="text-gray-500 text-xs truncate">' + (repo.description || 'No description') + '</p>' +
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

issueOpenBtn.addEventListener('click', function() {
    issueReposModal.dataset.filter = 'open';
    openIssueReposModalWithFilter('open');
});

issueClosedBtn.addEventListener('click', function() {
    issueReposModal.dataset.filter = 'closed';
    openIssueReposModalWithFilter('closed');
});

issueTotalBtn.addEventListener('click', function() {
    issueReposModal.dataset.filter = 'all';
    openIssueReposModalWithFilter('all');
});

closeIssueReposModal.addEventListener('click', closeIssueReposModalFn);
issueReposModal.addEventListener('click', function(e) {
    if (e.target === issueReposModal) closeIssueReposModalFn();
});

function openFollowersModal() {
    followersModal.classList.remove('hidden');
    followersModal.classList.add('flex');
    followersList.innerHTML = '';
    followersSearch.value = '';
    followersLoading.textContent = 'Loading...';
    followersList.appendChild(followersLoading);
    modalFooter.classList.add('hidden');
    allFollowers = [];

    loadAllFollowers(currentUsername);
}

function closeFollowersModal() {
    followersModal.classList.add('hidden');
    followersModal.classList.remove('flex');
}

async function loadAllFollowers(username) {
    try {
        let page = 1;
        let fetched = [];

        while (true) {
            const res = await ghFetch(
                'https://api.github.com/users/' + username + '/followers?per_page=100&page=' + page
            );
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) break;
            fetched = fetched.concat(data);
            if (data.length < 100) break;
            page++;
        }

        allFollowers = fetched;
        renderFollowers(allFollowers);

        followersCountInfo.textContent = 'Showing ' + allFollowers.length + ' follower(s)';
        modalFooter.classList.remove('hidden');
    } catch (err) {
        followersList.innerHTML = '<p class="text-red-400 text-sm text-center py-4">Failed to load followers.</p>';
    }
}

function renderFollowers(list) {
    followersList.innerHTML = '';

    if (list.length === 0) {
        followersList.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">No followers found.</p>';
        return;
    }

    list.forEach(function(user) {
        const item = document.createElement('a');
        item.href = user.html_url;
        item.target = '_blank';
        item.className = 'flex items-center gap-3 p-2 rounded-xl hover:bg-gray-800 transition cursor-pointer group';

        item.innerHTML =
            '<img src="' + user.avatar_url + '" alt="' + user.login + '" class="w-10 h-10 rounded-full border border-gray-700 group-hover:border-blue-500 transition">' +
            '<div>' +
              '<p class="text-white text-sm font-semibold group-hover:text-blue-400 transition">@' + user.login + '</p>' +
              '<p class="text-gray-500 text-xs">github.com/' + user.login + '</p>' +
            '</div>';

        followersList.appendChild(item);
    });
}

followersSearch.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    const filtered = allFollowers.filter(function(u) {
        return u.login.toLowerCase().includes(query);
    });
    renderFollowers(filtered);
    followersCountInfo.textContent = 'Showing ' + filtered.length + ' of ' + allFollowers.length + ' follower(s)';
});

followersCard.addEventListener('click', function() {
    if (!currentUsername) return;
    openFollowersModal();
});

closeModal.addEventListener('click', closeFollowersModal);
followersModal.addEventListener('click', function(e) {
    if (e.target === followersModal) closeFollowersModal();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeFollowersModal();
        closeFollowingModalFn();
        closeIssueReposModalFn();
        closePrReposModalFn();
    }
});

btn.addEventListener('click', searchUser);
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') searchUser();
});

let allFollowing = [];

function openFollowingModal() {
    followingModal.classList.remove('hidden');
    followingModal.classList.add('flex');
    followingList.innerHTML = '';
    followingSearch.value = '';
    followingLoading.textContent = 'Loading...';
    followingList.appendChild(followingLoading);
    followingModalFooter.classList.add('hidden');
    allFollowing = [];

    loadAllFollowing(currentUsername);
}

function closeFollowingModalFn() {
    followingModal.classList.add('hidden');
    followingModal.classList.remove('flex');
}

async function loadAllFollowing(username) {
    try {
        let page = 1;
        let fetched = [];

        while (true) {
            const res = await ghFetch(
                'https://api.github.com/users/' + username + '/following?per_page=100&page=' + page
            );
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) break;
            fetched = fetched.concat(data);
            if (data.length < 100) break;
            page++;
        }

        allFollowing = fetched;
        renderFollowing(allFollowing);

        followingCountInfo.textContent = 'Showing ' + allFollowing.length + ' following';
        followingModalFooter.classList.remove('hidden');
    } catch (err) {
        followingList.innerHTML = '<p class="text-red-400 text-sm text-center py-4">Failed to load following.</p>';
    }
}

function renderFollowing(users) {
    followingList.innerHTML = '';

    if (users.length === 0) {
        followingList.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">No following found.</p>';
        return;
    }

    users.forEach(function(user) {
        const item = document.createElement('a');
        item.href = user.html_url;
        item.target = '_blank';
        item.className = 'flex items-center gap-3 p-2 rounded-xl hover:bg-gray-800 transition cursor-pointer group';

        item.innerHTML =
            '<img src="' + user.avatar_url + '" alt="' + user.login + '" class="w-10 h-10 rounded-full border border-gray-700 group-hover:border-blue-500 transition">' +
            '<div>' +
              '<p class="text-white text-sm font-semibold group-hover:text-blue-400 transition">@' + user.login + '</p>' +
              '<p class="text-gray-500 text-xs">github.com/' + user.login + '</p>' +
            '</div>';

        followingList.appendChild(item);
    });
}

followingSearch.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    const filtered = allFollowing.filter(function(u) {
        return u.login.toLowerCase().includes(query);
    });
    renderFollowing(filtered);
    followingCountInfo.textContent = 'Showing ' + filtered.length + ' of ' + allFollowing.length + ' following';
});

followingCard.addEventListener('click', function() {
    if (!currentUsername) return;
    openFollowingModal();
});

closeFollowingModal_btn.addEventListener('click', closeFollowingModalFn);
followingModal.addEventListener('click', function(e) {
    if (e.target === followingModal) closeFollowingModalFn();
});

const clearBtn = document.getElementById('clear-btn');

searchInput.addEventListener('input', function() {
    clearBtn.classList.toggle('hidden', this.value === '');
});

clearBtn.addEventListener('click', function() {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    searchInput.focus();
});

async function loadProfileReadme(username) {
    readmeSection.classList.add('hidden');
    readmeBody.innerHTML = '';
    readmeTitle.textContent = username + '/README.md';

    try {
        const res = await ghFetch(
            'https://api.github.com/repos/' + username + '/' + username + '/contents/README.md'
        );
        if (!res.ok) return;

        const data = await res.json();
        const markdown = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));

        readmeBody.innerHTML = marked.parse(markdown);
        readmeBody.querySelectorAll('a').forEach(function(a) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        });

        readmeSection.classList.remove('hidden');
    } catch (err) {}
}

async function loadLanguages(repos, username) {
    languagesSection.classList.add('hidden');
    languagesList.innerHTML = '';

    try {
        const requests = repos
            .filter(function(r) { return !r.fork; })
            .map(function(r) {
                return ghFetch('https://api.github.com/repos/' + username + '/' + r.name + '/languages')
                    .then(function(res) { return res.json(); });
            });

        const results = await Promise.all(requests);
        const unique = [...new Set(results.flatMap(function(obj) { return Object.keys(obj); }))];

        if (unique.length === 0) return;

        unique.forEach(function(lang) {
            const tag = document.createElement('span');
            tag.className = 'px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full';
            tag.textContent = lang;
            languagesList.appendChild(tag);
        });

        languagesSection.classList.remove('hidden');
    } catch (err) {}
}

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

languagesBtn.addEventListener('click', function() {
    const isOpen = !languagesList.classList.contains('hidden');
    if (isOpen) {
        languagesList.classList.add('hidden');
        languagesList.classList.remove('flex');
        languagesChevron.style.transform = 'rotate(90deg)';
    } else {
        languagesList.classList.remove('hidden');
        languagesList.classList.add('flex');
        languagesChevron.style.transform = 'rotate(-90deg)';
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
        isAllReposOpen ? showAllReposSorted() : showRepos(allRepos);
    }
});

repoSearchInput.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    const base = isAllReposOpen
        ? allRepos.filter(function(r) { return !r.fork; })
        : allRepos.filter(function(r) { return !r.fork; }).sort(function(a,b){ return b.stargazers_count - a.stargazers_count; }).slice(0, 6);

    const filtered = q ? base.filter(function(r) {
        return r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
    }) : base;

    list.innerHTML = '';
    filtered.forEach(function(repo) {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.repo-link').textContent = repo.name;
        clone.querySelector('.repo-link').href = repo.html_url;
        clone.querySelector('.repo-desc').textContent = repo.description || 'No description';
        clone.querySelector('.repo-stars').textContent = repo.stargazers_count;
        clone.querySelector('.repo-lang').textContent = repo.language || 'N/A';
        list.appendChild(clone);
    });
});

(function() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    if (user) {
        searchInput.value = user;
        clearBtn.classList.remove('hidden');
        searchUser();
    }
})();