import {Suspense} from "react";
import {redirect} from "next/navigation";
import {getCurrentUser} from "@/lib/auth";
import {creatorPath} from "@/lib/creator-path";
export const metadata={title:"Mi perfil"};
export default function MyProfile({searchParams}:PageProps<"/perfil">){return <Suspense fallback={<main className="mx-auto max-w-[1100px] p-4"><div className="h-80 animate-pulse rounded-3xl bg-surface" aria-label="Cargando tu perfil"/></main>}><Content searchParams={searchParams}/></Suspense>;}
async function Content({searchParams}:{searchParams:PageProps<"/perfil">["searchParams"]}){
 const user=await getCurrentUser();if(!user||user.demo)redirect("/entrar?next=/perfil");
 const sp=await searchParams,params=new URLSearchParams();if(sp.vista==="siguiendo"){params.set("vista","siguiendo");if(typeof sp.p==="string"&&/^\d+$/.test(sp.p))params.set("p",String(Math.min(10000,Math.max(1,Number(sp.p)))));}
 return redirect(creatorPath(user.id)+(params.size?`?${params}`:""));
}
