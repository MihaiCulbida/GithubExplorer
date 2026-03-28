let GITHUB_TOKEN = localStorage.getItem('gh_token') || null;

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
const skeletonLayout = document.getElementById('skeleton-layout');
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
const activityTotalEl = document.getElementById('activity-total');

let currentUsername = '';
let allRepos = [];

function showSkeleton() {
    errorMsg.classList.add('hidden');
    mainLayout.classList.add('hidden');
    mainLayout.classList.remove('flex');
    skeletonLayout.classList.remove('hidden');
    skeletonLayout.classList.add('flex');
}

function hideSkeleton() {
    skeletonLayout.classList.add('hidden');
    skeletonLayout.classList.remove('flex');
    mainLayout.classList.remove('hidden');
    mainLayout.classList.add('flex');
}

function searchUser() {
    const username = searchInput.value.trim();
    if (!username) return;
    history.pushState(null, '', '?user=' + encodeURIComponent(username));

    currentUsername = username;
    prStatsLoaded = false;
    issueStatsLoaded = false;
    issueReposCache = { open: null, closed: null, all: null };
    prReposCache = { merged: null, open: null, closed: null, all: null };
    document.getElementById('starred-btn').classList.add('hidden');

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

    showSkeleton();

    ghFetch('https://api.github.com/users/' + username)
        .then(function(res) { return res.json(); })
        .then(function(user) {
            if (user.message) throw new Error(user.message);
            showProfile(user);
            loadProfileReadme(username);
            initStarredBtn(username);
            return ghFetch('https://api.github.com/users/' + username + '/repos?sort=stars&per_page=100');
        })
        .then(function(res) { return res.json(); })
        .then(function(repos) {
            allRepos = repos;
            loadLanguages(repos, username);
            loadActivityChart(username);
            return showRepos(repos);
        })
        .then(function() {
            hideSkeleton();
            prStatsSection.classList.remove('hidden');
            issueStatsSection.classList.remove('hidden');
        })
        .catch(function(err) {
            skeletonLayout.classList.add('hidden');
            skeletonLayout.classList.remove('flex');
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
        closeTokenModalFn();
    }
});

(function() {
    const tokenBtn = document.getElementById('token-btn');
    const tokenBtnLabel = document.getElementById('token-btn-label');
    const tokenModal = document.getElementById('token-modal');
    const closeTokenModalBtn = document.getElementById('close-token-modal');
    const tokenInput = document.getElementById('token-input');
    const tokenSaveBtn = document.getElementById('token-save-btn');
    const tokenStatus = document.getElementById('token-status');
    const tokenToggle = document.getElementById('token-toggle-visibility');
    const tokenClearInput = document.getElementById('token-clear-input');

    function updateTokenBtnState() {
        if (GITHUB_TOKEN) {
            tokenBtnLabel.textContent = 'Token ✓';
            tokenBtn.classList.add('border-green-700', 'text-green-400');
            tokenBtn.classList.remove('border-gray-700', 'text-gray-300');
        } else {
            tokenBtnLabel.textContent = 'Token';
            tokenBtn.classList.remove('border-green-700', 'text-green-400');
            tokenBtn.classList.add('border-gray-700', 'text-gray-300');
        }
    }

    window.closeTokenModalFn = function() {
        tokenModal.classList.add('hidden');
        tokenModal.classList.remove('flex');
    };

    function openTokenModal() {
        tokenInput.value = GITHUB_TOKEN || '';
        tokenClearInput.classList.toggle('hidden', !tokenInput.value);
        tokenStatus.classList.add('hidden');
        tokenModal.classList.remove('hidden');
        tokenModal.classList.add('flex');
        setTimeout(function() { tokenInput.focus(); }, 50);
    }

    tokenBtn.addEventListener('click', openTokenModal);
    closeTokenModalBtn.addEventListener('click', closeTokenModalFn);
    tokenModal.addEventListener('click', function(e) {
        if (e.target === tokenModal) closeTokenModalFn();
    });

    tokenToggle.addEventListener('click', function() {
        const isHidden = tokenInput.type === 'password';
        tokenInput.type = isHidden ? 'text' : 'password';
        tokenToggle.querySelector('img').src = isHidden ? 'img/hide.png' : 'img/show.png';
    });

    tokenInput.addEventListener('input', function() {
        tokenClearInput.classList.toggle('hidden', this.value === '');
    });

    tokenClearInput.addEventListener('click', function() {
        tokenInput.value = '';
        this.classList.add('hidden');
        tokenInput.focus();
    });

    tokenSaveBtn.addEventListener('click', function() {
        const val = tokenInput.value.trim();
        if (!val) {
            tokenStatus.textContent = 'Please enter a valid token.';
            tokenStatus.className = 'text-xs text-center text-red-400';
            tokenStatus.classList.remove('hidden');
            return;
        }
        GITHUB_TOKEN = val;
        localStorage.setItem('gh_token', val);
        updateTokenBtnState();
        tokenStatus.textContent = 'Token saved!';
        tokenStatus.className = 'text-xs text-center text-green-400';
        tokenStatus.classList.remove('hidden');
        setTimeout(closeTokenModalFn, 1200);
    });

    tokenInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') tokenSaveBtn.click();
    });

    updateTokenBtnState();
})();

(function() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    if (user) {
        searchInput.value = user;
        clearBtn.classList.remove('hidden');
        searchUser();
    }
})();