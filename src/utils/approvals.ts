import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('creative_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('creative_session_id', sessionId);
  }
  return sessionId;
}

function hashCreative(filename: string, imageData: string): string {
  return `${filename}_${imageData.substring(0, 100)}`.replace(/[^a-zA-Z0-9]/g, '_');
}

export async function saveApprovalState(
  filename: string,
  imageData: string,
  isApproved: boolean
): Promise<void> {
  const sessionId = getSessionId();
  const creativeHash = hashCreative(filename, imageData);

  const { data: existing } = await supabase
    .from('creative_approvals')
    .select('id')
    .eq('session_id', sessionId)
    .eq('creative_hash', creativeHash)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('creative_approvals')
      .update({
        is_approved: isApproved,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('creative_approvals')
      .insert({
        creative_filename: filename,
        creative_hash: creativeHash,
        is_approved: isApproved,
        session_id: sessionId
      });
  }
}

export async function loadApprovalStates(
  creatives: Array<{ filename: string; imageData: string }>
): Promise<Map<number, boolean>> {
  const sessionId = getSessionId();
  const approvalMap = new Map<number, boolean>();

  const creativeHashes = creatives.map(c => hashCreative(c.filename, c.imageData));

  const { data } = await supabase
    .from('creative_approvals')
    .select('creative_hash, is_approved')
    .eq('session_id', sessionId)
    .in('creative_hash', creativeHashes);

  if (data) {
    data.forEach(approval => {
      const index = creativeHashes.indexOf(approval.creative_hash);
      if (index !== -1 && approval.is_approved) {
        approvalMap.set(index, true);
      }
    });
  }

  return approvalMap;
}
