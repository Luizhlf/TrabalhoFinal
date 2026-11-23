async function enviar(formId, endpoint, montarDados, sucesso){
 const form=document.getElementById(formId);if(!form)return;
 form.addEventListener('submit',async e=>{
  e.preventDefault();const msg=document.getElementById('mensagem');msg.textContent='Aguarde...';
  try{
   const r=await fetch('/api/auth/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(montarDados())});
   const dados=await r.json().catch(()=>null);
   if(!r.ok)throw new Error(typeof dados==='string'?dados:(dados?.message||'Confira os dados informados.'));
   msg.textContent=sucesso;msg.style.color='green';setTimeout(() => {
       if (endpoint === "login" && dados.papel === "ADMIN") {
           location.href = "/admin.html";
       } else if (endpoint === "cadastro") {
           location.href = "/login.html";
       } else {
           location.href = "/";
       }
   }, 900);
  }catch(err){msg.textContent=err.message;msg.style.color='#a33';}
 });
}
enviar('loginForm','login',()=>({email:document.getElementById('email').value,senha:document.getElementById('senha').value}),'Login realizado!');
enviar('cadastroForm','cadastro',()=>({nome:document.getElementById('nome').value,email:document.getElementById('email').value,senha:document.getElementById('senha').value}),'Cadastro realizado! Você já pode entrar.');
