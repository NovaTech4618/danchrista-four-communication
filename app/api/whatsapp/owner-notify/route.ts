import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";

type EventType = "sale" | "repair";
type Body = { type: EventType; id: string };
type SaleRow = { id:string; company_id:string; total:number|null; payment_method:string|null; staff_name:string|null; customers:{full_name:string|null}|Array<{full_name:string|null}>|null };
type RepairRow = { id:string; company_id:string; status:string|null; issue:string|null; technician:string|null; estimated_cost:number|null; final_cost:number|null; devices:{brand:string|null;model:string|null;customers:{full_name:string|null}|Array<{full_name:string|null}>|null}|Array<{brand:string|null;model:string|null;customers:{full_name:string|null}|Array<{full_name:string|null}>|null}>|null };
function jsonError(message:string,status=400,details?:unknown){return NextResponse.json({ok:false,error:message,...(details?{details}: {})},{status})}
function providerErrorMessage(result:unknown){if(!result||typeof result!=="object")return "WhatsApp provider rejected the message";const e=(result as {error?:{message?:string;error_data?:{details?:string}}}).error;return e?.error_data?.details||e?.message||"WhatsApp provider rejected the message"}
function first<T>(value:T|T[]|null|undefined){return Array.isArray(value)?value[0]:value}

export async function POST(request:Request){
 try{
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"").trim();if(!token)return jsonError("Authentication required",401);
  const body=(await request.json()) as Partial<Body>;if((body.type!=="sale"&&body.type!=="repair")||!body.id)return jsonError("Invalid notification payload");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,access=process.env.WHATSAPP_ACCESS_TOKEN,phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID,version=process.env.WHATSAPP_GRAPH_VERSION,template=process.env.WHATSAPP_OWNER_TEMPLATE_NAME,language=process.env.WHATSAPP_OWNER_TEMPLATE_LANGUAGE||"en_US";
  if(!url||!key)return jsonError("Supabase server configuration is missing",500);if(!access||!phoneId||!version)return jsonError("WhatsApp Cloud API is not configured",503);
  const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});const auth=await supabase.auth.getUser(token);if(auth.error||!auth.data.user)return jsonError("Invalid session",401);
  const{data:companyId,error:companyIdError}=await supabase.rpc("get_my_company_id");if(companyIdError||!companyId)return jsonError("Your company could not be resolved",403);
  const{data:company,error:companyError}=await supabase.from("companies").select("id,owner_id,name,owner_whatsapp_phone,showcase_phone").eq("id",companyId).single();if(companyError||!company)return jsonError("Company not found",404);
  const ownerPhone=normalizeWhatsAppPhone(company.owner_whatsapp_phone||company.showcase_phone||"");if(!ownerPhone)return jsonError("Boss WhatsApp number is not configured",422);
  let message="";
  if(body.type==="sale"){
   const{data,error}=await supabase.from("sales").select("id,company_id,total,payment_method,staff_name,customers(full_name)").eq("id",body.id).eq("company_id",companyId).single();if(error||!data)return jsonError("Sale not found",404);const row=data as unknown as SaleRow;const customer=first(row.customers)?.full_name;
   message=["AMEZING LIMITED","🧾 New sale recorded",`Amount: ₦${Number(row.total||0).toLocaleString("en-NG")}`,`Customer: ${customer||"Walk-in"}`,`Payment: ${row.payment_method||"Not specified"}`,`Staff: ${row.staff_name||"Not specified"}`,`Sale: ${row.id}`].join("\n");
  }else{
   const{data,error}=await supabase.from("repairs").select("id,company_id,status,issue,technician,estimated_cost,final_cost,devices(brand,model,customers(full_name))").eq("id",body.id).eq("company_id",companyId).single();if(error||!data)return jsonError("Repair not found",404);const row=data as unknown as RepairRow;const device=first(row.devices);const customer=first(device?.customers)?.full_name;const deviceName=[device?.brand,device?.model].filter(Boolean).join(" ")||"Device";
   message=["AMEZING LIMITED","🔧 Repair update",`Device: ${deviceName}`,`Customer: ${customer||"Walk-in"}`,`Problem: ${row.issue||"Not specified"}`,`Status: ${row.status||"Not specified"}`,`Technician: ${row.technician||"Not assigned"}`,`Estimated: ₦${Number(row.estimated_cost||0).toLocaleString("en-NG")}`,`Final: ₦${Number(row.final_cost||0).toLocaleString("en-NG")}`,`Repair: ${row.id}`].join("\n");
  }
  const payload=template?{messaging_product:"whatsapp",recipient_type:"individual",to:ownerPhone,type:"template",template:{name:template,language:{code:language},components:[{type:"body",parameters:[{type:"text",text:message}]}]}}:{messaging_product:"whatsapp",recipient_type:"individual",to:ownerPhone,type:"text",text:{preview_url:false,body:message}};
  const response=await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`,{method:"POST",headers:{Authorization:`Bearer ${access}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});const result=await response.json().catch(()=>null);if(!response.ok){const details=providerErrorMessage(result);console.error("WhatsApp owner notification failed",{status:response.status,template:Boolean(template)});return jsonError(details,502,{provider_status:response.status})}const messageId=result?.messages?.[0]?.id??null;if(!messageId)return jsonError("WhatsApp accepted the request but returned no message ID",502);return NextResponse.json({ok:true,messageId,mode:template?"template":"text"});
 }catch(error){console.error("WhatsApp owner notification error",error);return jsonError("Unable to send WhatsApp notification",500)}
}
