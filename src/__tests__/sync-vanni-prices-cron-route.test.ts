jest.mock('@/lib/supabase', () => ({
  createAdminClient: jest.fn(),
}));

import { GET } from '@/app/api/cron/sync-vanni-prices/route';
import { createAdminClient } from '@/lib/supabase';

const mockedCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;

describe('GET /api/cron/sync-vanni-prices', () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previousSecret;
  });

  test('falla cerrado cuando CRON_SECRET no está configurado', async () => {
    const response = await GET(new Request('http://localhost/api/cron/sync-vanni-prices', {
      headers: { authorization: 'Bearer undefined' },
    }) as never);

    expect(response.status).toBe(401);
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  test('rechaza un secreto incorrecto', async () => {
    process.env.CRON_SECRET = 'correct-secret';
    const response = await GET(new Request('http://localhost/api/cron/sync-vanni-prices', {
      headers: { authorization: 'Bearer wrong-secret' },
    }) as never);

    expect(response.status).toBe(401);
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  test('aunque el secreto sea válido no muta precios', async () => {
    process.env.CRON_SECRET = 'correct-secret';
    const response = await GET(new Request('http://localhost/api/cron/sync-vanni-prices', {
      headers: { authorization: 'Bearer correct-secret' },
    }) as never);
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.error).toContain('pausada');
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });
});
