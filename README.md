# Android Build

Este projeto gera um APK utilizando **Capacitor** e **GitHub Actions**, fazendo o processo de compilação e distribuição do aplicativo mais facil.

## Como usar no repositório?

1. Envie o conteúdo desta pasta para a raiz do repositório `Edrim2/Chess-academy`, mantendo a pasta `.github` e sua estrutura.
2. No GitHub, acesse a aba **Actions** e execute o workflow **Build Chess Academy APK** para iniciar uma compilação manual. Ao finalizar, o APK estará disponível na seção **Artifacts**.
3. Para anexar automaticamente o APK aos **Assets** de uma Release, crie e envie uma nova tag, por exemplo `v0.2.0`. O workflow detectará a tag, iniciará a compilação e anexará o APK à Release correspondente.

## Processo de compilação

A compilação é realizada automaticamente pelo **GitHub Actions**, utilizando o **Capacitor** para gerar o aplicativo a partir dos arquivos desse projeto.

## Observação importante

A versão atual do aplicativo funciona como um invólucro Android que carrega a versão publicada no GitHub Pages. Portanto, é necessário que o GitHub Pages esteja publicado e que o dispositivo tenha acesso à internet para utilizar o aplicativo.

Para oferecer suporte completo ao funcionamento offline, será necessário incluir os arquivos HTML e a biblioteca `chess.js` diretamente no diretório `src/` utilizado pelo Capacitor e realizar uma nova compilação.

Esse README será atualizado conforme novas versões forem lançadas.

**OBS:** Por enquanto, esta é a única versão official por enquanto, uma versão para PC será feita no futuro.
