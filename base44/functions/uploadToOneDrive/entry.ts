import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function graphRequest(accessToken, path, options = {}) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
  });
  if (!res.ok) throw new Error(`Graph API error: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file, fileName, fileContent } = await req.json();
    
    if (!file || !fileName) {
      return Response.json({ error: 'Missing file or fileName' }, { status: 400 });
    }

    // Get OneDrive connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('one_drive');

    // Upload file to OneDrive root
    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: fileContent,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error(`OneDrive upload failed: ${uploadResponse.status}`);
    }

    const uploadedFile = await uploadResponse.json();

    return Response.json({
      success: true,
      file_url: uploadedFile.webUrl,
      file_id: uploadedFile.id,
      drive_item: uploadedFile,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});