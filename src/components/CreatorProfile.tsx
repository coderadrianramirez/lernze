import {getProfileBranding} from "@/lib/profile-branding";
import {bannerUrl} from "@/lib/profile";
import {ProfileLinks} from "./ProfileLinks";
import {ProfileBrandingEditor} from "./ProfileBrandingEditor";
import Link from "next/link";
import {notFound} from "next/navigation";
import {Avatar} from "./Avatar";
import {CreatorCard} from "./CreatorCard";
import {CourseListItem} from "./CourseListItem";
import {CreatorInterest} from "./InterestTracking";
import {ProfileQuickEdit} from "./ProfileQuickEdit";
import {FollowButton} from "@/app/creador/[id]/FollowButton";
import {getCurrentUser} from "@/lib/auth";
import {publicCreator,followsCreator,followingCreators} from "@/lib/creators";
import {courseCreatorId,creatorPath} from "@/lib/creator-path";
import {listCourses} from "@/lib/data";
import {createSessionClient} from "@/lib/supabase/server";

export async function CreatorProfile({id,view,page=1}:{id:string;view?:string;page?:number}){
 const [{creator:publicProfile,ready},user,all]=await Promise.all([publicCreator(id),getCurrentUser(),listCourses()]);
 const own=Boolean(user&&!user.demo&&user.id===id);
 const programs=all.filter(c=>c.published&&courseCreatorId(c)===id);
 const creator=own?{id,name:user!.name,avatarUrl:user!.avatarUrl??null,followers:publicProfile?.followers??0}:publicProfile;
 if(!creator)notFound();
 const privateView=own&&view==="siguiendo";
 const followed=ready&&user&&!user.demo&&!own?await followsCreator(user.id,id):false;
 // La identidad de la sesión decide el acceso; la URL nunca concede acceso a otra lista.
 const personal=own?await ownProfileData(user!.id,privateView,page):null;
 const branding=await getProfileBranding(id,own);
 const categories=[...new Set(programs.map(c=>c.category))];
 const base=creatorPath(id);
 return <>
  <div className="flex flex-wrap items-center justify-between gap-3"><Link href={own?"/dashboard":"/buscar"} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-fg">{own?"← Mi cuenta":"← Explorar programas"}</Link>{own&&<Link href="/configuracion" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-fg">Configuración <span aria-hidden="true">↗</span></Link>}</div>
  {own&&!publicProfile&&<p className="mt-2 text-xs leading-relaxed text-muted">Solo tú puedes ver este perfil hasta que publiques tu primer programa.</p>}
  {publicProfile?.demo&&<p role="status" className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm text-muted">Perfil de ejemplo con contenido de prueba. No corresponde a una cuenta real.</p>}
  {!own&&<CreatorInterest courseIds={[...new Map(programs.map(c=>[c.category,c.id])).values()]}/>}
  <header className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface">
   <div className="aspect-[4/1] max-h-64 border-b border-accent/15 bg-[radial-gradient(ellipse_at_top_right,rgba(255,181,71,.18),transparent_65%)] bg-cover bg-center" style={bannerUrl(branding.bannerPath)?{backgroundImage:`url("${bannerUrl(branding.bannerPath)}")`}:undefined} aria-hidden="true"/>
   <div className="px-5 pb-6 sm:px-8 sm:pb-7"><div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0 flex-1"><div className="inline-flex rounded-full bg-surface p-1.5"><Avatar name={creator.name} src={creator.avatarUrl} className="h-20 w-20 font-display text-3xl sm:h-24 sm:w-24"/></div><p className="mt-3 text-[10px] font-bold uppercase tracking-[.18em] text-accent">{own?"Tu perfil en Lernze":"Creador en Lernze"}</p><h1 className="mt-2 break-words font-display text-[clamp(28px,5vw,44px)] font-extrabold leading-tight tracking-tight">{creator.name}</h1><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted"><span><b className="text-fg">{programs.length}</b> {programs.length===1?"programa publicado":"programas publicados"}</span>{ready&&!publicProfile?.demo&&<span><b className="text-fg">{creator.followers}</b> {creator.followers===1?"seguidor":"seguidores"}</span>}</div></div>
    {own&&personal?<ProfileQuickEdit user={user!} avatarPath={personal.avatarPath} ready={personal.editReady}/>:<FollowButton key={`${id}:${followed}`} creatorId={id} creatorName={creator.name} followers={creator.followers} following={followed} signedIn={Boolean(user&&!user.demo)} own={false} ready={ready&&!publicProfile?.demo} demo={Boolean(publicProfile?.demo)}/>}
   </div><ProfileLinks links={branding.links}/>{own&&<ProfileBrandingEditor bannerPath={branding.bannerPath} links={branding.links} ready={branding.ready}/>} {!!categories.length&&<ul aria-label="Temas de sus programas" className="mt-5 flex flex-wrap gap-2">{categories.map(c=><li key={c} className="rounded-full border border-line px-3 py-1 text-xs text-muted">{c}</li>)}</ul>}</div>
  </header>
  <nav aria-label="Contenido del perfil" className="mt-7 flex items-center gap-6 border-b border-line">
   <Link href={base} aria-current={!privateView?"page":undefined} scroll={false} className={`min-h-12 border-b-2 px-1 py-3 text-sm font-semibold ${!privateView?"border-accent text-fg":"border-transparent text-muted"}`}>Programas</Link>
   {own&&<Link href={`${base}?vista=siguiendo`} aria-current={privateView?"page":undefined} scroll={false} className={`flex min-h-12 flex-wrap items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold ${privateView?"border-accent text-fg":"border-transparent text-muted"}`}>Siguiendo{personal?.count!==null&&<span className="text-xs text-muted">{personal?.count}</span>}<span className="rounded-md border border-line px-1.5 py-0.5 text-[9px] font-medium text-muted">Solo tú</span></Link>}
  </nav>
  {privateView&&personal?<section className="pt-6" aria-label="Cuentas que sigues en privado"><p className="mb-5 text-xs text-muted">Esta lista es privada. Solo tú puedes verla.</p>
   {personal.following?.creators.length?<ul className="grid gap-3 sm:grid-cols-2">{personal.following.creators.map(c=><li key={c.id} className="min-w-0"><CreatorCard creator={c}/></li>)}</ul>:<div className="py-10 text-center"><p className="font-display text-xl font-bold">{personal.following?.ready?(page>1?"No hay más cuentas en esta página":"Aún no sigues a nadie"):"No pudimos cargar tu lista"}</p><p className="mx-auto mt-2 max-w-[40ch] text-sm leading-relaxed text-muted">{personal.following?.ready?"Cuando sigas una cuenta desde su perfil, la encontrarás aquí.":"Inténtalo de nuevo en unos minutos."}</p><Link href={personal.following?.ready?"/buscar":`${base}?vista=siguiendo`} className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-accent hover:border-accent">{personal.following?.ready?"Explorar programas →":"Volver a intentar"}</Link></div>}
   {(page>1||personal.following?.hasNext)&&<nav aria-label="Páginas de cuentas seguidas" className="mt-6 flex justify-between gap-4">{page>1?<Link className="min-h-11 py-3 text-sm text-muted" href={`${base}?vista=siguiendo&p=${page-1}`}>← Anterior</Link>:<span/>}{personal.following?.hasNext&&<Link className="min-h-11 py-3 text-sm text-muted" href={`${base}?vista=siguiendo&p=${page+1}`}>Siguiente →</Link>}</nav>}
  </section>:<section className="pt-6" aria-label="Programas publicados">
   {programs.length?<ul className="grid gap-2 md:grid-cols-2">{programs.map(c=><li key={c.id} className="min-w-0"><CourseListItem course={c} src="own"/></li>)}</ul>:<div className="py-10 text-center"><h2 className="font-display text-xl font-bold">{own?"Tu próximo programa empieza contigo":"Todavía no hay programas publicados"}</h2><p className="mx-auto mt-2 max-w-[45ch] text-sm leading-relaxed text-muted">{own?"Aquí aparecerán tus programas publicados. Tus borradores y las clases a las que te inscribiste siguen en Mi cuenta.":"Vuelve pronto para conocer sus próximos programas."}</p>{own&&<Link href="/dashboard?vista=ensenar" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-ink">Gestionar mis programas →</Link>}</div>}
  </section>}
 </>;
}

async function ownProfileData(userId:string,includeFollowing:boolean,page:number){
 const db=await createSessionClient();
 const [profile,settings,count,following]=await Promise.all([
  db.from("profiles").select("avatar_path").eq("id",userId).maybeSingle(),db.rpc("account_settings_ready"),
  db.from("creator_follows").select("creator_id",{count:"exact",head:true}).eq("follower_id",userId),
  includeFollowing?followingCreators(userId,page):null,
 ]);
 return {avatarPath:profile.data?.avatar_path??null,editReady:!settings.error&&settings.data===true,count:count.error?null:count.count??0,following};
}
