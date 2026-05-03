ARG BASE_IMAGE=jiang-lens-agents:spawnfile
FROM ${BASE_IMAGE}

ARG CODEX_VERSION=0.128.0

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git gnupg \
  && mkdir -p -m 755 /etc/apt/keyrings \
  && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends gh \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g --omit=dev --no-fund --no-audit "@openai/codex@${CODEX_VERSION}"

COPY ops/scripts/configure-agent-github.sh /usr/local/bin/configure-agent-github
COPY ops/scripts/episode-worker-entrypoint.sh /usr/local/bin/episode-worker-entrypoint
RUN chmod +x /usr/local/bin/configure-agent-github /usr/local/bin/episode-worker-entrypoint

USER spawnfile

ENTRYPOINT ["/usr/local/bin/episode-worker-entrypoint"]
