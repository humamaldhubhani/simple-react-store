import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/logger';
import { getSession, OrderSchema } from '@/lib/security';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        let ordersQuery = 'SELECT * FROM orders';
        let queryParams: any[] = [];

        if (session.role !== 'admin') {
            ordersQuery += ' WHERE user_id = ?';
            queryParams.push(session.userId);
        }
        ordersQuery += ' ORDER BY created_at DESC';

        const [orders]: any = await db.execute(ordersQuery, queryParams);

        if (orders.length === 0) return NextResponse.json([]);

        // Fetch all items for these orders
        const orderIds = orders.map((o: any) => o.id);
        const [items]: any = await db.execute(`
            SELECT oi.*, p.name 
            FROM order_items oi 
            LEFT JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})
        `, orderIds);

        // Group items by order_id
        const orderItemsMap = items.reduce((acc: any, item: any) => {
            if (!acc[item.order_id]) acc[item.order_id] = [];
            acc[item.order_id].push(item);
            return acc;
        }, {});

        const finalOrders = orders.map((order: any) => ({
            ...order,
            items: orderItemsMap[order.id] || []
        }));

        return NextResponse.json(finalOrders);
    } catch (error) {
        console.error('Orders GET error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const conn = await db.getConnection();
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Zod Validation
        const validation = OrderSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                message: 'Invalid order data',
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { customer_name, customer_email, items } = validation.data;

        await conn.beginTransaction();

        // 1. Validate stock availability for all items
        for (const item of items) {
            const [product]: any = await conn.execute(
                'SELECT name, stock FROM products WHERE id = ? FOR UPDATE',
                [item.product_id]
            );

            if (product.length === 0) {
                await conn.rollback();
                return NextResponse.json({ message: `Product ID ${item.product_id} not found` }, { status: 404 });
            }

            if (product[0].stock < item.quantity) {
                await conn.rollback();
                return NextResponse.json({
                    message: `Insufficient stock for ${product[0].name}. Available: ${product[0].stock}, Requested: ${item.quantity}`
                }, { status: 400 });
            }
        }

        let totalAmount = 0;
        items.forEach((item: any) => {
            totalAmount += item.quantity * item.unit_price;
        });

        const [orderResult]: any = await conn.execute(
            'INSERT INTO orders (user_id, customer_name, customer_email, total_amount) VALUES (?, ?, ?, ?)',
            [session.userId, customer_name, customer_email || '', totalAmount]
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            await conn.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
            await conn.execute(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await conn.commit();
        await logActivity(session.userId, 'CREATE_ORDER', `Order #${orderId} created. Total: $${totalAmount}`, request);
        return NextResponse.json({ message: 'Order created', id: orderId }, { status: 201 });
    } catch (error) {
        await conn.rollback();
        console.error('Order POST error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        conn.release();
    }
}
