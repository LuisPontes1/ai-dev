# Enquadramento vertical (9:16 a partir de 16:9)

## Padrão final aprovado

**Recorte parado o short inteiro**, posicionado onde o assunto passa a maior parte do tempo. Se ele sai do quadro,
**reduza o zoom** em vez de mover a câmera. Foram descartados: tracking que desliza o tempo todo e "planos fixos com
cortes secos".

## Calibrar antes de renderizar

Grade de 4 quadros do trecho para decidir o `x` do recorte:
```bash
for T in 47:00 57:30 1:05:30 1:24:40; do ffmpeg -ss $T -i video.mov -frames:v 1 -vf scale=640:-1 f_${T//:/}.jpg; done
ffmpeg -i f1.jpg -i f2.jpg -i f3.jpg -i f4.jpg -filter_complex '[0][1][2][3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0' grade.jpg
```
Recorte: `w = int(H*9/16)//2*2`, `x = (W-w)*CROP_X`, depois `scale=1080:1920` (ou 1440×2560, ver render).

Depois do render, confira com um tile de 3 quadros:
```bash
ffmpeg -i short.mp4 -vf "select='eq(n\,90)+eq(n\,700)+eq(n\,1300)',scale=360:-1,tile=3x1" -frames:v 1 conf.jpg
```

## Quando precisa mover: deslizada suave

A técnica que o usuário elogiou ("deslizada fluida… algo que você fez bem"): o `x` do `crop` é uma **expressão do
ffmpeg avaliada por quadro**, com rampas `clip()` e easing de cosseno — sem keyframes, sem saltos.

```python
RAMPA = 0.7  # s
# m(t) vai de 0 a 1 enquanto o motivo do movimento dura (a..b); vários blocos combinados com max()
termo = f"clip((t-{a-RAMPA})/{RAMPA},0,1)*clip(({b+RAMPA}-t)/{RAMPA},0,1)"
x = f"{xc}+({xm-xc})*(1-cos(PI*({m})))/2"     # xc = posição de repouso, xm = posição deslocada
```
```
[0:v]crop=cw:ch:'<x>':y,scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p[cam]
```
- Una blocos próximos (< 1,6 s de intervalo) para não ir e voltar.
- Só mova quando o assunto fica **alguns segundos** fora do centro, e respeite um intervalo mínimo entre movimentos.
- No vídeo longo com painel lateral, o mesmo mecanismo empurra o orador para a esquerda enquanto há painel e volta ao centro sem painel.

## Reprovar no G4

Criança ou pessoa aleatória no quadro; orador cortado pela metade; palco vazio (câmera aberta com recorte fixo no
centro); câmera trocada para vertical com barras pretas.

Gravação vertical de celular no meio do culto pode virar 9:16 "de verdade" no Short; no 16:9 aparece com barras.
