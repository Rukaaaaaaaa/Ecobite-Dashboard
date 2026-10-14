import type { ReactNode } from 'react';
import type { BagStatus, OrderStatus, ProductKind } from '@/types';

export type Tone = 'g' | 'a' | 'b' | 'r' | 'x';

export function Badge({ tone, children, small }: { tone: Tone; children: ReactNode; small?: boolean }) {
  return <span className={`bg2 tone-${tone} ${small ? 'sm' : ''}`}>{children}</span>;
}

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  wait: { label: 'Chờ xác nhận', tone: 'a' },
  conf: { label: 'Đã xác nhận', tone: 'b' },
  ready: { label: 'Chờ khách lấy', tone: 'g' },
  done: { label: 'Hoàn thành', tone: 'g' },
  miss: { label: 'Khách không lấy', tone: 'x' },
  cancel: { label: 'Khách đã huỷ', tone: 'r' },
};

export const BAG_STATUS: Record<BagStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Nháp', tone: 'x' },
  live: { label: 'Đang bán', tone: 'g' },
  paused: { label: 'Tạm dừng', tone: 'a' },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = ['wait', 'conf', 'ready', 'done', 'miss', 'cancel'];

/** Colour used by charts for each status (same palette as the badges). */
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  wait: 'var(--amb)',
  conf: 'var(--blu)',
  ready: 'var(--g6)',
  done: 'var(--g7)',
  miss: 'var(--gry)',
  cancel: 'var(--red)',
};

export const PRODUCT_KIND: Record<ProductKind, { label: string; tone: Tone }> = {
  food: { label: 'Đồ ăn', tone: 'b' },
  bag: { label: 'Mystery Bag', tone: 'g' },
};

export const ProductKindBadge = ({ kind }: { kind: ProductKind }) => <Badge tone={PRODUCT_KIND[kind].tone}>{PRODUCT_KIND[kind].label}</Badge>;

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => <Badge tone={ORDER_STATUS[status].tone}>{ORDER_STATUS[status].label}</Badge>;
export const BagStatusBadge = ({ status }: { status: BagStatus }) => <Badge tone={BAG_STATUS[status].tone}>{BAG_STATUS[status].label}</Badge>;
