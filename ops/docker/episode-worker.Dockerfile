ARG BASE_IMAGE=jiang-lens-agents:spawnfile
FROM ${BASE_IMAGE}

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

COPY ops/scripts/configure-agent-github.sh /usr/local/bin/configure-agent-github
RUN chmod +x /usr/local/bin/configure-agent-github

USER spawnfile
