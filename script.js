const btn = document.getElementById('btn');
const search = document.getElementById('search');

function searchUser() {
    const username = search.value.trim();
    if (!username) return;

    fetch(`https://api.github.com/users/${username}`)
        .then(res => {
            if (!res.ok) throw new Error('User not found');
            return res.json();
        })
        .then(data => {
        document.getElementById('result').innerHTML = `
            <div class="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
                <div class="flex items-center gap-6">
                    <img src="${data.avatar_url}" class="w-24 h-24 rounded-full border-2 border-blue-500">
                    <div>
                        <h2 class="text-2xl font-bold">${data.name || data.login}</h2>
                        <p class="text-blue-400">@${data.login}</p>
                        <p class="text-gray-400 mt-1">${data.bio || ''}</p>
                    </div>
                </div>
        
                <div class="grid grid-cols-3 gap-4 mt-6 text-center">
                    <div class="bg-gray-800 rounded-xl p-4">
                        <p class="text-2xl font-bold text-blue-400">${data.followers}</p>
                        <p class="text-gray-400 text-sm">Followers</p>
                    </div>
                    <div class="bg-gray-800 rounded-xl p-4">
                        <p class="text-2xl font-bold text-blue-400">${data.following}</p>
                        <p class="text-gray-400 text-sm">Following</p>
                    </div>
                    <div class="bg-gray-800 rounded-xl p-4">
                        <p class="text-2xl font-bold text-blue-400">${data.public_repos}</p>
                        <p class="text-gray-400 text-sm">Repos</p>
                    </div>
                </div>
        
                <div class="mt-6 space-y-2 text-gray-400 text-sm">
                    ${data.location ? `<p>Location: <span class="text-white">${data.location}</span></p>` : ''}
                    ${data.blog ? `<p>Website: <a href="${data.blog}" target="_blank" class="text-blue-400 hover:underline">${data.blog}</a></p>` : ''}
                    ${data.twitter_username ? `<p>Twitter: <span class="text-white">@${data.twitter_username}</span></p>` : ''}
                    ${data.company ? `<p>Company: <span class="text-white">${data.company}</span></p>` : ''}
                    <p>Member since: <span class="text-white">${new Date(data.created_at).toLocaleDateString()}</span></p>
                </div>
        
                <img src="https://github-readme-stats.vercel.app/api?username=${data.login}&show_icons=true&theme=dark" class="mt-6 rounded-xl w-full">
            </div>
            <div id="repos"></div>
        `;

            return fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6`);
        })
        .then(res => res.json())
        .then(repos => {
            const reposHTML = repos.map(repo => `
                <div>
                    <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                    <p>${repo.description || 'No description'}</p>
                    <p>Stars: ${repo.stargazers_count} | Language: ${repo.language || 'N/A'}</p>
                </div>
            `).join('');

            document.getElementById('repos').innerHTML = `<h3>Repositories</h3>${reposHTML}`;
        })
        .catch(err => {
            document.getElementById('result').innerHTML = `<p>Error: ${err.message}</p>`;
        });
}

btn.addEventListener('click', searchUser);

search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchUser();
});