# Enquadramento — o que mais deu retrabalho

> Fonte de verdade: `cortes-culto` (`render/rastrear.py`, `docs/persona-shorts.md`, `docs/palavra.md`, 08–09/11/2026).
> Siga à risca; cada item abaixo custou uma rodada de render reprovada.

## Antes de tudo: o limite físico

Gravação em **1080p** significa que todo zoom amplia pixels reais — não existe "4K de verdade" sem gravar em 4K.
Recomendação ao dono do canal: **gravar em 4K** dobra o detalhe do recorte vertical.

## Padrão aprovado: parado + deslizadas

"Mexe o mínimo possível." O recorte fica **parado**; só **desliza** quando precisa.

- Modo `auto`: se o orador **cabe no quadro** o trecho inteiro → recorte `fixo`; senão → `rampas`.
- Rampas: fica parado enquanto ele está no **terço central**; desliza quando ele passa **~2 s fora** do terço
  central; **≥ 4 s entre movimentos**; se ele **vai sair** do quadro, move antes.
- Cada movimento é uma **rampa de 0,7 s com easing cosseno**, e o `x` do crop é uma **expressão de `t`** avaliada
  pelo ffmpeg a cada quadro (soma de rampas):
  ```python
  # marcos = [(t_inicio, x_destino, duracao), ...]
  termos = [f"({x - ant:.1f})*(1-cos(PI*clip((t-{t:.3f})/{d:.2f},0,1)))/2" for (t, x, d) in marcos]  # ant = x anterior
  x_expr = f"{x0}+" + "+".join(termos)
  ```
  ```
  crop=cw:ch:'<x_expr>':y
  ```
- **Reprovados:** câmera "preguiçosa" (atrasada, aos trancos), seguir contínuo (tremia), planos com corte seco,
  recorte fixo no centro com câmera aberta (palco vazio).

## Rastrear o corpo, não o rosto

- O orador é detectado como **retângulo do corpo** (YOLO, `ultralytics` yolov8n, classe pessoa, `conf=0.35`,
  `imgsz=640`), descartando caixas com altura < 25% do quadro (cabeças da plateia cortadas na borda).
- O rosto oscila com a cabeça e os gestos e fazia a câmera "nadar". Rosto (Haar) e HOG ficam só como reserva.
- **Âncora** = a faixa (1/3 do recorte) onde ele aparece em mais amostras — evita começar em quem cruza a câmera
  (criança no colo). Desligue a âncora (`ancora: false`) se um objeto parado (caixa de som, violão) a enganar.

## Crop em `yuv444p`

Em 4:2:0 o ffmpeg **arredonda o `x` para par** → o recorte anda "aos degraus" e treme. Faça o crop em `yuv444p` e
converta para `yuv420p` só no fim.

## Zoom: plano de cintura, por orador

"Sem muita calça." O zoom certo depende do orador e da câmera — registre por pessoa no projeto:

| Formato | Referência medida | Observação |
|---------|-------------------|------------|
| Vertical 9:16 | zoom ~1,9–2,0 com `crop_y` ~0,29–0,56 (por orador) | 2,7 no vertical vira faixa de ~225 px: corta braços, fica mole |
| Vídeo longo 16:9 | zoom **2,7** (cintura), folga de ~9% acima da cabeça | 1,2× ficou "de longe"; 1,6× ainda corpo inteiro; 2,4× aprovado e "menos calça" → 2,7× |
| Câmera já fechada | zoom 1,0 pode já ser cintura | confira a grade antes |

- O recorte **nunca sobe até o logo queimado** pela transmissão (ex.: y < 190 no 16:9).
- Com painel lateral no vídeo longo, o orador desliza ~500 px para o outro lado, para a mão não encostar no painel.

## Calibrar antes do render

Grade de 4 quadros para escolher `x`/`zoom`/`crop_y`:
```bash
ffmpeg -ss T -i video.mov -frames:v 1 -vf scale=640:-1 f_T.jpg            # ×4
ffmpeg -i f1.jpg -i f2.jpg -i f3.jpg -i f4.jpg \
  -filter_complex '[0][1][2][3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0' grade.jpg
```
No vídeo longo (render de 45–60 min), teste antes com uma folha de cada movimento de câmera (`--so-folha`) ou um
trecho real de ~1 min.

## Casos que não têm conserto por recorte

- Câmera aberta / perguntas com o orador andando: crop fixo manual por corte (`seguir: false`, `crop_x`/`zoom`).
- Trecho gravado por outra câmera (fundo da sala, vertical com barras pretas, desfocado): **descarte** o trecho.
- Criança ou pessoa cruzando: âncora resolve; se não, reprove no G4.

## Conferir o movimento (G4)

A folha de contato estática **já deixou passar problema de movimento**: extraia **sequências de quadros** nos pontos
críticos (cada deslizada, as bordas, quem cruza a câmera) e olhe em sequência.
