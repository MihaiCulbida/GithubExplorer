const btn = document.getElementById('btn');
const search = document.getElementById('search');

btn.addEventListener('click', () => {
    const username = search.value;
    fetch(`https://api.github.com/users/${username}`)
        .then(res => res.json())
        .then(data => {
            console.log(data); 
        });
});