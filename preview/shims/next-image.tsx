// Preview-only stand-in for next/image (the logo bytes are embedded unchanged as a data URI).
type P=React.ImgHTMLAttributes<HTMLImageElement>&{priority?:boolean;unoptimized?:boolean};
export default function Image({priority:_p,unoptimized:_u,...rest}:P){return <img {...rest}/>;}
