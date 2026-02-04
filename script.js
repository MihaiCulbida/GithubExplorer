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
                <p>Followers: ${data.followers}</p>
                <p>Repos: ${data.public_repos}</p>
                <p>Bio: ${data.bio}</p>
            `;
        });
});