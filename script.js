(() => {
  const KEY = "cantinho_apoio_posts_v1";
  const USER_KEY = "cantinho_apoio_browser_user_v1";
  const $ = id => document.getElementById(id);
  const modal = $("composerModal"), form = $("postForm"), textInput = $("postText");
  const imageInput = $("imageInput"), preview = $("imagePreview"), previewWrap = $("imagePreviewWrap");
  const userId = getOrCreateUserId();
  let selectedImage = "", editingPostId = null, posts = loadPosts();

  function makeId() { return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }
  function getOrCreateUserId() {
    try {
      let id = localStorage.getItem(USER_KEY);
      if (!id) { id = makeId(); localStorage.setItem(USER_KEY, id); }
      return id;
    } catch { return "this-browser-session"; }
  }
  function loadPosts() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(data)) return [];
      // Posts antigos deste protótipo não tinham identificador de autor.
      // Como os dados são locais, associamos os antigos ao navegador atual.
      return data.map(post => ({
        ...post,
        id: post.id || makeId(),
        ownerId: post.ownerId || userId,
        likes: Number.isFinite(post.likes) ? post.likes : 0,
        likedBy: Array.isArray(post.likedBy) ? post.likedBy : []
      }));
    } catch { return []; }
  }
  function savePosts() {
    try { localStorage.setItem(KEY, JSON.stringify(posts)); return true; }
    catch {
      $("formError").textContent = "Não foi possível salvar. A imagem pode ser grande demais ou o navegador pode estar sem espaço. Tente uma foto menor.";
      return false;
    }
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
      const article = card.querySelector(".post-card");
      article.dataset.postId = post.id;
      card.querySelector(".author-name").textContent = post.name || "Alguém do Cantinho";
      card.querySelector(".post-date").textContent = dateLabel(post.updatedAt || post.createdAt) + (post.updatedAt ? " · editado" : "");
      card.querySelector(".post-text").textContent = post.text;
      const image = card.querySelector(".post-image");
      if (post.image) {
        image.src = post.image;
        image.hidden = false;
        image.addEventListener("error", () => { image.hidden = true; }, {once:true});
      }
      const likeButton = card.querySelector(".like-button");
      const liked = post.likedBy.includes(userId);
      likeButton.setAttribute("aria-pressed", String(liked));
      likeButton.classList.toggle("is-liked", liked);
      likeButton.querySelector(".like-count").textContent = String(post.likes || 0);
      likeButton.addEventListener("click", () => toggleLike(post.id));
      const ownerActions = card.querySelector(".owner-actions");
      ownerActions.hidden = post.ownerId !== userId;
      card.querySelector(".edit-post-button").addEventListener("click", () => startEditing(post.id));
      card.querySelector(".delete-post-button").addEventListener("click", () => deletePost(post.id));
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
    editingPostId = null; form.reset(); clearImage();
    $("charCount").textContent = "0/1200";
    $("composerTitle").innerHTML = 'Compartilhe algo bom <span>♡</span>';
    $("submitPost").textContent = "♡ Publicar mensagem";
  }
  function clearImage() {
    selectedImage = ""; imageInput.value = ""; preview.removeAttribute("src"); previewWrap.hidden = true;
  }
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) return reject(new Error("Escolha um arquivo de imagem válido."));
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Não foi possível abrir essa imagem. Se ela estiver em HEIC/HEIF, tente convertê-la para JPG ou PNG.")); };
      img.onload = () => {
        try {
          const scale = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("O navegador não conseguiu preparar a imagem. Tente uma foto JPG ou PNG.");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) return reject(new Error("Não foi possível converter a imagem. Tente salvar a foto como JPG e selecionar novamente."));
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Não foi possível preparar a imagem para salvar."));
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          }, "image/jpeg", 0.68);
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err instanceof Error ? err : new Error("Não foi possível processar essa imagem."));
        }
      };
      img.src = objectUrl;
    });
  }
  function startEditing(id) {
    const post = posts.find(item => item.id === id);
    if (!post || post.ownerId !== userId) return;
    editingPostId = id;
    $("authorName").value = post.name || "";
    textInput.value = post.text || "";
    $("charCount").textContent = `${textInput.value.length}/1200`;
    selectedImage = post.image || "";
    if (selectedImage) { preview.src = selectedImage; previewWrap.hidden = false; }
    else { clearImage(); }
    $("composerTitle").innerHTML = 'Edite sua mensagem <span>♡</span>';
    $("submitPost").textContent = "Salvar alterações";
    $("formError").textContent = "";
    openModal();
  }
  function deletePost(id) {
    const post = posts.find(item => item.id === id);
    if (!post || post.ownerId !== userId) return;
    if (!window.confirm("Tem certeza de que deseja excluir esta publicação?")) return;
    const previous = posts;
    posts = posts.filter(item => item.id !== id);
    if (!savePosts()) { posts = previous; return; }
    render();
  }
  function toggleLike(id) {
    const post = posts.find(item => item.id === id);
    if (!post) return;
    post.likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    if (post.likedBy.includes(userId)) {
      post.likedBy = post.likedBy.filter(id => id !== userId);
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
    }
    if (!savePosts()) {
      // Evita deixar a interface em um estado diferente do que foi salvo.
      posts = loadPosts();
    }
    render();
  }

  $("openComposer").addEventListener("click", () => { editingPostId = null; form.reset(); clearImage(); $("composerTitle").innerHTML = 'Compartilhe algo bom <span>♡</span>'; $("submitPost").textContent = "♡ Publicar mensagem"; openModal(); });
  $("emptyCompose").addEventListener("click", () => { editingPostId = null; form.reset(); clearImage(); openModal(); });
  $("closeComposer").addEventListener("click", closeModal);
  $("cancelComposer").addEventListener("click", closeModal);
  modal.querySelector("[data-close-modal]").addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });
  textInput.addEventListener("input", () => { $("charCount").textContent = `${textInput.value.length}/1200`; $("formError").textContent = ""; });
  $("chooseImage").addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files && imageInput.files[0]; if (!file) return;
    $("formError").textContent = "";
    if (file.size > 15 * 1024 * 1024) { $("formError").textContent = "Escolha uma imagem com menos de 15 MB."; imageInput.value = ""; return; }
    try { selectedImage = await compressImage(file); preview.src = selectedImage; previewWrap.hidden = false; }
    catch (err) { $("formError").textContent = err.message || "Não foi possível carregar a imagem."; clearImage(); }
  });
  $("removeImage").addEventListener("click", clearImage);
  form.addEventListener("submit", e => {
    e.preventDefault(); $("formError").textContent = "";
    const text = textInput.value.trim();
    if (!text) { $("formError").textContent = "Escreva uma mensagem antes de publicar."; textInput.focus(); return; }
    if (editingPostId) {
      const post = posts.find(item => item.id === editingPostId);
      if (!post || post.ownerId !== userId) { $("formError").textContent = "Não foi possível editar esta publicação neste navegador."; return; }
      const previous = {...post};
      post.name = $("authorName").value.trim().slice(0, 40);
      post.text = text; post.image = selectedImage; post.updatedAt = new Date().toISOString();
      if (!savePosts()) { Object.assign(post, previous); return; }
    } else {
      const post = {id:makeId(),ownerId:userId,name:$("authorName").value.trim().slice(0,40),text,image:selectedImage,createdAt:new Date().toISOString(),likes:0,likedBy:[]};
      posts.unshift(post);
      if (!savePosts()) { posts.shift(); return; }
    }
    render(); closeModal();
    window.scrollTo({top:$("feed").offsetTop - 24,behavior:"smooth"});
  });
  // Save the IDs generated for older local posts so they remain stable on refresh.
  savePosts();
  render();
})();
