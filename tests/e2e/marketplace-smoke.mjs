import assert from 'node:assert/strict';

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:8081/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return {
    body,
    headers: response.headers,
    ok: response.ok,
    status: response.status
  };
};

const readCookie = (response, name) => {
  const setCookie = response.headers.get('set-cookie') ?? '';
  return setCookie
    .split(',')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split(';')[0];
};

const main = async () => {
  try {
    const health = await request('/health');

    if (!health.ok) {
      throw new Error(`health returned ${health.status}`);
    }
  } catch (error) {
    console.log(`Skipping marketplace smoke test; API is not reachable at ${apiBaseUrl}.`);
    console.log(`Reason: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  const discovery = await request('/auctions?limit=3');
  assert.equal(discovery.status, 200);
  assert.equal(discovery.body.success, true);
  assert.ok(Array.isArray(discovery.body.data.items));

  const email = `smoke-${Date.now()}@bidarena.test`;
  const register = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Smoke Seller',
      email,
      password: 'Password123!'
    })
  });
  assert.equal(register.status, 201);
  assert.equal(register.body.success, true);
  assert.ok(register.body.data.accessToken);

  const refreshCookie = readCookie(register, 'cubid_refresh');
  assert.ok(refreshCookie);

  const createAuction = await request('/auctions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${register.body.data.accessToken}`,
      Cookie: refreshCookie
    },
    body: JSON.stringify({
      title: 'Smoke Test Auction',
      description: 'Created by the smoke runner.',
      imageUrl: 'https://example.com/smoke.jpg',
      currency: 'INR',
      startingBidMinor: 10000,
      minimumIncrementMinor: 1000,
      durationSeconds: 600
    })
  });
  assert.equal(createAuction.status, 201);
  assert.equal(createAuction.body.success, true);
  assert.equal(createAuction.body.data.auction.title, 'Smoke Test Auction');

  const myAuctions = await request('/auctions/me', {
    headers: {
      Authorization: `Bearer ${register.body.data.accessToken}`,
      Cookie: refreshCookie
    }
  });
  assert.equal(myAuctions.status, 200);
  assert.equal(myAuctions.body.success, true);
  assert.ok(myAuctions.body.data.items.some((auction) => auction.id === createAuction.body.data.auction.id));

  console.log('Marketplace smoke test passed.');
};

await main();
