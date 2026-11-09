# Gotchas — todos os projetos

> Sintoma primeiro, para ser encontrado. Escrito com `aidev learn gotcha --global`.

| Sintoma | Causa | Correção | Origem |
|---------|-------|----------|--------|
| faster-whisper falha no Colab (libcublas/cudnn) ou decode_audio dá TypeError metadata_errors | Colab em CUDA 13 e PyAV incompatível | pip nvidia-cublas-cu12 nvidia-cudnn-cu12==9.*, pré-carregar via ctypes RTLD_GLOBAL, passar o áudio como numpy | piloto Colab 07/11 |
| legenda queimada sai em fonte de quadrinhos | fonte pedida não existe na VM; libass cai na Humor Sans | levar a fonte na pasta do projeto e usar fontsdir=; conferir com fc-list | piloto Colab 07/11 |
