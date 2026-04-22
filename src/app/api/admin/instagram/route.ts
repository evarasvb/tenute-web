import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_USER_ID;
const IG_ACCOUNT_LINK = process.env.INSTAGRAM_PROFILE_URL || 'https://instagram.com/tenute.cl';

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
    return NextResponse.json({ error: 'Instagram no configurado. Agrega INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID en Vercel.' }, { status: 503 });
  }
  const body = await request.json();
  const { product_id } = body;
  if (!product_id) return NextResponse.json({ error: 'product_id requerido' }, { status: 400 });
  const supabase = createAdminClient();
  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, price, compare_price, image_url, slug, brand, format, content_info, is_offer')
    .eq('id', product_id).single();
  if (error || !product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  if (!product.image_url) return NextResponse.json({ error: 'El producto necesita imagen para Instagram' }, { status: 400 });
  const priceFormatted = product.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  let caption = `${product.name}\n\n`;
  if (product.is_offer && product.compare_price && product.compare_price > product.price) {
    const compareFormatted = product.compare_price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
    const discount = Math.round((1 - product.price / product.compare_price) * 100);
    caption += `OFERTA: ${priceFormatted} (antes ${compareFormatted}) - ${discount}% OFF\n\n`;
  } else {
    caption += `Precio: ${priceFormatted}\n\n`;
  }
  if (product.brand) caption += `Marca: ${product.brand}\n`;
  if (product.format) caption += `Formato: ${product.format}\n`;
  if (product.content_info) caption += `${product.content_info}\n`;
  caption += `\nEnvios a todo Chile | Retiro en tienda\nVisita nuestra tienda en el link de la bio\n\n#tenute #oferta #chile #enviosachile`;
  try {
    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: product.image_url, caption, access_token: IG_ACCESS_TOKEN }),
    });
    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      return NextResponse.json({ error: `Error container Instagram: ${containerData.error?.message || 'desconocido'}` }, { status: 500 });
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerData.id, access_token: IG_ACCESS_TOKEN }),
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      return NextResponse.json({ error: `Error publicando: ${publishData.error?.message || 'desconocido'}` }, { status: 500 });
    }
    return NextResponse.json({ success: true, instagram_post_id: publishData.id, product: { id: product.id, name: product.name } });
  } catch (err) {
    return NextResponse.json({ error: 'Error inesperado publicando en Instagram' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const configured = !!(IG_ACCESS_TOKEN && IG_USER_ID);
  return NextResponse.json({
    configured,
    userId: configured ? IG_USER_ID : null,
    accountLink: IG_ACCOUNT_LINK,
    instructions: configured ? null : {
      steps: [
        '1. Ve a developers.facebook.com y crea una app Business',
        '2. Agrega el producto Instagram Graph API',
        '3. Obtén un Page Access Token de larga duracion',
        '4. En Vercel Settings > Environment Variables agrega:',
        '   INSTAGRAM_ACCESS_TOKEN = tu_token',
        '   INSTAGRAM_USER_ID = tu_ig_business_user_id',
        '5. Redeploy la app',
      ],
    },
  });
}
