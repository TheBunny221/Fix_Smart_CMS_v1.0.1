import { getPrisma } from "../db/connection.js";

// Build a map of complaint type -> SLA hours from ComplaintType table with fallback to system config
export async function getTypeSlaMap(prisma) {
  const client = prisma || getPrisma();
  const map = new Map();
  
  // First try to get from ComplaintType table
  const complaintTypes = await client.complaintType.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slaHours: true }
  });
  
  if (complaintTypes.length > 0) {
    for (const ct of complaintTypes) {
      const slaHours = Number(ct.slaHours);
      if (!Number.isFinite(slaHours) || slaHours <= 0) continue;
      
      // Map by ID (for new complaintTypeId references)
      map.set(String(ct.id), slaHours);
      
      // Map by name (for legacy type string references)
      if (ct.name) {
        map.set(ct.name, slaHours);
        map.set(ct.name.toUpperCase(), slaHours);
        map.set(ct.name.toLowerCase(), slaHours);
      }
    }
  } else {
    // Fallback to legacy system config
    const typeConfigs = await client.systemConfig.findMany({
      where: { key: { startsWith: "COMPLAINT_TYPE_" }, isActive: true },
    });
    
    for (const cfg of typeConfigs) {
      try {
        const v = JSON.parse(cfg.value || "{}");
        const id = (cfg.key || "").replace("COMPLAINT_TYPE_", "");
        const slaHours = Number(v.slaHours);
        if (!id || !Number.isFinite(slaHours) || slaHours <= 0) continue;
        
        // Primary key: the config suffix (e.g. WATER_SUPPLY) which matches complaint.type
        map.set(id, slaHours);
        // Also set uppercase/lowercase variants and the human-readable name (if present) for resilience
        if (v.name && typeof v.name === "string") {
          map.set(v.name.toUpperCase(), slaHours);
          map.set(v.name.toLowerCase(), slaHours);
        }
        map.set(id.toUpperCase(), slaHours);
        map.set(id.toLowerCase(), slaHours);
      } catch (e) {
        // ignore parse errors
      }
    }
  }
  
  return map;
}

// Compute SLA compliance as: among CLOSED/RESOLVED complaints, percentage closed within SLA hours of submittedOn, filtered by optional where
export async function computeSlaComplianceClosed(prisma, where = {}) {
  const client = prisma || getPrisma();
  const typeSlaMap = await getTypeSlaMap(client);

  const closedWhere = {
    ...where,
    status: { in: ["RESOLVED", "CLOSED"] },
  };

  const rows = await client.complaint.findMany({
    where: closedWhere,
    select: { submittedOn: true, closedOn: true, type: true },
  });

  let compliant = 0;
  let total = 0;
  for (const r of rows) {
    if (!r.submittedOn || !r.closedOn) continue;
    const typeKey = r.type || "";
    // Try multiple fallbacks to find an SLA hours value for the complaint type
    let slaHours = typeSlaMap.get(typeKey);
    if (slaHours == null && typeof typeKey === "string") {
      slaHours =
        typeSlaMap.get(typeKey.toUpperCase()) ||
        typeSlaMap.get(typeKey.toLowerCase());
    }
    if (!slaHours) continue; // skip unknown type config
    total += 1;
    const startTs = new Date(r.submittedOn).getTime();
    const targetTs = startTs + slaHours * 60 * 60 * 1000;
    const closedTs = new Date(r.closedOn).getTime();
    if (closedTs <= targetTs) compliant += 1;
  }

  const compliance = total ? (compliant / total) * 100 : 0;
  return { compliance, totalClosed: total, compliantClosed: compliant };
}

// Average resolution time in days for CLOSED/RESOLVED complaints for parity with reports
export async function computeAvgResolutionDays(prisma, where = {}) {
  const client = prisma || getPrisma();
  const rows = await client.complaint.findMany({
    where: { ...where, status: { in: ["RESOLVED", "CLOSED"] } },
    select: { submittedOn: true, closedOn: true },
  });
  if (rows.length === 0) return 0;
  let totalDays = 0;
  for (const r of rows) {
    const days = Math.ceil(
      (new Date(r.closedOn).getTime() - new Date(r.submittedOn).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    totalDays += days;
  }
  return totalDays / rows.length;
}
