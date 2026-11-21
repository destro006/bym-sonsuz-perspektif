import {Icon} from './Icon';
/** Two stacked arrows; CSS (.lux-arrow) swaps them on parent hover/focus. Server-safe. */
export function ArrowSwap({size=16}:{size?:number}){
 return <span className="lux-arrow" style={{fontSize:size}} aria-hidden="true"><Icon name="arrow" size={size}/><Icon name="arrow" size={size}/></span>;
}
