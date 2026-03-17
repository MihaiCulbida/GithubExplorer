const languagesSection = document.getElementById('languages-section');
const languagesBtn = document.getElementById('languages-btn');
const languagesList = document.getElementById('languages-list');
const languagesChevron = document.getElementById('languages-chevron');

async function loadLanguages(repos, username) {
    languagesSection.classList.add('hidden');
    languagesList.innerHTML = '';
    languagesList.classList.add('hidden');
    languagesList.classList.remove('flex');
    languagesChevron.style.transform = 'rotate(90deg)';

    try {
        const requests = repos
            .filter(function(r) { return !r.fork; })
            .map(function(r) {
                return ghFetch('https://api.github.com/repos/' + username + '/' + r.name + '/languages')
                    .then(function(res) { return res.json(); });
            });

        const results = await Promise.all(requests);
        const unique = [...new Set(results.flatMap(function(obj) { return Object.keys(obj); }))];

        if (unique.length === 0) return;

        unique.forEach(function(lang) {
            const tag = document.createElement('span');
            tag.className = 'px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full';
            tag.textContent = lang;
            languagesList.appendChild(tag);
        });

        languagesSection.classList.remove('hidden');
    } catch (err) {}
}

languagesBtn.addEventListener('click', function() {
    const isOpen = !languagesList.classList.contains('hidden');
    if (isOpen) {
        languagesList.classList.add('hidden');
        languagesList.classList.remove('flex');
        languagesChevron.style.transform = 'rotate(90deg)';
    } else {
        languagesList.classList.remove('hidden');
        languagesList.classList.add('flex');
        languagesChevron.style.transform = 'rotate(-90deg)';
    }
});