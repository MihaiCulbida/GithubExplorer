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

let currentUsername = '';
let allFollowers = [];

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
            showProfile(user);
            return fetch('https://api.github.com/users/' + username + '/repos?sort=stars&per_page=100');
        })
        .then(function(res) { return res.json(); })
        .then(function(repos) {
            showRepos(repos);
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
    if (e.key === 'Escape') closeFollowersModal();
});


btn.addEventListener('click', searchUser);
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') searchUser();
});