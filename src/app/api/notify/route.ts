import { NextResponse } from 'next/server';
import type { Order, OrderItem } from '@/types';

function formatCLP(amount: number): string {
  return '$' + amount.toLocaleString('es-CL');
}

const SHIPPING_METHOD_LABELS: Record<string, string> = {
  pickup: 'Retiro en tienda — Feria Agro Tahsa, Local 21, Hijuelas',
  local_delivery: 'Despacho local',
  starken: 'Envío nacional (Starken)',
};

function buildOrderWhatsAppMessage(order: Order & { items?: OrderItem[] }): string {
  let msg = `🛒 *Nuevo Pedido ${order.order_number}*\n\n`;
  msg += `👤 *Cliente:* ${order.customer_name}\n`;
  msg += `📱 *Teléfono:* ${order.customer_phone}\n`;
  if (order.customer_email) msg += `📧 *Email:* ${order.customer_email}\n`;
  if (order.customer_rut) msg += `🪪 *RUT:* ${order.customer_rut}\n`;

  msg += `\n📦 *Envío:* ${SHIPPING_METHOD_LABELS[order.shipping_method] || order.shipping_method}\n`;
  if (order.shipping_address) {
    msg += `📍 *Dirección:* ${order.shipping_address}`;
    if (order.shipping_commune) msg += `, ${order.shipping_commune}`;
    if (order.shipping_city) msg += `, ${order.shipping_city}`;
    if (order.shipping_region) msg += `, ${order.shipping_region}`;
    msg += '\n';
  }

  msg += '\n*Productos:*\n';
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, i) => {
      msg += `${i + 1}. ${item.product_name} x${item.quantity} — ${formatCLP(item.subtotal)}\n`;
    });
  }

  msg += `\n💰 *Subtotal:* ${formatCLP(order.subtotal)}`;
  if (order.shipping_method === 'starken') {
    msg += `\n🚚 *Envío:* Por cotizar`;
  } else {
    msg += `\n🚚 *Envío:* ${order.shipping_cost > 0 ? formatCLP(order.shipping_cost) : 'Gratis'}`;
  }
  msg += `\n*Total:* ${formatCLP(order.total)}`;

  if (order.payment_method === 'transfer') {
    msg += '\n\n💳 *Pago por transferencia bancaria*';
  } else {
    msg += '\n\n💬 *Confirmar pedido por WhatsApp*';
  }

  if (order.notes) {
    msg += `\n\n📝 *Notas:* ${order.notes}`;
  }

  return msg;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order, type } = body;

    if (!order) {
      return NextResponse.json({ error: 'Se requiere la orden' }, { status: 400 });
    }

    let message: string;

    if (type === 'status_update') {
      const statusLabels: Record<string, string> = {
        pending: 'Pendiente',
        paid: 'Pagado',
        preparing: 'En preparación',
        shipped: 'Enviado',
        delivered: 'Entregado',
        cancelled: 'Cancelado',
      };
      message = `📋 *Actualización Pedido ${order.order_number}*\n\n`;
      message += `Estado: *${statusLabels[order.status] || order.status}*\n`;
      if (order.tracking_number) {
        message += `\n📦 Número de seguimiento: ${order.tracking_number}`;
      }
      message += `\n\nPara consultas: wa.me/56987299147`;
    } else {
      message = buildOrderWhatsAppMessage(order);
    }

    const whatsappUrl = `https://wa.me/56987299147?text=${encodeURIComponent(message)}`;

    return NextResponse.json({
      message,
      whatsapp_url: whatsappUrl,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al generar la notificación' },
      { status: 500 }
    );
  }
}
