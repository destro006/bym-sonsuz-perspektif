/** 1.5px line icons shared by the stage navigation and cards. */
const PATHS:Record<string,React.ReactNode>={
 orbit:<><circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-25 12 12)"/></>,
 grid:<><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></>,
 info:<><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/></>,
 layers:<path d="M12 3.5l8.5 4.3-8.5 4.3-8.5-4.3zM3.5 12l8.5 4.3 8.5-4.3M3.5 16.2l8.5 4.3 8.5-4.3"/>,
 news:<><rect x="3.5" y="5" width="17" height="14" rx="2.4"/><path d="M7 9h6M7 12.5h10M7 16h10"/></>,
 mail:<><rect x="3.5" y="5.5" width="17" height="13" rx="2.4"/><path d="M4.5 7l7.5 5.5L19.5 7"/></>,
 pin:<><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></>,
 building:<path d="M4 21V9l6-4v16M10 21V3l10 5v13M3 21h18M14 11h2M14 14h2M14 17h2"/>,
 image:<><rect x="3.5" y="4.5" width="17" height="15" rx="2.6"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l4.8-4.2 3.6 3 3-2.6L20 17"/></>,
 arrow:<path d="M7 17L17 7M9 7h8v8"/>,
 down:<path d="M12 5v14M6 13l6 6 6-6"/>,
 prev:<path d="M15 5l-7 7 7 7"/>,
 next:<path d="M9 5l7 7-7 7"/>,
 chevron:<path d="M6 9l6 6 6-6"/>,
 menu:<path d="M4 8h16M4 16h16"/>,
 close:<path d="M6 6l12 12M18 6L6 18"/>,
 spark:<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4"/>,
};
export type IconName=keyof typeof PATHS;
export function Icon({name,size=18,className}:{name:string;size?:number;className?:string}){
 return <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{PATHS[name]}</svg>;
}
