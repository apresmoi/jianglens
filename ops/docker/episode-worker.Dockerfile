ARG BASE_IMAGE=jiang-lens-agents:spawnfile
FROM ${BASE_IMAGE}

ARG CODEX_VERSION=0.128.0
ARG NODE_MAJOR=22

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git gnupg python3-pip \
  && mkdir -p -m 755 /etc/apt/keyrings \
  && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && curl -fsSL "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && chmod go+r /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends gh nodejs \
  && node --version \
  && npm --version \
  && python3 -m pip install --no-cache-dir --break-system-packages yt-dlp \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g --omit=dev --no-fund --no-audit "@openai/codex@${CODEX_VERSION}"

RUN curl -fsSL https://moltnet.dev/install.sh | sh \
  && install -m 0755 /root/.local/bin/moltnet /usr/local/bin/moltnet \
  && moltnet version

COPY ops/scripts/configure-agent-github.sh /usr/local/bin/configure-agent-github
RUN chmod +x /usr/local/bin/configure-agent-github

USER spawnfile
