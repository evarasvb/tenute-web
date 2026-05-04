jest.mock('@/lib/admin-auth', () => ({
  isAdminSession: jest.fn(),
  unauthorizedAdminResponse: jest.fn(() => ({
    status: 401,
    json: async () => ({ error: 'No autorizado' }),
  })),
}));

jest.mock('@/lib/competitiveness', () => ({
  getCompetitivenessDataWithAdminClient: jest.fn(),
}));

/**
 * Tests endpoint auth + response contract.
 * Run with: npx jest --testPathPattern=admin-competitiveness-route.test
 */
import { GET } from '@/app/api/admin/competitiveness/route';
import { isAdminSession } from '@/lib/admin-auth';
import { getCompetitivenessDataWithAdminClient } from '@/lib/competitiveness';

const mockedIsAdminSession = isAdminSession as jest.MockedFunction<typeof isAdminSession>;
const mockedGetData = getCompetitivenessDataWithAdminClient as jest.MockedFunction<
  typeof getCompetitivenessDataWithAdminClient
>;

describe('GET /api/admin/competitiveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna 401 cuando no hay sesion admin', async () => {
    mockedIsAdminSession.mockReturnValue(false);
    const request = new Request('http://localhost/api/admin/competitiveness');

    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('No autorizado');
    expect(mockedGetData).not.toHaveBeenCalled();
  });

  test('retorna payload de competitividad cuando hay sesion admin', async () => {
    mockedIsAdminSession.mockReturnValue(true);
    mockedGetData.mockResolvedValue({
      generatedAt: '2026-05-04T00:00:00.000Z',
      adminEmail: 'admin@tenute.cl',
      kpis: {
        sobreMercado: 3,
        enMercado: 4,
        bajoMercado: 5,
        sinReferencia: 2,
      },
      tables: {
        sobreMercado: [],
        bajoMercado: [],
        topVendidos: [],
      },
    });

    const request = new Request('http://localhost/api/admin/competitiveness');
    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.kpis.sobreMercado).toBe(3);
    expect(body.kpis.bajoMercado).toBe(5);
    expect(body.tables.sobreMercado).toEqual([]);
  });
});
