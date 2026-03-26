const starredBtn = document.getElementById('starred-btn');
const starredBtnLabel = document.getElementById('starred-btn-label');
const starredRepoTemplate = document.getElementById('starred-repo-template');
let isStarredOpen = false;
let allStarredRepos = [];
let starredLoaded = false;
let starredRenderToken = 0;

function initStarredBtn(username) {
    starredLoaded = false;
    allStarredRepos = [];
    isStarredOpen = false;
    starredBtnLabel.textContent = 'Starred Repos';
    starredBtn.classList.remove('hidden');
    starredBtn.classList.remove('bg-gray-700');
    starredBtn.classList.add('bg-gray-800');
}

starredBtn.addEventListener('click', function () {
    if (!currentUsername) return;

    if (isStarredOpen) {
        closeStarredView();
    } else {
        openStarredView();
    }
});

function openStarredView() {
    isStarredOpen = true;

    starredBtn.classList.add('bg-gray-700');
    starredBtn.classList.remove('bg-gray-800');
    activitySection.classList.add('hidden');
    backBtn.classList.remove('hidden');
    filterBtn.classList.add('hidden');
    repoSearchBtn.classList.add('hidden');
    filterDropdown.classList.add('hidden');
    repoSearchWrapper.style.maxWidth = '0';
    repoSearchWrapper.style.opacity = '0';
    repoSearchInput.value = '';
    reposTitleEl.textContent = 'Starred Repositories';

    list.innerHTML = '';

    if (starredLoaded) {
        renderStarredRepos(allStarredRepos);
    } else {
        renderStarredLoading();
        loadStarredRepos(currentUsername);
    }
}

function closeStarredView() {
    isStarredOpen = false;
    isAllReposOpen = false;

    starredBtn.classList.remove('bg-gray-700');
    starredBtn.classList.add('bg-gray-800');

    resetToPinned();
}

function renderStarredLoading() {
    list.innerHTML = '<div class="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">' +
        '<svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">' +
        '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>' +
        '<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>' +
        'Loading starred repos...</div>';
}

async function loadStarredRepos(username) {
    const myToken = ++starredRenderToken;
    try {
        let page = 1;
        let fetched = [];

        while (true) {
            const res = await ghFetch(
                'https://api.github.com/users/' + username + '/starred?per_page=100&page=' + page
            );
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) break;
            fetched = fetched.concat(data);
            if (data.length < 100) break;
            page++;
        }

        if (myToken !== starredRenderToken) return;

        allStarredRepos = fetched;
        starredLoaded = true;
        starredBtnLabel.textContent = 'Starred Repos' + (fetched.length ? ' (' + fetched.length + ')' : '');

        if (isStarredOpen) {
            renderStarredRepos(allStarredRepos);
        }
    } catch (err) {
        if (myToken !== starredRenderToken) return;
        if (isStarredOpen) {
            list.innerHTML = '<p class="text-red-400 text-sm text-center py-8">Failed to load starred repositories.</p>';
        }
    }
}

function renderStarredRepos(repos) {
    list.innerHTML = '';

    if (repos.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-sm text-center py-10">No starred repositories found.</p>';
        return;
    }

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-3 px-1';
    header.innerHTML =
        '<p class="text-xs text-gray-500">' + repos.length + ' starred repo' + (repos.length !== 1 ? 's' : '') + '</p>' +
        '<input id="starred-search-input" type="text" placeholder="Search..." ' +
        'class="w-44 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-500 transition">';
    list.appendChild(header);

    const container = document.createElement('div');
    container.id = 'starred-repos-container';
    list.appendChild(container);

    renderStarredCards(repos, container);

    document.getElementById('starred-search-input').addEventListener('input', function () {
        const q = this.value.trim().toLowerCase();
        const filtered = q
            ? allStarredRepos.filter(function (r) {
                return r.name.toLowerCase().includes(q) ||
                    (r.description || '').toLowerCase().includes(q) ||
                    (r.owner && r.owner.login.toLowerCase().includes(q));
            })
            : allStarredRepos;
        renderStarredCards(filtered, container);
    });
}

function renderStarredCards(repos, container) {
    container.innerHTML = '';
    if (repos.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">No results found.</p>';
        return;
    }

    repos.forEach(function (repo) {
        const clone = starredRepoTemplate.content.cloneNode(true);

        const ownerAvatar = clone.querySelector('.starred-owner-avatar');
        const ownerLogin = clone.querySelector('.starred-owner-login');
        const repoLink = clone.querySelector('.starred-repo-link');
        const repoDesc = clone.querySelector('.starred-repo-desc');
        const repoStars = clone.querySelector('.starred-repo-stars');
        const repoLang = clone.querySelector('.starred-repo-lang');

        if (repo.owner) {
            ownerAvatar.src = repo.owner.avatar_url || '';
            ownerAvatar.alt = repo.owner.login || '';
            ownerLogin.textContent = repo.owner.login || '';
        }

        repoLink.textContent = repo.full_name || repo.name;
        repoLink.href = repo.html_url;
        repoDesc.textContent = repo.description || 'No description';
        repoStars.textContent = (repo.stargazers_count || 0).toLocaleString();
        repoLang.textContent = repo.language || 'N/A';

        container.appendChild(clone);
    });
}