const readmeSection = document.getElementById('readme-section');
const readmeBody = document.getElementById('readme-body');
const readmeTitle = document.getElementById('readme-title');

async function loadProfileReadme(username) {
    readmeSection.classList.add('hidden');
    readmeBody.innerHTML = '';
    readmeTitle.textContent = username + '/README.md';

    try {
        const res = await ghFetch(
            'https://api.github.com/repos/' + username + '/' + username + '/contents/README.md'
        );
        if (!res.ok) return;

        const data = await res.json();
        const markdown = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));

        readmeBody.innerHTML = marked.parse(markdown);
        readmeBody.querySelectorAll('a').forEach(function(a) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        });

        readmeSection.classList.remove('hidden');
    } catch (err) {}
}