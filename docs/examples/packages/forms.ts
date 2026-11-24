// #region definitions
import { scope, scoped, serialize, type Scope } from "@virentia/core";
import { children, refs, staticModel, type InstanceOf } from "@virentia/core/models";
import { createField, createForm, fieldType, type CreateFieldOptions } from "@virentia/forms";
import { arrayFieldModel, fieldModel, shapeFieldModel } from "@virentia/forms/models";

export const Email = fieldModel("", {
  name: "DocsEmail",
  validate: value => value.includes("@") ? null : "Invalid email",
});
export const Phones = arrayFieldModel(["000"], { name: "DocsPhones" });
// #endregion definitions

// #region custom
const CanonicalText = fieldType({
  create: (initial: string, options?: CreateFieldOptions<string>) => createField(initial, options),
}).extend({
  create(base, initial: string, options?: CreateFieldOptions<string>) {
    const field = base(initial, options);
    return { ...field, normalize: () => field.fill(field.read().trim().toLowerCase()) };
  },
});
export const Label = fieldModel("", {
  name: "DocsLabel",
  create: (initial, options) => CanonicalText(initial, options),
});
// #endregion custom

// #region defaults
const CaptionType = fieldType({
  create: (initial: string) => createField(initial.trim(), {
    meta: { label: "Caption" }, error: "Needs review",
  }),
});
const Caption = fieldModel<string, { label: string }>("  Draft  ", {
  name: "DocsCaption", create: initial => CaptionType(initial),
});

export async function customDefaults() {
  const caption = scoped(scope(), () => Caption.create({}));
  try {
    await caption.field.fill("edited");
    await caption.field.changeMeta({ label: "Edited" });
    await caption.field.reset();
    return { value: caption.field.read(), meta: caption.field.meta.value, error: caption.field.error.value };
  } finally { await caption.dispose(); }
}
// #endregion defaults

// #region collections
export const Contact = shapeFieldModel({ email: Email, label: Label, phones: Phones }, {
  name: "DocsContact",
});
export const Contacts = arrayFieldModel([
  { email: "seed@example.com", label: "seed", phones: ["000"] },
], { item: Contact, name: "DocsContacts" });
// #endregion collections

// #region form
export const Profile = staticModel({
  name: "DocsProfile",
  data: { email: children.one(Email), contacts: children.one(Contacts) },
  setup(self) {
    return { form: createForm({ schema: () => ({
      email: self.email.value!.field,
      contacts: self.contacts.value!.field,
    }) }) };
  },
  onCreate(self) {
    if (!self.email.value) self.email.create({});
    if (!self.contacts.value) self.contacts.create({});
  },
});
// #endregion form

// #region edit
export async function editProfile() {
  const app = scope();
  const profile = scoped(app, () => Profile.create({ id: "profile" }));
  try {
    await profile.form.fill({ values: { email: "ada@example.com" } });
    await profile.contacts.value!.field.push({
      email: "work@example.com", label: " WORK ", phones: ["123", "456"],
    });
    const added = profile.contacts.value!.field.items.value[1]!;
    await added.fields.value.label.normalize();
    await profile.form.validate();
    return profile.form.values.value;
  } finally {
    await profile.dispose();
  }
}
// #endregion edit

// #region sharing
export const EmailEditor = staticModel({
  name: "DocsEmailEditor",
  data: { email: refs.one(Email).policy("nullify") },
  setup(self) {
    return { form: createForm({ schema: () => ({ email: self.email.value!.field }) }) };
  },
});

export function shareEmail(app: Scope, profile: InstanceOf<typeof Profile>) {
  return scoped(app, () => EmailEditor.create({ email: profile.email.value!.id }));
}
// #endregion sharing

// #region restore
export function transferProfile(server: Scope, profile: InstanceOf<typeof Profile>) {
  const payload = { dto: profile.json(), snapshot: serialize(server) };
  const received = JSON.parse(JSON.stringify(payload)) as typeof payload;
  const client = scope({ snapshot: received.snapshot });
  const restored = scoped(client, () => Profile.create(received.dto));
  return { client, restored };
}
// #endregion restore
