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

async function getAllFiles(accessToken, driveId = 'me/drive') {
  const files = [];
  let pageUrl = `https://graph.microsoft.com/v1.0/${driveId}/root/children?$filter=NOT(isFolder eq true)&$top=200`;

  while (pageUrl) {
    const res = await fetch(pageUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await res.json();
    files.push(...(data.value || []));
    pageUrl = data['@odata.nextLink'];
  }

  return files;
}

function getFileExtension(filename) {
  return filename?.split('.').pop()?.toLowerCase() || 'file';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get OneDrive connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('one_drive');

    // Fetch all files from OneDrive
    const oneDriveFiles = await getAllFiles(accessToken);

    // Fetch existing files from Base44
    const existingFiles = await base44.asServiceRole.entities.File.list('-created_date', 1000);
    const existingUrls = new Set(existingFiles.map(f => f.file_url));

    // Import missing files
    const imported = [];
    const skipped = [];

    for (const odFile of oneDriveFiles) {
      if (existingUrls.has(odFile.webUrl)) {
        skipped.push(odFile.name);
      } else {
        try {
          await base44.asServiceRole.entities.File.create({
            original_name: odFile.name,
            display_name: odFile.name,
            file_url: odFile.webUrl,
            file_type: getFileExtension(odFile.name),
            file_size: odFile.size || 0,
            category: 'to_be_sorted',
            access_level: 'personal',
            owner_email: user.email,
            owner_name: user.full_name,
          });
          imported.push(odFile.name);
        } catch (err) {
          console.error(`Failed to import ${odFile.name}:`, err.message);
        }
      }
    }

    return Response.json({
      success: true,
      imported: imported.length,
      skipped: skipped.length,
      totalOneDrive: oneDriveFiles.length,
      message: `Imported ${imported.length} new files. ${skipped.length} already in database.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});