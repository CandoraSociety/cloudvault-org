/**
 * Cross-App File Upload Webhook
 * 
 * Other apps can POST to this function to automatically store a file in CloudVault.
 * 
 * Usage from another Base44 app:
 *   await base44.functions.invoke('crossAppFileUpload', {
 *     secret: '<your shared secret from environment>',
 *     file_url: 'https://...',
 *     original_name: 'document.pdf',
 *     display_name: 'Q1 Report',
 *     description: 'Quarterly report from Finance App',
 *     category: 'finance',        // see CATEGORIES in fileHelpers
 *     access_level: 'universal',  // personal | universal | manager | finance | corporate
 *     keywords: ['q1', 'report'],
 *     source_app: 'FinanceApp',
 *     owner_email: 'user@company.com',
 *     owner_name: 'John Doe',
 *   })
 * 
 * Preset triggers (configure in your source app):
 *   - Upload a specific document type (e.g. invoices → finance/finance)
 *   - Form submission with attachment → universal/general
 *   - Admin report generation → manager/reports
 *   - HR onboarding docs → manager/hr
 *   - Corporate filings → corporate/legal
 * 
 * Set CROSS_APP_SECRET in environment variables to secure this endpoint.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VALID_ACCESS_LEVELS = ["personal", "universal", "manager", "finance", "corporate"];
const VALID_CATEGORIES = ["finance", "hr", "operations", "legal", "marketing", "engineering", "general", "policies", "reports", "templates"];

function generateStandardizedName(originalName, category, accessLevel) {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'file';
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const cleanName = baseName.replace(/[^a-zA-Z0-9\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefixMap = { manager: "MGR", universal: "UNI", personal: "PER", finance: "FIN", corporate: "CRP" };
  const prefix = prefixMap[accessLevel] || "UNI";
  const catCode = category.slice(0, 3).toUpperCase();
  return `${prefix}_${catCode}_${dateStr}_${cleanName}.${ext}`;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // Validate shared secret
    const expectedSecret = Deno.env.get("CROSS_APP_SECRET");
    if (expectedSecret && body.secret !== expectedSecret) {
      return Response.json({ error: "Unauthorized: invalid secret" }, { status: 401 });
    }

    const {
      file_url,
      original_name,
      display_name,
      description,
      category = "general",
      access_level = "universal",
      keywords = [],
      source_app = "external",
      owner_email = "",
      owner_name = "",
      finance_authorized_emails = [],
    } = body;

    if (!file_url || !original_name) {
      return Response.json({ error: "file_url and original_name are required" }, { status: 400 });
    }

    if (!VALID_ACCESS_LEVELS.includes(access_level)) {
      return Response.json({ error: `Invalid access_level. Must be one of: ${VALID_ACCESS_LEVELS.join(", ")}` }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return Response.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const standardizedName = generateStandardizedName(original_name, category, access_level);

    const file = await base44.asServiceRole.entities.File.create({
      original_name,
      standardized_name: standardizedName,
      display_name: display_name || original_name,
      description: description || `Uploaded automatically from ${source_app}`,
      keywords,
      file_url,
      file_type: original_name.split('.').pop()?.toLowerCase() || 'file',
      category,
      access_level,
      finance_authorized_emails: access_level === "finance" ? finance_authorized_emails : [],
      owner_email,
      owner_name,
      source_app,
    });

    return Response.json({ success: true, file_id: file.id, standardized_name: standardizedName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});