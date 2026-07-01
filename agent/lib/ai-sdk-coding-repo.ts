import type { SandboxSession } from "eve/sandbox";

export const aiSdkCodingSandboxBootstrapHash =
  "vercel-ai-shallow-clone-safe-directory-v3";

export async function bootstrapAiSdkCodingRepo({
  session,
  abortSignal,
}: {
  readonly session: SandboxSession;
  readonly abortSignal?: AbortSignal;
}): Promise<void> {
  await trustSandboxWorkdirForGit({ session, abortSignal });

  const cloneResult = await session.run({
    command:
      "test -d .git || git clone --depth 1 https://github.com/vercel/ai.git .",
    abortSignal,
  });
  if (cloneResult.exitCode !== 0) {
    throw new Error(
      `Failed to clone vercel/ai (exit ${cloneResult.exitCode}): ${cloneResult.stderr}`,
    );
  }

  await installAiSdkDependencies({ session, abortSignal });
}

export async function refreshAiSdkCodingRepo({
  session,
  abortSignal,
}: {
  readonly session: SandboxSession;
  readonly abortSignal?: AbortSignal;
}): Promise<void> {
  const statusResult = await session.run({
    command: "git status --porcelain",
    abortSignal,
  });
  if (statusResult.exitCode !== 0) {
    throw new Error(
      `Failed to check repository status (exit ${statusResult.exitCode}): ${statusResult.stderr}`,
    );
  }
  if (statusResult.stdout.trim().length > 0) return;

  const beforePull = await gitHead({
    session,
    abortSignal,
  });
  const pullResult = await session.run({
    command: "git pull --ff-only",
    abortSignal,
  });
  if (pullResult.exitCode !== 0) {
    throw new Error(
      `Failed to update vercel/ai (exit ${pullResult.exitCode}): ${pullResult.stderr}`,
    );
  }
  const afterPull = await gitHead({
    session,
    abortSignal,
  });
  if (beforePull !== afterPull) {
    await installAiSdkDependencies({
      session,
      abortSignal,
    });
  }
}

async function trustSandboxWorkdirForGit({
  session,
  abortSignal,
}: {
  readonly session: SandboxSession;
  readonly abortSignal?: AbortSignal;
}): Promise<void> {
  const result = await session.run({
    command: 'git config --global --add safe.directory "$(pwd)"',
    abortSignal,
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `Failed to configure trusted Git workspace (exit ${result.exitCode}): ${result.stderr}`,
    );
  }
}

async function gitHead({
  session,
  abortSignal,
}: {
  readonly session: SandboxSession;
  readonly abortSignal?: AbortSignal;
}): Promise<string> {
  const result = await session.run({
    command: "git rev-parse HEAD",
    abortSignal,
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `Failed to resolve repository HEAD (exit ${result.exitCode}): ${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

async function installAiSdkDependencies({
  session,
  abortSignal,
}: {
  readonly session: SandboxSession;
  readonly abortSignal?: AbortSignal;
}): Promise<void> {
  const installResult = await session.run({
    command: "pnpm install",
    abortSignal,
  });
  if (installResult.exitCode !== 0) {
    throw new Error(
      `Failed to install dependencies (exit ${installResult.exitCode}): ${installResult.stderr}`,
    );
  }
}
