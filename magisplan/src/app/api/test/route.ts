import { supabase } from '@/lib/supabase';

export async function GET() {
    console.log(await supabase.from("test").select('*'));
    const { data: testData, error } = await supabase.from('test').select();
    console.log(testData);
    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        );
    }

    const data = testData.map(t => ({
        id: t.id,
        desc: t.description,

    }));

    

    return new Response(
        JSON.stringify({ test: data }),
        { status: 201 }
    );
}