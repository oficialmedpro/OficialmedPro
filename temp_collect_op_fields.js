(async () => {
  const fs = await import('node:fs');
  const fetch = globalThis.fetch;
  const base = 'sprinthub-api-master.sprinthub.app';
  const token = '9ad36c85-5858-4960-9935-e73c3698dd0c';
  const instance = 'oficialmed';
  const stages = [130, 231, 82, 101];
  const seenTop = new Set();
  const seenFields = new Set();
  const seenLead = new Set();
  for (const stage of stages) {
    const payload = { page: 0, limit: 20, columnId: stage };
    const url = 'https://' + base + '/crm/opportunities/6?apitoken=' + token + '&i=' + instance;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) continue;
    const data = await res.json();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key === 'fields' || key === 'dataLead') return;
        seenTop.add(key);
      });
      if (item.fields) Object.keys(item.fields).forEach(k => seenFields.add(k));
      if (item.dataLead) Object.keys(item.dataLead).forEach(k => seenLead.add(k));
    });
  }
  const output = {
    top: Array.from(seenTop).sort(),
    fields: Array.from(seenFields).sort(),
    dataLead: Array.from(seenLead).sort()
  };
  fs.writeFileSync('opportunity_fields.json', JSON.stringify(output, null, 2));
})();
