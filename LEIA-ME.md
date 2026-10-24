# Cantinho do Apoio — versão atualizada

## Arquivos
- `index.html`: estrutura do site.
- `style.css`: aparência e estilos.
- `script.js`: publicações, curtidas, imagens e edição/exclusão.

Mantenha os três arquivos na mesma pasta ao publicar no GitHub Pages.

## O que foi acrescentado
- Botão de curtir/descurtir e contador de curtidas, salvo neste navegador.
- Opções de editar e excluir publicações criadas neste navegador.
- Tratamento de imagens com redução para JPEG, limite de tamanho e mensagens de erro mais claras.
- Mensagens de erro melhores para fotos que o navegador não consegue abrir, como alguns arquivos HEIC/HEIF.

## Limitações importantes
Este é um protótipo sem contas, servidor ou banco de dados compartilhado. As publicações, imagens e curtidas ficam no `localStorage` do navegador e não aparecem para outras pessoas em seus aparelhos. Os controles de autor servem apenas para o uso local de demonstração; não são uma proteção segura contra outras pessoas que usem o mesmo navegador. Para um mural público com curtidas compartilhadas e edição/exclusão realmente restritas ao autor, será necessário implementar autenticação e banco de dados/backend.

## Se a imagem continuar falhando
Tente uma foto JPG ou PNG comum. Alguns celulares fornecem fotos HEIC/HEIF, que nem todo navegador consegue abrir. O site reduz a imagem antes de salvar, mas o armazenamento local do navegador continua tendo limites.
