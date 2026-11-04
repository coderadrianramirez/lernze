"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {getCurrentUser} from "@/lib/auth";
import {createSessionClient} from "@/lib/supabase/server";
import {bannerUrl} from "@/lib/profile";
import {parseProfileLinks} from "@/lib/profile-links";
async function session(){const user=await getCurrentUser();if(!user||user.demo)throw Error("Inicia sesión para personalizar tu perfil.");return {user,db:await createSessionClient()};}
async function cleanBanners(paths:string[]){
  const {user,db}=await session();
  if(!Array.isArray(paths)||paths.length>30||paths.some(p=>typeof p!=="string"))throw Error("Los banners no son válidos.");
  const {data,error}=await db.from("profile_branding").select("banner_path").eq("profile_id",user.id).maybeSingle();
  if(error)throw Error("No pudimos comprobar tu banner actual.");
  const unused=[...new Set(paths)].filter(p=>bannerUrl(p)&&p.startsWith(user.id+"/")&&p!==data?.banner_path);
  if(unused.length){const result=await db.storage.from("profile-banners").remove(unused);if(result.error)throw Error("No pudimos limpiar los banners descartados.");}
}
export async function discardBannersAction(paths:string[]){try{await cleanBanners(paths);return {};}catch(e){return {error:(e as Error).message};}}
export async function createBannerUploadAction(){
  try{const {user,db}=await session();const ready=await db.from("profile_branding").select("profile_id").eq("profile_id",user.id).maybeSingle();if(ready.error)throw Error("La personalización estará disponible en breve.");
    const path=`${user.id}/${randomUUID()}.webp`;const {data,error}=await db.storage.from("profile-banners").createSignedUploadUrl(path);
    if(error||!data)throw Error("No pudimos preparar la subida del banner.");return {path,signedUrl:data.signedUrl};
  }catch(e){return {error:(e as Error).message};}
}
export async function saveBrandingAction(input:{bannerPath:string|null;links:string[];uploads:string[]}){
  try{const {user,db}=await session();const links=parseProfileLinks(input.links);
    if(input.bannerPath&&(!bannerUrl(input.bannerPath)||!input.bannerPath.startsWith(user.id+"/")))throw Error("Selecciona un banner propio.");
    if(!Array.isArray(input.uploads)||input.uploads.length>30||input.uploads.some(p=>typeof p!=="string"))throw Error("Los banners no son válidos.");
    const previous=await db.from("profile_branding").select("banner_path").eq("profile_id",user.id).maybeSingle();if(previous.error)throw Error("No pudimos cargar tu perfil.");
    const result=await db.from("profile_branding").upsert({profile_id:user.id,banner_path:input.bannerPath,links});if(result.error)throw Error("No pudimos guardar. Revisa los enlaces y el banner.");
    revalidatePath("/", "layout");
    let notice="";try{await cleanBanners([...input.uploads,...(previous.data?.banner_path?[previous.data.banner_path]:[])]);}catch{notice="El perfil se guardó; la limpieza del banner anterior queda pendiente.";}
    return {saved:true,notice};
  }catch(e){return {error:(e as Error).message};}
}
