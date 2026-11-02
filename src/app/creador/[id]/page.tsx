import type {Metadata} from "next";
import {connection} from "next/server";
import {Suspense} from "react";
import {CreatorProfile} from "@/components/CreatorProfile";
import {ShowFooterOnMobile} from "@/components/Footer";
import {publicCreator} from "@/lib/creators";
export async function generateMetadata({params}:PageProps<"/creador/[id]">):Promise<Metadata>{await connection();const{id}=await params;const{creator}=await publicCreator(id);return{title:creator?`${creator.name} · Perfil`:"Perfil"};}
export default function CreatorPage({params,searchParams}:PageProps<"/creador/[id]">){return <main className="mx-auto max-w-[1100px] px-4 pb-12 pt-6 md:pt-10"><ShowFooterOnMobile/><Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-surface" aria-label="Cargando perfil"/>}><Content params={params} searchParams={searchParams}/></Suspense></main>;}
async function Content({params,searchParams}:{params:PageProps<"/creador/[id]">["params"];searchParams:PageProps<"/creador/[id]">["searchParams"]}){const[{id},sp]=await Promise.all([params,searchParams]);const page=typeof sp.p==="string"&&/^\d+$/.test(sp.p)?Math.min(10000,Math.max(1,Number(sp.p))):1;return <CreatorProfile id={id} view={typeof sp.vista==="string"?sp.vista:undefined} page={page}/>;}
