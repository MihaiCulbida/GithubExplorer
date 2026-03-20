const activitySection = document.getElementById('activity-section');
const activityTotal = document.getElementById('activity-total');

async function loadActivityChart(username) {
    activitySection.classList.add('hidden');
    const container = document.getElementById('activity-grid-container');
    if (container) container.innerHTML = '';

    try {
        let dayMap = {};

        if (GITHUB_TOKEN) {
            dayMap = await fetchViaGraphQL(username);
        } else {
            dayMap = await fetchViaEvents(username);
        }

        renderHeatmap(dayMap, username);
    } catch (err) {
        activitySection.classList.add('hidden');
    }
}

async function fetchViaGraphQL(username) {
    const now = new Date();
    const from = new Date(now);
    from.setFullYear(now.getFullYear() - 1);

    const query = `{
      user(login: "${username}") {
        contributionsCollection(from: "${from.toISOString()}", to: "${now.toISOString()}") {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }`;

    const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + GITHUB_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });
    const data = await res.json();
    const weeks = data.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
    const map = {};
    weeks.forEach(function(w) {
        w.contributionDays.forEach(function(d) {
            map[d.date] = d.contributionCount;
        });
    });
    return map;
}

async function fetchViaEvents(username) {
    const map = {};
    try {
        for (let page = 1; page <= 10; page++) {
            const res = await ghFetch(
                'https://api.github.com/users/' + username + '/events?per_page=100&page=' + page
            );
            const events = await res.json();
            if (!Array.isArray(events) || events.length === 0) break;

            events.forEach(function(ev) {
                if (ev.type === 'PushEvent') {
                    const date = ev.created_at.split('T')[0];
                    const commits = ev.payload?.commits?.length || ev.payload?.size || 1;
                    map[date] = (map[date] || 0) + commits;
                }
            });

            if (events.length < 100) break;
        }
    } catch (e) {}
    return map;
}

function renderHeatmap(dayMap, username) {
    const container = document.getElementById('activity-grid-container');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    today.setHours(0,0,0,0);

    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 1);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const days = [];
    const cur = new Date(startDate);
    while (cur <= today) {
        const iso = cur.toISOString().split('T')[0];
        days.push({ date: iso, count: dayMap[iso] || 0 });
        cur.setDate(cur.getDate() + 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const totalCommits = Object.values(dayMap).reduce(function(a, b) { return a + b; }, 0);
    activityTotal.textContent = totalCommits.toLocaleString() + ' contributions in the last year';

    const maxCount = Math.max(...days.map(function(d) { return d.count; }), 1);

    function getColor(count) {
        if (count === 0) return '#161b22';
        const t = Math.min(count / (maxCount * 0.6), 1);
        if (t < 0.25) return '#0e4429';
        if (t < 0.5)  return '#006d32';
        if (t < 0.75) return '#26a641';
        return '#39d353';
    }

    function getColorLight(count) {
        if (count === 0) return '#ebedf0';
        const t = Math.min(count / (maxCount * 0.6), 1);
        if (t < 0.25) return '#9be9a8';
        if (t < 0.5)  return '#40c463';
        if (t < 0.75) return '#30a14e';
        return '#216e39';
    }

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const CELL = 11;
    const GAP = 3;
    const LABEL_H = 18;
    const LABEL_W = 28;
    const totalW = weeks.length * (CELL + GAP) - GAP + LABEL_W + 4;
    const totalH = 7 * (CELL + GAP) - GAP + LABEL_H + 4;

    const monthLabels = [];
    weeks.forEach(function(week, wi) {
        const first = week[0];
        if (!first) return;
        const d = new Date(first.date);
        if (d.getDate() <= 7) {
            monthLabels.push({
                x: LABEL_W + wi * (CELL + GAP),
                label: d.toLocaleString('default', { month: 'short' })
            });
        }
    });

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

    let cells = '';
    weeks.forEach(function(week, wi) {
        week.forEach(function(day, di) {
            if (!day) return;
            const x = LABEL_W + wi * (CELL + GAP);
            const y = LABEL_H + di * (CELL + GAP);
            const color = isDark ? getColor(day.count) : getColorLight(day.count);
            cells += '<rect x="' + x + '" y="' + y + '" width="' + CELL + '" height="' + CELL + '" rx="2"' +
                ' fill="' + color + '"' +
                ' data-date="' + day.date + '" data-count="' + day.count + '"' +
                ' class="hm-cell"/>';
        });
    });

    let mlSvg = '';
    monthLabels.forEach(function(m) {
        mlSvg += '<text x="' + m.x + '" y="12" font-size="10" fill="' + (isDark ? '#8b949e' : '#57606a') + '" font-family="sans-serif">' + m.label + '</text>';
    });

    let dlSvg = '';
    dayLabels.forEach(function(label, i) {
        if (!label) return;
        const y = LABEL_H + i * (CELL + GAP) + CELL - 1;
        dlSvg += '<text x="' + (LABEL_W - 4) + '" y="' + y + '" font-size="10" text-anchor="end" fill="' + (isDark ? '#8b949e' : '#57606a') + '" font-family="sans-serif">' + label + '</text>';
    });

    const legendColors = isDark
        ? ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
        : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

    let legendSvg = '<text x="0" y="11" font-size="10" fill="' + (isDark ? '#8b949e' : '#57606a') + '" font-family="sans-serif">Less</text>';
    legendColors.forEach(function(c, i) {
        legendSvg += '<rect x="' + (32 + i * (CELL + 2)) + '" y="0" width="' + CELL + '" height="' + CELL + '" rx="2" fill="' + c + '"/>';
    });
    legendSvg += '<text x="' + (32 + legendColors.length * (CELL + 2) + 4) + '" y="11" font-size="10" fill="' + (isDark ? '#8b949e' : '#57606a') + '" font-family="sans-serif">More</text>';

    const tooltipEl = document.createElement('div');
    tooltipEl.id = 'hm-tooltip';
    tooltipEl.style.cssText = 'position:absolute;background:' + (isDark ? '#161b22' : '#24292f') + ';color:#fff;font-size:11px;padding:4px 8px;border-radius:5px;pointer-events:none;opacity:0;transition:opacity .1s;white-space:nowrap;font-family:sans-serif;z-index:10;';
    container.style.position = 'relative';
    container.appendChild(tooltipEl);

    const wrap = document.createElement('div');
    wrap.style.cssText = 'overflow-x:auto;';
    wrap.innerHTML =
        '<svg width="' + totalW + '" height="' + totalH + '" style="display:block;cursor:default;">' +
            mlSvg + dlSvg + cells +
        '</svg>' +
        '<div style="display:flex;align-items:center;gap:0;margin-top:8px;justify-content:flex-end;">' +
            '<svg width="' + (32 + legendColors.length * (CELL + 2) + 50) + '" height="14">' + legendSvg + '</svg>' +
        '</div>';
    container.appendChild(wrap);

    wrap.querySelector('svg').addEventListener('mousemove', function(e) {
        const target = e.target.closest ? e.target.closest('.hm-cell') : (e.target.classList.contains('hm-cell') ? e.target : null);
        if (target) {
            const count = target.dataset.count;
            const date = target.dataset.date;
            tooltipEl.textContent = count + ' contribution' + (count !== '1' ? 's' : '') + ' — ' + date;
            tooltipEl.style.opacity = '1';
            const rect = container.getBoundingClientRect();
            let lx = e.clientX - rect.left + 12;
            let ty = e.clientY - rect.top - 32;
            if (lx + 180 > container.offsetWidth) lx = e.clientX - rect.left - 180;
            tooltipEl.style.left = lx + 'px';
            tooltipEl.style.top = ty + 'px';
        } else {
            tooltipEl.style.opacity = '0';
        }
    });
    wrap.querySelector('svg').addEventListener('mouseleave', function() {
        tooltipEl.style.opacity = '0';
    });

    activitySection.classList.remove('hidden');
}