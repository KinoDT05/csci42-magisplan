import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data: testData, error } = await supabase.from('test').select("id, description").eq('id',1);
    // SELECT id, description FROM test
    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        );
    }

    const data = testData.map(t => ({
        id: `T-${t.id.toString().padStart(4, '0')}`,
        desc: t.description,
    }));

    
    return new Response(
        JSON.stringify({ test: data }),
        { status: 201 }
    );
}