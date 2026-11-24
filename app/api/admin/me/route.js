// app/api/admin/me/route.js

import { withAdminAuth } from "@/lib/middleware/withAdminAuth";
import { jsonOk } from "@/lib/server/api";

export const GET = withAdminAuth(async (req) => {
  return jsonOk({ user: req.admin });
});
