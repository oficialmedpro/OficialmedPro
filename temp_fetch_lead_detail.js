(async () => {
  const fetch = globalThis.fetch;
  const base = 'sprinthub-api-master.sprinthub.app';
  const token = '9ad36c85-5858-4960-9935-e73c3698dd0c';
  const instance = 'oficialmed';
  const leadId = 2036;
  const url = 'https://' + base + '/leads/' + leadId + '?i=' + instance + '&allFields=1&apitoken=' + token;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'apitoken': token
    }
  });
  if (!res.ok) {
    console.error('HTTP', res.status, await res.text());
    process.exit(1);
  }
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
})();
