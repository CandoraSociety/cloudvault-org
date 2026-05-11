export const PHOTO_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "heic", "heif"];

export const PHOTO_CATEGORIES = [
  { value: "photo_event", label: "Event / Gathering" },
  { value: "photo_people", label: "People / Portraits" },
  { value: "photo_facility", label: "Facility / Building" },
  { value: "photo_product", label: "Product / Equipment" },
  { value: "photo_project", label: "Project / Site" },
  { value: "photo_marketing", label: "Marketing / Promo" },
  { value: "photo_training", label: "Training / Workshop" },
  { value: "photo_document", label: "Document / Receipt" },
  { value: "photo_misc", label: "Miscellaneous" },
];

export const CATEGORIES = [
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
  { value: "operations", label: "Operations" },
  { value: "legal", label: "Legal" },
  { value: "marketing", label: "Marketing" },
  { value: "engineering", label: "Engineering" },
  { value: "general", label: "General" },
  { value: "policies", label: "Policies" },
  { value: "reports", label: "Reports" },
  { value: "templates", label: "Templates" },
  { value: "grants", label: "Grants & Funding" },
  { value: "contracts", label: "Contracts & Agreements" },
  { value: "insurance", label: "Insurance" },
  { value: "compliance", label: "Compliance & Regulatory" },
  { value: "board", label: "Board & Governance" },
  { value: "correspondence", label: "Correspondence & Letters" },
  { value: "projects", label: "Projects" },
  { value: "training", label: "Training & Development" },
];

export const FILE_CATEGORIES = [
  { value: "to_be_sorted", label: "Pending Sort" },
  ...CATEGORIES,
  ...PHOTO_CATEGORIES,
];

export const ACCESS_LEVELS = [
  { value: "personal", label: "Personal", description: "Only you can access" },
  { value: "universal", label: "Universal", description: "Everyone in the organization" },
  { value: "manager", label: "Manager", description: "Managers and admins only" },
  { value: "finance", label: "Finance", description: "Select authorized individuals only" },
  { value: "corporate", label: "Corporate", description: "Certificates, licenses, official docs" },
];

export const FILE_TYPE_ICONS = {
  pdf: { color: "text-red-500", bg: "bg-red-50" },
  doc: { color: "text-blue-600", bg: "bg-blue-50" },
  docx: { color: "text-blue-600", bg: "bg-blue-50" },
  xls: { color: "text-green-600", bg: "bg-green-50" },
  xlsx: { color: "text-green-600", bg: "bg-green-50" },
  csv: { color: "text-green-600", bg: "bg-green-50" },
  ppt: { color: "text-orange-500", bg: "bg-orange-50" },
  pptx: { color: "text-orange-500", bg: "bg-orange-50" },
  png: { color: "text-purple-500", bg: "bg-purple-50" },
  jpg: { color: "text-purple-500", bg: "bg-purple-50" },
  jpeg: { color: "text-purple-500", bg: "bg-purple-50" },
  gif: { color: "text-purple-500", bg: "bg-purple-50" },
  txt: { color: "text-gray-500", bg: "bg-gray-50" },
  zip: { color: "text-yellow-600", bg: "bg-yellow-50" },
  mp4: { color: "text-pink-500", bg: "bg-pink-50" },
  mp3: { color: "text-pink-500", bg: "bg-pink-50" },
};

export function getFileExtension(filename) {
  return filename?.split('.').pop()?.toLowerCase() || 'file';
}

export function getFileTypeStyle(ext) {
  return FILE_TYPE_ICONS[ext] || { color: "text-muted-foreground", bg: "bg-muted" };
}

export function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function generateStandardizedName(originalName, category, accessLevel) {
  const ext = getFileExtension(originalName);
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const cleanName = baseName
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefixMap = { manager: "MGR", universal: "UNI", personal: "PER", finance: "FIN", corporate: "CRP" };
  const prefix = prefixMap[accessLevel] || "UNI";
  const catCode = category.slice(0, 3).toUpperCase();
  return `${prefix}_${catCode}_${dateStr}_${cleanName}.${ext}`;
}

export function canAccessFile(file, user) {
  if (!file || !user) return false;
  if (user.role === "admin") return true;
  if (file.access_level === "universal") return true;
  if (file.access_level === "personal" && file.owner_email === user.email) return true;
  if (file.access_level === "manager" && (user.role === "manager" || user.role === "admin")) return true;
  if (file.access_level === "finance") {
    if (user.role === "finance" || user.role === "admin") return true;
    if (file.finance_authorized_emails?.includes(user.email)) return true;
    return false;
  }
  if (file.access_level === "corporate") return true; // all users can view corporate docs
  return false;
}