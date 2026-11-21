'use client';
import { useState, type FormEvent } from 'react';
import { COMPANY } from '@/data/bym-portfolio';
export function ContactForm(){
 const [values,setValues]=useState({name:'',email:'',phone:'',subject:'',message:''});
 const change=(key:keyof typeof values,value:string)=>setValues(v=>({...v,[key]:value}));
 const submit=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  const subject=encodeURIComponent(values.subject||'BYM İnşaat web sitesi iletişim');
  const body=encodeURIComponent(`İsim: ${values.name}\nE-posta: ${values.email}\nTelefon: ${values.phone}\n\nMesaj:\n${values.message}`);
  window.location.href=`mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
 };
 return <form className="bym-contact-form" onSubmit={submit}>
  <div className="bym-form-row"><label>Adınız Soyadınız *<input required autoComplete="name" name="name" value={values.name} onChange={e=>change('name',e.target.value)} placeholder="Adınız Soyadınız"/></label><label>E-posta *<input required type="email" name="email" autoComplete="email" value={values.email} onChange={e=>change('email',e.target.value)} placeholder="ornek@eposta.com"/></label></div>
  <div className="bym-form-row"><label>Telefon<input type="tel" autoComplete="tel" name="phone" value={values.phone} onChange={e=>change('phone',e.target.value)} placeholder="05__ ___ __ __"/></label><label>Konu<input name="subject" value={values.subject} onChange={e=>change('subject',e.target.value)} placeholder="Projeniz hakkında"/></label></div>
  <label>Mesajınız *<textarea required rows={6} minLength={8} name="message" value={values.message} onChange={e=>change('message',e.target.value)} placeholder="Projenizi bize anlatın..."/></label>
  <p className="bym-form-note">Bu form bir demo e-posta akışı kullanır; gönder düğmesi, varsayılan e-posta uygulamanızda hazırlanmış mesajı açar. Sunucuda veri kaydetmez.</p>
  <button type="submit" className="bym-primary-button">E-posta oluştur <span aria-hidden>↗</span></button>
 </form>;
}
