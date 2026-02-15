import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/logger';
import { getSession } from '@/lib/security';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const conn = await db.getConnection();
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { status } = await request.json();

        if (!status) return NextResponse.json({ message: 'Status required' }, { status: 400 });

        await conn.beginTransaction();

        // 1. Get current status and items
        const [orders]: any = await conn.execute('SELECT status FROM orders WHERE id = ? FOR UPDATE', [id]);
        if (orders.length === 0) {
            await conn.rollback();
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        const currentStatus = orders[0].status;

        // 2. Handle stock restoration/deduction if status changed
        if (status !== currentStatus) {
            const [items]: any = await conn.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);

            // CASE: Moving TO Cancelled (Restore Stock)
            if (status === 'Cancelled') {
                for (const item of items) {
                    if (item.product_id) {
                        await conn.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
                    }
                }
            }
            // CASE: Moving FROM Cancelled (Deduct Stock with Validation)
            else if (currentStatus === 'Cancelled') {
                for (const item of items) {
                    if (!item.product_id) continue; // Skip deleted products

                    const [products]: any = await conn.execute('SELECT name, stock FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
                    if (products.length === 0) continue;

                    if (products[0].stock < item.quantity) {
                        await conn.rollback();
                        return NextResponse.json({ message: `Cannot un-cancel: Insufficient stock for ${products[0].name}` }, { status: 400 });
                    }
                    await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
                }
            }
        }

        // 3. Update order status
        await conn.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

        await conn.commit();

        await logActivity(session.userId, 'ORDER_STATUS_CHANGE', `Order #${id} status changed to: ${status}`, request);

        return NextResponse.json({ message: 'Order status updated' });
    } catch (error) {
        await conn.rollback();
        console.error('Order PATCH error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        conn.release();
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Delete order items first
        await db.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
        const [result]: any = await db.execute('DELETE FROM orders WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        await logActivity(session.userId, 'DELETE_ORDER', `Admin deleted order ID: ${id}`, request);

        return NextResponse.json({ message: 'Order deleted' });
    } catch (error) {
        console.error('Order DELETE error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
