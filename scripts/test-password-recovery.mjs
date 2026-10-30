import fs from "node:fs/promises";
import vm from "node:vm";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const load = async (file, mocks) => {
  const code = ts.transpileModule(
    await fs.readFile(new URL("../" + file, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(code, {
    module: testModule,
    exports: testModule.exports,
    require: (n) => mocks[n],
    Date,
    Number,
    process: { env: {} },
  });
  return testModule.exports;
};
const helper = await load("src/lib/password-recovery.ts", {});
let now = Date.now(),
  claims = {
    sub: "own",
    amr: [{ method: "recovery", timestamp: Math.floor(now / 1000) }],
  },
  updates = 0,
  recoveries = 0,
  signedOut = false,
  recoveryError = null;
const db = {
  auth: {
    getUser: async () => ({ data: { user: { id: "own" } }, error: null }),
    getClaims: async () => ({ data: { claims }, error: null }),
    updateUser: async () => {
      updates++;
      return { error: null };
    },
    signOut: async () => {
      signedOut = true;
      return { error: null };
    },
    resetPasswordForEmail: async (email, opts) => {
      recoveries++;
      assert.equal(email, "ana@lernze.test");
      assert.ok(
        opts.redirectTo.startsWith("https://lernze.test/auth/callback?next="),
      );
      return { error: recoveryError };
    },
  },
};
const a = await load("src/app/recuperar-contrasena/actions.ts", {
  "next/headers": {
    headers: async () => new Map([["origin", "https://lernze.test"]]),
  },
  "@/lib/supabase/server": { createSessionClient: async () => db },
  "@/lib/auth": {
    safeNext: (s, f) => (s.startsWith("/") && !s.startsWith("//") ? s : f),
  },
  "@/lib/password-recovery": helper,
});
const form = (o) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const valid = form({
  password: "NuevaClave123!",
  confirmPassword: "NuevaClave123!",
});
assert.ok(
  (await a.requestRecoveryAction({}, form({ email: "incorrecto" }))).error,
);
assert.equal(recoveries, 0);
const sent = await a.requestRecoveryAction(
  {},
  form({ email: " ANA@LERNZE.TEST ", next: "https://evil.test" }),
);
assert.ok(sent.saved);
recoveryError = { code: "user_not_found" };
assert.equal(
  (await a.requestRecoveryAction({}, form({ email: "ana@lernze.test" })))
    .notice,
  sent.notice,
);
recoveryError = { code: "over_email_send_rate_limit" };
assert.equal(
  (await a.requestRecoveryAction({}, form({ email: "ana@lernze.test" })))
    .notice,
  sent.notice,
);
claims = { sub: "own", amr: [{ method: "password", timestamp: now / 1000 }] };
assert.ok((await a.resetPasswordAction({}, valid)).error);
assert.equal(updates, 0);
claims = { sub: "other", amr: [{ method: "recovery", timestamp: now / 1000 }] };
assert.ok((await a.resetPasswordAction({}, valid)).error);
claims = {
  sub: "own",
  amr: [{ method: "recovery", timestamp: now / 1000 - 1900 }],
};
assert.ok((await a.resetPasswordAction({}, valid)).error);
claims = {
  sub: "own",
  amr: [{ method: "recovery", timestamp: now / 1000 + 600 }],
};
assert.ok((await a.resetPasswordAction({}, valid)).error);
claims = { sub: "own", amr: [{ method: "recovery", timestamp: now / 1000 }] };
assert.ok(
  (
    await a.resetPasswordAction(
      {},
      form({ password: "corta", confirmPassword: "corta" }),
    )
  ).error,
);
assert.ok(
  (
    await a.resetPasswordAction(
      {},
      form({ password: "NuevaClave123!", confirmPassword: "otra" }),
    )
  ).error,
);
assert.ok((await a.resetPasswordAction({}, valid)).saved);
assert.equal(updates, 1);
assert.ok(signedOut);
console.log(
  "Recuperación: validación, privacidad del correo, sesión normal/ajena/vencida/futura y recuperación válida aprobadas. Sin correos ni credenciales reales.",
);
