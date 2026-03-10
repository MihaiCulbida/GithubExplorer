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
let currentSort = 'stars';
let isAllReposOpen = false;
let currentUsername = '';
let allFollowers = [];
let repoSearchOpen = false;

function searchUser() {
    const username = searchInput.value.trim();
    if (!username) return;

    currentUsername = username;
    errorMsg.classList.add('hidden');
    mainLayout.classList.add('hidden');
    mainLayout.classList.remove('flex');

    fetch('https://api.github.com/users/' + username)
        .then(function(res) { return res.json(); })
        .then(function(user) {
            if (user.message) throw new Error(user.message);
            showProfile(user)
            loadProfileReadme(username);
            return fetch('https://api.github.com/users/' + username + '/repos?sort=stars&per_page=100');
        })
        .then(function(res) { return res.json(); })
        .then(function(repos) {
            allRepos = repos;
            showRepos(repos);
            loadLanguages(repos, username);
            mainLayout.classList.remove('hidden');
            mainLayout.classList.add('flex');
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
            const res = await fetch(
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
            const res = await fetch(
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
        item.className = 'flex items-center gap3 p-2 rounded-xl hover:bg-gray-800 transition cursor-pointer group';

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
        const res = await fetch(
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
    } catch (err) {
    }
}

async function loadLanguages(repos, username) {
    languagesSection.classList.add('hidden');
    languagesList.innerHTML = '';

    try {
        const requests = repos
            .filter(function(r) { return !r.fork; })
            .map(function(r) {
                return fetch('https://api.github.com/repos/' + username + '/' + r.name + '/languages')
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