// Fetch a few recent samples from ESPN scoreboard endpoints and print concise summaries per game.
// Output: one JSON line per game with fields: league, date, shortName, awayAbbr, awayScore, homeAbbr, homeScore

const endpoints = [
  { league: 'WNBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard?dates=20250601' },
  { league: 'NFL', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20250904' },
  { league: 'CFB', url: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=20250831' },
  { league: 'NBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20250115' }
];

async function main() {
  for (const { league, url } of endpoints) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(JSON.stringify({ league, url, error: `HTTP ${res.status}` }));
        continue;
      }
      const data = await res.json();
      const events = Array.isArray(data.events) ? data.events : [];
      for (const ev of events.slice(0, 4)) {
        const comp = ev?.competitions?.[0];
        if (!comp) continue;
        const home = (comp.competitors || []).find(x => x.homeAway === 'home');
        const away = (comp.competitors || []).find(x => x.homeAway === 'away');
        const status = comp.status?.type?.name;
        const period = comp.status?.period;
        const clock = comp.status?.displayClock;
        const out = {
          league,
          id: ev?.id,
          date: ev?.date,
          shortName: ev?.shortName,
          status,
          period,
          clock,
          awayAbbr: away?.team?.abbreviation,
          awayScore: away?.score ? Number(away.score) : null,
          homeAbbr: home?.team?.abbreviation,
          homeScore: home?.score ? Number(home.score) : null
        };
        console.log(JSON.stringify(out));
      }
    } catch (e) {
      console.error(JSON.stringify({ league, url, error: String(e?.message || e) }));
    }
  }
}

main();



