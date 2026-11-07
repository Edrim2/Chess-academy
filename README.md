# Chess Academy Android build

Este projeto gera um APK Android usando Capacitor e GitHub Actions.

## Como usar no repositório

1. Envie o conteúdo desta pasta para a raiz do repositório `Edrim2/Chess-academy`, mantendo a pasta `.github`.
2. No GitHub, abra **Actions** e execute **Build Chess Academy APK** para testar. O APK aparecerá em **Artifacts** ao terminar.
3. Para anexar automaticamente o APK aos **Assets** de uma Release, crie e envie uma tag nova, por exemplo `v0.2.0`. O workflow compila e anexa o APK à Release dessa tag.

## Observação importante

Este primeiro invólucro Android abre a versão publicada no GitHub Pages. Portanto, o GitHub Pages precisa estar publicado e o aparelho precisa de internet. Para uma versão totalmente offline, será necessário colocar o HTML e a biblioteca chess.js dentro de `src/` e compilar novamente.
