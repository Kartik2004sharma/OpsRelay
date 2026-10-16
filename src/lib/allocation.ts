export function allocate(orders: Array<{ id: string; dueDate: string; required: number }>, stock: number, supply: number, arrivalDate: string) {
  let used = 0;
  return [...orders].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id)).map((order) => {
    const available = stock + (arrivalDate <= order.dueDate ? supply : 0);
    const covered = Math.min(order.required, Math.max(0, available - used));
    used += covered;
    return { id: order.id, covered, shortage: order.required - covered };
  });
}
