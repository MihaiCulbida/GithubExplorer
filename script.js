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

function searchUser() {
    const username = searchInput.value.trim();
    if (!username) return;

    errorMsg.classList.add('hidden');
    mainLayout.classList.add('hidden');
    mainLayout.classList.remove('flex');

    fetch('https://api.github.com/users/' + username)
        .then(function(res) { return res.json(); })
        .then(function(user) {
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

btn.addEventListener('click', searchUser);
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') searchUser();
});