(async () => {
  const fetch = globalThis.fetch;
  const base = 'sprinthub-api-master.sprinthub.app';
  const token = '9ad36c85-5858-4960-9935-e73c3698dd0c';
  const instance = 'oficialmed';
  const url = 'https://' + base + '/leads?i=' + instance + '&page=0&limit=1&apitoken=' + token;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'apitoken': token
    }
  });
  const text = await res.text();
  console.log('status', res.status);
  console.log(text);
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  console.log(Array.isArray(data) ? 'array' : typeof data);
  if (Array.isArray(data)) {
    console.log(JSON.stringify(data[0], null, 2));
  }
})();
