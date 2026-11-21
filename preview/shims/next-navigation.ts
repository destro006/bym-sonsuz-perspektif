export const usePathname=()=>'/';
// Preview build has no router: route pushes fall back to an in-page notice (see next-link shim).
export const useRouter=()=>({push:(_h:string)=>alert('Bu sayfa önizleme dosyasında yer almıyor; tam sitede açılır.'),replace:()=>{},back:()=>history.back(),prefetch:()=>{}});
export const notFound=()=>{throw new Error('notFound');};
