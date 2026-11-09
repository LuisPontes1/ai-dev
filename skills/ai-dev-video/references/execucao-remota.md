# Execução remota — Colab e VMs

## Por que remoto

Gravações têm 1,5–5 GB. Vídeo pesado roda no **Colab/VM**, perto do Drive; a máquina local só envia código, orquestra,
confere e baixa prévias. Trazer o render para a máquina local sem avisar foi um erro cobrado: "algo que era pra estar
100% no Colab e nas VMs você puxou pra cá??". Ferramentas leves (Demucs, scripts de layout) podem rodar localmente.

## Colab pela CLI (sem o navegador do usuário)

`google-colab-cli` (`colab --auth=adc`): `new --gpu T4` · `upload` · `drivemount` · `exec --timeout <s>` · `download` · `stop`.

- **Sempre `--timeout`** — o padrão (~30 s) mata jobs longos.
- **Empacote** o que a VM precisa num `.tgz` (código, roteiros, `identidade/` com fontes) e suba junto a config do rclone.
- **Ping-test** (`exec -f ping.py`) antes de um lote; se travar, derrube a VM e crie outra.
- O job apaga a credencial do rclone num `finally`.
- GPU recusada (limite de sessões) → VM só CPU com `libx264`. A VM CPU vem com OpenCV sem `CascadeClassifier`:
  `pip install ultralytics; pip uninstall -y opencv-python opencv-python-headless; pip install --no-deps opencv-python-headless==4.10.0.84`.
- O Drive tem **cota de escrita por minuto**: upload em lote cai → tente de novo com espera.
- Job longo: `nohup` na VM + loop de monitor; a conexão do `exec` cai, mas o processo continua — confira com `pgrep`
  antes de relançar.
- **Uma execução por VM.** Duas execuções concorrentes já apagaram a credencial do rclone uma da outra e a saída se
  perdeu com a VM. Ao reconectar, mate a execução antiga antes.
- Nunca encadeie `colab stop` em um comando que pode ser morto no meio (derrubou a VM com o trabalho).
- Vários eventos em paralelo = várias VMs. Desligue cada VM no fim.
- `drive.mount` pela CLI pede aprovação no navegador a cada VM nova; para não depender disso, use **rclone** com client
  próprio (o `.conf` sobe para a VM e é apagado no fim).
- **Copie o vídeo do Drive montado para o disco local da VM** antes de processar.
- **Suba cada vídeo pronto para o Drive imediatamente.** Acumular na VM arrisca perder tudo se ela cair.
- GPU alternativa quando a T4 está ocupada: L4.

## Fontes — a pasta do projeto

Nenhum script aponta para fonte do sistema. Fonte do macOS (Georgia, Noteworthy, Arial Unicode, Didot) não existe numa
VM Linux; o Colab só tem Liberation Sans/Serif/Mono e Humor Sans — e o libass **cai silenciosamente** na Humor Sans
(fonte de quadrinhos): os 10 Shorts do piloto saíram assim.

- Pasta `identidade/fontes/` (ou equivalente) **vai no pacote** de código para toda VM, com a licença de cada fonte e um LEIA-ME.
- Prefira fontes OFL (Google Fonts). libass precisa de **instâncias estáticas** (gere com o instancer do fontTools a
  partir da variable font).
- Antes de queimar legenda: `fc-list : family` no ambiente de destino; no filtro `subtitles`/`ass`, use `fontsdir=`.
- Fonte paga de identidade (ex.: título de série): sem a licença, não há título fiel. Demo costuma não ter acentos e
  proibir uso em redes — não use. O MCP do Canva troca texto, **não a família da fonte**, e não deixa baixar o arquivo.

## Drive

Estrutura por evento: `1-transcricao/` · `2-cortes-sugeridos/` · `3-publicacao/` · `5-previas/<lote>/` · `6-finais/`.
Originais nunca são apagados; descartes vão para `descartados/`.
