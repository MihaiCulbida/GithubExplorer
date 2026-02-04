const btn = document.getElementById('btn');
const search = document.getElementById('search');

btn.addEventListener('click', () => {
    const username = search.value;
    fetch(`https://api.github.com/users/${username}`)
        .then(res => res.json())
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
            `;
        });
});