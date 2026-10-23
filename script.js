(() => {
  const KEY = "cantinho_apoio_posts_v1";
  const $ = id => document.getElementById(id);
  const modal = $("composerModal"), form = $("postForm"), textInput = $("postText");
  const imageInput = $("imageInput"), preview = $("imagePreview"), previewWrap = $("imagePreviewWrap");
  let selectedImage = "", posts = loadPosts();

  function loadPosts() {
    try { const data = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(data) ? data : []; }
    catch { return []; }
  }
  function savePosts() {
    try { localStorage.setItem(KEY, JSON.stringify(posts)); return true; }
    catch { $("formError").textContent = "Não foi possível salvar. Tente uma imagem menor ou libere espaço no navegador."; return false; }
  }
  function dateLabel(value) {
    try { return new Intl.DateTimeFormat("pt-BR", {dateStyle:"medium",timeStyle:"short"}).format(new Date(value)); }
    catch { return "Agora mesmo"; }
  }
  function render() {
    document.querySelectorAll(".post-card").forEach(el => el.remove());
    $("emptyState").hidden = posts.length > 0;
    $("postCount").textContent = `${posts.length} ${posts.length === 1 ? "publicação" : "publicações"}`;
    posts.forEach(post => {
      const card = $("postTemplate").content.cloneNode(true);
      card.querySelector(".author-name").textContent = post.name || "Alguém do Cantinho";
      card.querySelector(".post-date").textContent = dateLabel(post.createdAt);
      card.querySelector(".post-text").textContent = post.text;
      const image = card.querySelector(".post-image");
      if (post.image) { image.src = post.image; image.hidden = false; }
      $("feed").appendChild(card);
    });
  }
  function openModal() {
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden"; setTimeout(() => textInput.focus(), 40);
  }
  function closeModal() {
    modal.classList.remove("is-open"); modal.setAttribute("aria-hidden","true");
    document.body.style.overflow = ""; $("formError").textContent = "";
  }
  function clearImage() {
    selectedImage = ""; imageInput.value = ""; preview.removeAttribute("src"); previewWrap.hidden = true;
  }
  function compressImage(file) {
    return new Promise((resolve,reject) => {
      if (!file.type.startsWith("image/")) return reject(new Error("Escolha um arquivo de imagem válido."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Não foi possível abrir essa imagem."));
        img.onload = () => {
          const scale = Math.min(1, 1200 / Math.max(img.width,img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1,Math.round(img.width*scale)); canvas.height = Math.max(1,Math.round(img.height*scale));
          canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
          resolve(canvas.toDataURL("image/jpeg",.78));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  $("openComposer").addEventListener("click",openModal);
  $("emptyCompose").addEventListener("click",openModal);
  $("closeComposer").addEventListener("click",closeModal);
  $("cancelComposer").addEventListener("click",closeModal);
  modal.querySelector("[data-close-modal]").addEventListener("click",closeModal);
  document.addEventListener("keydown",e => { if(e.key==="Escape" && modal.classList.contains("is-open")) closeModal(); });
  textInput.addEventListener("input",() => { $("charCount").textContent = `${textInput.value.length}/1200`; $("formError").textContent = ""; });
  $("chooseImage").addEventListener("click",() => imageInput.click());
  imageInput.addEventListener("change",async () => {
    const file = imageInput.files && imageInput.files[0]; if(!file) return;
    $("formError").textContent = "";
    if(file.size > 12*1024*1024) { $("formError").textContent = "Escolha uma imagem com menos de 12 MB."; imageInput.value=""; return; }
    try { selectedImage = await compressImage(file); preview.src=selectedImage; previewWrap.hidden=false; }
    catch(err) { $("formError").textContent = err.message || "Não foi possível carregar a imagem."; clearImage(); }
  });
  $("removeImage").addEventListener("click",clearImage);
  form.addEventListener("submit",e => {
    e.preventDefault(); $("formError").textContent = "";
    const text = textInput.value.trim();
    if(!text) { $("formError").textContent = "Escreva uma mensagem antes de publicar."; textInput.focus(); return; }
    const post = {name:$("authorName").value.trim().slice(0,40),text,image:selectedImage,createdAt:new Date().toISOString()};
    posts.unshift(post);
    if(!savePosts()) { posts.shift(); return; }
    render(); form.reset(); $("charCount").textContent="0/1200"; clearImage(); closeModal();
    window.scrollTo({top:$("feed").offsetTop-24,behavior:"smooth"});
  });
  render();
})();