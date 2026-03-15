function ghFetch(url) {
    const headers = { 'Accept': 'application/vnd.github+json' };
    if (GITHUB_TOKEN) headers['Authorization'] = 'Bearer ' + GITHUB_TOKEN;
    return fetch(url, { headers: headers });
}

const searchInput = document.getElementById('search');
const btn = document.getElementById('btn');
const clearBtn = document.getElementById('clear-btn');
const errorMsg = document.getElementById('error-msg');
const mainLayout = document.getElementById('main-layout');
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const loginEl = document.getElementById('login');
const bio = document.getElementById('bio');
const followersEl = document.getElementById('followers');
const followingEl = document.getElementById('following');
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

let currentUsername = '';
let allRepos = [];

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
    followersEl.textContent = user.followers;
    followingEl.textContent = user.following;
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

btn.addEventListener('click', searchUser);

searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') searchUser();
});

searchInput.addEventListener('input', function() {
    clearBtn.classList.toggle('hidden', this.value === '');
});

clearBtn.addEventListener('click', function() {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    searchInput.focus();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeFollowersModal();
        closeFollowingModalFn();
        closeIssueReposModalFn();
        closePrReposModalFn();
    }
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