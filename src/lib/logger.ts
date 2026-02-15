import db from './db';

// Mock MAC addresses for academic demonstration
const MOCK_MACS: { [key: string]: string } = {
    '127.0.0.1': '00-15-5D-BD-8A-11',
    'admin': 'D8-5E-D3-44-A2-9F',
    'default': '48-2A-E3-11-BC-05'
};

export async function logActivity(userId: string | number | null, action: string, details: string, request: Request | null) {
    try {
        let ipAddress = 'unknown';
        let userAgent = 'unknown';

        if (request) {
            const forwarded = request.headers.get('x-forwarded-for');
            ipAddress = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
            userAgent = request.headers.get('user-agent') || 'unknown';
        }

        // Use mock MAC based on IP or specific actions for academic demo
        const macAddress = MOCK_MACS[ipAddress] || MOCK_MACS['default'];

        await db.execute(
            'INSERT INTO logs (user_id, action, details, ip_address, mac_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [userId || null, action, details, ipAddress, macAddress, userAgent]
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}
