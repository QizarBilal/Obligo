import { securityHeaders } from "@/lib/security";
export async function GET(){return Response.json({status:"healthy",service:"obligo",storage:{documents:"r2",records:"d1"}},{headers:securityHeaders()})}
