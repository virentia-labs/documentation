import assert from "node:assert/strict";
import { test } from "node:test";
import { scope, scoped } from "@virentia/core";
import { customDefaults, editProfile, Profile, shareEmail, transferProfile } from "./forms.js";
import { savePreferences, Preferences } from "./storage.js";
import { searchIndependently, Search } from "./net.js";
import { navigateIndependently, Screen } from "./router.js";
import { memory } from "@virentia/storage-core";
import { createMemoryHistory } from "history";
import { historyAdapter } from "@virentia/router";

test("documented field factories, nested collections and fieldType methods", async () => {
  assert.deepEqual(await editProfile(), {
    email: "ada@example.com",
    contacts: [
      { email: "seed@example.com", label: "seed", phones: ["000"] },
      { email: "work@example.com", label: "work", phones: ["123", "456"] },
    ],
  });
});

test("documented custom factory defaults survive reset", async () => {
  assert.deepEqual(await customDefaults(), {
    value: "Draft", meta: { label: "Caption" }, error: "Needs review",
  });
});

test("documented refs share an owned field without transferring its lifetime", async () => {
  const app = scope(), profile = scoped(app, () => Profile.create({ id: "owner" }));
  const first = shareEmail(app, profile), second = shareEmail(app, profile);
  try {
    await first.form.fill({ values: { email: "shared@example.com" } });
    assert.equal(second.form.values.value.email, "shared@example.com");
    await first.dispose();
    assert.equal(profile.email.value!.alive, true);
    await second.form.fill({ values: { email: "live@example.com" } });
    assert.equal(profile.email.value!.value.value, "live@example.com");
  } finally { await first.dispose(); await second.dispose(); await profile.dispose(); }
});

test("documented JSON transfer restores nested order and original reset state", async () => {
  const server = scope(), profile = scoped(server, () => Profile.create({ id: "profile" }));
  await profile.form.fill({ values: { contacts: [
    { email: "edited@example.com", label: "edited", phones: ["111", "222"] },
    { email: "other@example.com", label: "other", phones: [] },
  ] } });
  await profile.contacts.value!.field.move(1, 0);
  const { restored } = transferProfile(server, profile);
  try {
    assert.deepEqual(restored.form.values.value, profile.form.values.value);
    await restored.contacts.value!.field.items.value[1]!.fields.value.phones.push("333");
    assert.deepEqual(profile.form.values.value.contacts[1]!.phones, ["111", "222"]);
    await restored.form.reset();
    assert.deepEqual(restored.form.values.value.contacts, [
      { email: "seed@example.com", label: "seed", phones: ["000"] },
    ]);
  } finally { await restored.dispose(); await profile.dispose(); }
});

test("documented storage keys and cleanup are instance-local", async () => {
  assert.deepEqual(await savePreferences(), { saved: ["dark", "light"], sibling: "contrast" });
  const app = scope(), box = memory();
  const first = scoped(app, () => Preferences.create({ id: "reuse" }));
  first.connect(box, "theme");
  first.theme.value = "dark";
  await first.dispose();
  const fresh = scoped(app, () => Preferences.create({ id: "reuse" }));
  try {
    box.set("theme", "external");
    assert.equal(fresh.theme.value, "light");
    fresh.connect(box, "theme");
    assert.equal(fresh.theme.value, "external");
  } finally { await fresh.dispose(); }
});

test("documented query trigger, nested units, refresh and reset stay bound", async () => {
  assert.deepEqual(await searchIndependently(), {
    loaded: [{ text: "ADA" }, { text: "GRACE" }], reset: null, sibling: { text: "GRACE" },
  });
  const app = scope(), other = scope();
  const first = scoped(app, () => Search.create({ id: "same" }));
  const second = scoped(other, () => Search.create({ id: "same" }));
  try {
    await first.load("one");
    assert.equal(second.load.data.value, null);
    await first.dispose();
    await second.changed("two");
    assert.deepEqual(second.load.data.value, { text: "TWO" });
  } finally { await first.dispose(); await second.dispose(); }
});

test("documented router params, route handles and histories stay bound", async () => {
  assert.deepEqual(await navigateIndependently(), {
    paths: ["/edit/ada", "/edit/grace"], params: [{ id: "ada" }, { id: "grace" }], bound: true,
  });
  const app = scope(), instance = scoped(app, () => Screen.create({ id: "screen" }));
  const adapter = historyAdapter(createMemoryHistory());
  let removed = 0;
  const listen = adapter.listen.bind(adapter);
  adapter.listen = callback => {
    const subscription = listen(callback);
    return { unsubscribe() { removed++; subscription.unsubscribe(); } };
  };
  try { await instance.navigation.setHistory(adapter); }
  finally { await instance.dispose(); }
  assert.equal(removed, 1);
});
