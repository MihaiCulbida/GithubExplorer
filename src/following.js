const followingCard = document.getElementById('following-card');
const followingModal = document.getElementById('following-modal');
const closeFollowingModal_btn = document.getElementById('close-following-modal');
const followingList = document.getElementById('following-list');
const followingLoading = document.getElementById('following-loading');
const followingSearch = document.getElementById('following-search');
const followingModalFooter = document.getElementById('following-modal-footer');
const followingCountInfo = document.getElementById('following-count-info');

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