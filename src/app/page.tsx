'use client';
import dynamic from 'next/dynamic';
const Experience = dynamic(() => import('@/components/Experience'), { ssr: false, loading: () => <main className="loading-experience">BYM İnşaat · 3D deneyim hazırlanıyor</main> });
export default function Home() { return <Experience />; }
