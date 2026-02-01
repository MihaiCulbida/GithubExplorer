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
                <img src="${data.avatar_url}" width="100">
                <h2>${data.name}</h2>
                <p>@${data.login}</p>
                <p>Bio: ${data.bio || 'N/A'}</p>
                <p>Location: ${data.location || 'N/A'}</p>
                <p>Website: ${data.blog || 'N/A'}</p>
                <p>Twitter: ${data.twitter_username || 'N/A'}</p>
                <p>Company: ${data.company || 'N/A'}</p>
                <p>Followers: ${data.followers}</p>
                <p>Following: ${data.following}</p>
                <p>Public Repos: ${data.public_repos}</p>
                <p>Member since: ${new Date(data.created_at).toLocaleDateString()}</p>
                <img src="https://github-readme-stats.vercel.app/api?username=${data.login}&show_icons=true">
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