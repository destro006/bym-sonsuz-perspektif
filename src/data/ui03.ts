import manifest from '../../data/ui03-media-manifest.json';
import {asset} from '@/lib/asset';

/**
 * Concept 03 project media, driven by the supplied media manifest (single source of truth).
 * Every image is source-file based but NOT yet cleared for publication — keep that visible.
 */
export type U3Image = {src:string;source:string;w:number;h:number};
export type U3Project = {id:string;name:string;category:string;card:string;cover:string;thumb:string;gallery:U3Image[]};
export type U3Pending = {id:string;name:string};

type Raw = {id:string;name:string;category?:string;status:string;card:string|null;cover:string|null;thumb?:string|null;
 gallery:{file:string;sourceFileName:string;sourceWidth:number;sourceHeight:number}[]};
const raw = (manifest as unknown as {projects:Raw[]}).projects;

export const U3_PROJECTS:U3Project[] = raw.filter(p=>p.gallery.length&&p.card&&p.cover).map(p=>({
 id:p.id,name:p.name,category:p.category??'',card:asset(p.card!),cover:asset(p.cover!),thumb:asset(p.thumb??p.card!),
 gallery:p.gallery.map(g=>({src:asset(g.file),source:g.sourceFileName,w:g.sourceWidth,h:g.sourceHeight})),
}));
/** Projects named in the portfolio whose authentic media was not found — never filled with other photos. */
export const U3_PENDING:U3Pending[] = raw.filter(p=>!p.gallery.length).map(p=>({id:p.id,name:p.name}));

export const U3_HERO = {desktop:asset('/assets/bym-ui03/index/ruya-sehir-hero-desktop.webp'),mobile:asset('/assets/bym-ui03/index/ruya-sehir-hero-mobile.webp')};
export const U3_STARS = asset('/assets/bym-ui03/overlay/subtle-stars-transparent.png');
