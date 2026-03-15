const followersCard = document.getElementById('followers-card');
const followersModal = document.getElementById('followers-modal');
const closeModal = document.getElementById('close-modal');
const followersList = document.getElementById('followers-list');
const followersLoading = document.getElementById('followers-loading');
const followersSearch = document.getElementById('followers-search');
const modalFooter = document.getElementById('modal-footer');
const followersCountInfo = document.getElementById('followers-count-info');

let allFollowers = [];

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