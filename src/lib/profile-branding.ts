import {createPublicReadClient,createSessionClient} from "./supabase/server";
import {parseProfileLinks} from "./profile-links";
export type Branding = {bannerPath:string|null;links:string[];ready:boolean};
export async function getProfileBranding(id:string,own:boolean):Promise<Branding>{
  const empty={bannerPath:null,links:[],ready:false};
  if(!/^[0-9a-f-]{36}$/i.test(id))return empty;
  const db=own?await createSessionClient():createPublicReadClient();
  const {data,error}=await db.from("profile_branding").select("banner_path,links").eq("profile_id",id).maybeSingle();
  if(error)return empty;
  let links:string[]=[];
  try{links=parseProfileLinks(data?.links??[]);}catch{}
  return {bannerPath:data?.banner_path??null,links,ready:true};
}
