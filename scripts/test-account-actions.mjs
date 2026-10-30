import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { randomUUID } from "node:crypto";
import ts from "typescript";

// Ejecuta las acciones reales con el límite de Supabase simulado.
// No lee credenciales, no envía correos ni cambia contraseñas reales.
const code = ts.transpileModule(
  await readFile(
    new URL("../src/app/configuracion/actions.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
let logged = true,
  hasPassword = true,
  denyCurrent = false,
  updateError = null;
const calls = [];
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "creador@lernze.test",
  demo: false,
};
const db = {
  auth: {
    getUser: async () => ({
      data: {
        user: {
          identities: hasPassword
            ? [{ provider: "email" }]
            : [{ provider: "google" }],
        },
      },
    }),
    signInWithPassword: async () => {
      calls.push("verify-current");
      return {
        error: denyCurrent ? { message: "Invalid login credentials" } : null,
      };
    },
    updateUser: async (attrs, options) => {
      calls.push({ attrs, options });
      return { data: { user: { email: user.email } }, error: updateError };
    },
    reauthenticate: async () => {
      calls.push("code");
      return { error: null };
    },
  },
};
const mocks = {
  "node:crypto": { randomUUID },
  "next/headers": {
    headers: async () => new Map([["origin", "https://lernze.test"]]),
  },
  "next/cache": { revalidatePath() {}, revalidateTag() {} },
  "@/lib/auth": { getCurrentUser: async () => (logged ? user : null) },
  "@/lib/supabase/server": { createSessionClient: async () => db },
  "@/lib/profile": { avatarUrl: () => null },
};
const testModule = { exports: {} };
vm.runInNewContext(code, {
  exports: testModule.exports,
  module: testModule,
  require: (name) => {
    if (!(name in mocks)) throw Error("Unexpected import " + name);
    return mocks[name];
  },
  process: { env: {} },
  console,
  FormData,
});
const actions = testModule.exports;
const form = (values) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
};
let checks = 0;
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
  console.log("✓ " + message);
};
logged = false;
check(
  (await actions.changeEmailAction({}, form({ email: "otra@lernze.test" })))
    .error,
  "Sin sesión no se modifica el correo",
);
check(
  (
    await actions.changePasswordAction(
      {},
      form({ password: "NuevaClave123!", confirmPassword: "NuevaClave123!" }),
    )
  ).error,
  "Sin sesión no se modifica la contraseña",
);
check(
  calls.length === 0,
  "Las solicitudes sin sesión no llegan a Supabase Auth",
);
logged = true;
check(
  (await actions.changeEmailAction({}, form({ email: "invalido" }))).error,
  "Se rechazan correos inválidos",
);
check(
  (await actions.changeEmailAction({}, form({ email: user.email }))).error,
  "Se detecta el correo sin cambios",
);
const email = await actions.changeEmailAction(
  {},
  form({ email: " NUEVA@LERNZE.TEST " }),
);
check(
  email.notice?.includes("confirma"),
  "Cambiar correo explica la confirmación pendiente",
);
check(
  calls.at(-1).attrs.email === "nueva@lernze.test",
  "El correo se normaliza antes de enviarlo a Supabase",
);
check(
  calls.at(-1).options.emailRedirectTo ===
    "https://lernze.test/auth/callback?next=/configuracion",
  "La confirmación vuelve a Configuración",
);
calls.length = 0;
check(
  (
    await actions.changePasswordAction(
      {},
      form({ password: "corta", confirmPassword: "corta" }),
    )
  ).error,
  "Se valida la longitud de la contraseña",
);
check(
  (
    await actions.changePasswordAction(
      {},
      form({
        password: "NuevaClave123!",
        confirmPassword: "DistintaClave123!",
      }),
    )
  ).error,
  "Se exige confirmar la nueva contraseña",
);
check(
  (
    await actions.changePasswordAction(
      {},
      form({ password: "NuevaClave123!", confirmPassword: "NuevaClave123!" }),
    )
  ).error,
  "Las cuentas con contraseña deben indicar la actual",
);
denyCurrent = true;
check(
  (
    await actions.changePasswordAction(
      {},
      form({
        currentPassword: "Incorrecta123!",
        password: "NuevaClave123!",
        confirmPassword: "NuevaClave123!",
      }),
    )
  ).error,
  "Una contraseña actual incorrecta no permite cambiarla",
);
check(
  calls.every((c) => typeof c === "string"),
  "Los errores de validación no invocan updateUser",
);
denyCurrent = false;
calls.length = 0;
check(
  (
    await actions.changePasswordAction(
      {},
      form({
        currentPassword: "Anterior123!",
        password: "NuevaClave123!",
        confirmPassword: "NuevaClave123!",
      }),
    )
  ).saved,
  "El flujo válido permite guardar una contraseña",
);
check(
  calls[0] === "verify-current" &&
    calls[1].attrs.current_password === "Anterior123!",
  "La identidad se verifica antes de actualizar la contraseña",
);
hasPassword = false;
calls.length = 0;
check(
  (
    await actions.changePasswordAction(
      {},
      form({ password: "NuevaClave123!", confirmPassword: "NuevaClave123!" }),
    )
  ).error,
  "Una cuenta externa necesita el código antes de añadir contraseña",
);
check(
  (await actions.sendPasswordCodeAction()).notice,
  "Se puede solicitar verificación por correo",
);
check(
  (
    await actions.changePasswordAction(
      {},
      form({
        password: "NuevaClave123!",
        confirmPassword: "NuevaClave123!",
        nonce: "123456",
      }),
    )
  ).saved,
  "La cuenta externa envía el código a Supabase al crear contraseña",
);
check(
  calls.at(-1).attrs.nonce === "123456",
  "El código no se omite en la llamada de autenticación",
);
updateError = { code: "same_password" };
check(
  (
    await actions.changePasswordAction(
      {},
      form({
        password: "NuevaClave123!",
        confirmPassword: "NuevaClave123!",
        nonce: "123456",
      }),
    )
  ).error?.includes("diferente"),
  "Los errores de Supabase se explican en español",
);
console.log(`\n${checks} comprobaciones de acciones de cuenta aprobadas.`);
