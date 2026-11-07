# Third-party notices

## andrej-karpathy-skills

`install/guidelines/karpathy-guidelines.md` is copied from
[forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
(`CLAUDE.md`), declared MIT-licensed in its README and plugin manifest. The guidelines are derived from
Andrej Karpathy's public observations on LLM coding pitfalls; they are not authored or endorsed by him.

> MIT License — Copyright (c) forrestchang
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
> associated documentation files (the "Software"), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
> following conditions: The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

## Superpowers

[obra/superpowers](https://github.com/obra/superpowers) (MIT, Copyright (c) 2025 Jesse Vincent) is **not
vendored**. ai-dev installs it as a Claude Code plugin (`install.sh --with-superpowers`) and routes to its
skills by name (`install/skills.md`). The SessionStart-hook approach used by ai-dev's knowledge brief is
inspired by Superpowers' own session-start hook.
