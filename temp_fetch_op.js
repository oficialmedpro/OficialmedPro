(async () => {
  const fetch = globalThis.fetch;
  const base = 'sprinthub-api-master.sprinthub.app';
  const token = '9ad36c85-5858-4960-9935-e73c3698dd0c';
  const instance = 'oficialmed';
  const payload = { page: 0, limit: 1, columnId: 130 };
  const url = 'https://' + base + '/crm/opportunities/6?apitoken=' + token + '&i=' + instance;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    console.error('HTTP', res.status, await res.text());
    process.exit(1);
  }
  const data = await res.json();
  console.log(JSON.stringify(data[0], null, 2));
})().catch(err => { console.error(err); process.exit(1); });
