import { prisma } from '../../lib/db';

export async function GET(request) {
  try {
    const modules = await prisma.module.findMany({
      orderBy: {
        code: 'asc', // Assuming 'code' is the field name for module code
      },
    });
    return new Response(JSON.stringify(modules), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return new Response('Error fetching modules', { status: 500 });
  }
}