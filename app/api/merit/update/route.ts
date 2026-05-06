import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { merit_id, action } = await req.json()

    const status = action === 'approve' ? 'approved' : 'rejected'

    const { error } = await supabase
      .from('merit')
      .update({ status })
      .eq('id', merit_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}