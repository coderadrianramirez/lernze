import {Suspense} from "react";
import {redirect} from "next/navigation";
export const metadata={title:"Siguiendo"};
export default function FollowingPage({searchParams}:PageProps<"/siguiendo">){return <Suspense fallback={null}><Move searchParams={searchParams}/></Suspense>;}
async function Move({searchParams}:{searchParams:PageProps<"/siguiendo">["searchParams"]}){const sp=await searchParams;const q=new URLSearchParams({vista:"siguiendo"});if(typeof sp.p==="string"&&/^\d+$/.test(sp.p))q.set("p",String(Math.min(10000,Math.max(1,Number(sp.p)))));return redirect(`/perfil?${q}`);}
