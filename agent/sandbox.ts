import { defineSandbox } from "eve/sandbox";
import { vercel } from "eve/sandbox/vercel";

import {
  aiSdkCodingSandboxBootstrapHash,
  bootstrapAiSdkCodingRepo,
  refreshAiSdkCodingRepo,
} from "./lib/ai-sdk-coding-repo.js";

export default defineSandbox({
  backend: vercel({
    runtime: "node24",
    ports: [4000],
  }),
  revalidationKey: () => aiSdkCodingSandboxBootstrapHash,
  async bootstrap({ use }) {
    const session = await use();
    await bootstrapAiSdkCodingRepo({
      session,
    });
  },
  async onSession({ use }) {
    const session = await use();
    await refreshAiSdkCodingRepo({
      session,
    });
  },
});
