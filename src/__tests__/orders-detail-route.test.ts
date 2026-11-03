jest.mock('@/lib/supabase', () => ({
  createAdminClient: jest.fn(),
}));

import { GET } from '@/app/api/orders/[id]/route';
import { createAdminClient } from '@/lib/supabase';

const mockedCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;
const id = '507f1f77-bcf8-4cd7-8994-439011abcdef';
const wrongId = '607f1f77-bcf8-4cd7-8994-439011abcdef';
const number = 'TEN-20261103-000001';
const fields = [
  'order_number', 'created_at', 'status', 'customer_name', 'customer_phone',
  'customer_email', 'customer_rut', 'shipping_method', 'shipping_cost',
  'shipping_address', 'shipping_commune', 'shipping_city', 'shipping_region',
  'tracking_number', 'subtotal', 'total',
];
const itemFields = ['id', 'product_image_url', 'product_name', 'unit_price', 'quantity', 'subtotal'];
const order = {
  ...Object.fromEntries(fields.map((field) => [field, field])),
  id, order_number: number, admin_notes: 'internal', flow_token: 'internal',
  payment_id: 'internal', mercadopago_preference_id: 'internal',
  items: [{ ...Object.fromEntries(itemFields.map((field) => [field, field])), order_id: id, internal: true }],
};

function get(identifier: string, token?: string) {
  return GET(new Request(`http://localhost/api/orders/${identifier}${token === undefined ? '' : `?t=${token}`}`), {
    params: { id: identifier },
  });
}

describe('GET /api/orders/[id]', () => {
  let query: { select: jest.Mock; eq: jest.Mock; single: jest.Mock; returns: jest.Mock };
  let filters: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    filters = {};
    query = {
      select: jest.fn().mockReturnThis(),
      returns: jest.fn().mockReturnThis(),
      eq: jest.fn(function (field: string, value: string) {
        filters[field] = value;
        return query;
      }),
      single: jest.fn(async () => ({
        data: filters.id === id && (!filters.order_number || filters.order_number === number) ? order : null,
        error: null,
      })),
    };
    mockedCreateAdminClient.mockReturnValue({ from: jest.fn(() => query) } as never);
  });

  test.each([undefined, 'invalid-uuid'])('rechaza número sin token válido (%s) antes de consultar', async (token) => {
    const response = await get(number, token);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Pedido no encontrado' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  test('rechaza número con UUID de otro pedido', async () => {
    const response = await get(number, wrongId);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Pedido no encontrado' });
    expect(filters).toEqual({ id: wrongId, order_number: number });
  });

  test('usa cliente admin y devuelve solamente campos permitidos', async () => {
    const response = await get(number, id);
    expect(response.status).toBe(200);
    expect(mockedCreateAdminClient).toHaveBeenCalledTimes(1);
    expect(filters).toEqual({ id, order_number: number });
    expect(query.select).toHaveBeenCalledWith(`${fields.join(',')},items:order_items(${itemFields.join(',')})`);
    const body = await response.json();
    expect(Object.keys(body.order).sort()).toEqual([...fields, 'items'].sort());
    expect(Object.keys(body.order.items[0]).sort()).toEqual([...itemFields].sort());
    expect(body.order.customer_name).toBe('customer_name');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  test('acepta UUID como identificador sin query token', async () => {
    const response = await get(id);
    expect(response.status).toBe(200);
    expect(filters).toEqual({ id });
  });

  test('rechaza identificador que no es UUID antes de consultar', async () => {
    expect((await get('invalid')).status).toBe(404);
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  test('no permite usar un token válido con otro número', async () => {
    expect((await get('TEN-20261103-000002', id)).status).toBe(404);
  });

  test('errores de servidor tampoco se almacenan en caché', async () => {
    query.single.mockRejectedValueOnce(new Error('database unavailable'));
    const response = await get(id);
    expect(response.status).toBe(500);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
